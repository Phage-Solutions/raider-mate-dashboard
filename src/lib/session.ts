/**
 * The dashboard session: an AES-GCM sealed cookie, no server-side store.
 *
 * What it holds is deliberately small. The user's Discord guild list is fetched live
 * when it is needed rather than kept here, because a raider in fifty guilds would push
 * the cookie past the 4KB browser limit and start failing in a way that looks like a
 * login bug.
 *
 * Never localStorage or sessionStorage. Session state is this cookie and the API.
 */

import type { GuildAbilities } from './capabilities';

export const SESSION_COOKIE = 'rm_session';
export const OAUTH_STATE_COOKIE = 'rm_oauth_state';

/**
 * Current payload shape. Bump it to invalidate every session on a breaking change.
 *
 * 2 added mayConfigure. A field added without a bump reads as undefined out of an older
 * cookie, which is falsy, so everyone already signed in silently lost the configuration
 * page until their actor facts next refreshed.
 *
 * 3 made mayConfigure nullable, so that a failed lookup is no longer cached as a denial.
 * The bump also flushes the false values version 2 wrote during exactly that failure.
 *
 * 4 replaced it with abilities, which carries creating events as well as configuring.
 */
const SESSION_VERSION = 4;

/** A week, matching Discord's own access token lifetime. */
const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

/**
 * How long the actor facts are trusted before they are read from Discord again. A
 * raider promoted to raid lead mid-session waits at most this long for the dashboard
 * to notice. The service re-resolves raid-lead capability from these role ids on every
 * request, so the staleness window is entirely here.
 */
export const ACTOR_TTL_MS = 15 * 60 * 1000;

export interface Session {
  v: number;
  discordId: string;
  username: string;
  avatar: string | null;
  accessToken: string;
  refreshToken: string;
  /** Epoch milliseconds. */
  tokenExpiresAt: number;
  /** Null until a guild is picked. Everything guild-scoped reads this, never a param. */
  selectedGuildId: string | null;
  /** Carried so the header can name the guild without a Discord round trip per page. */
  selectedGuildName: string | null;
  /** Role ids in the selected guild. Empty when no guild is picked. */
  roleIds: string[];
  /** Discord's ADMINISTRATOR permission in the selected guild. */
  guildAdmin: boolean;
  /**
   * What the service offered this raider in the selected guild. Resolved there, from the
   * guild's mapped raid-lead roles, and cached here on the same clock as the role ids.
   * Never recomputed from roleIds: who counts as a raid lead is the service's rule, and
   * a second copy of it here is exactly the drift HATEOAS exists to avoid.
   *
   * Null means the question could not be put, which is not the same as a no.
   */
  abilities: GuildAbilities | null;
  /** Epoch milliseconds the role ids and admin flag were last read from Discord. */
  actorFetchedAt: number;
  /**
   * Guild ids this raider picked before, most recent first, capped at RECENT_GUILDS.
   * Ids only: the names come back with Discord's guild list on the one page that shows
   * them, and duplicating them here would grow the cookie for nothing.
   *
   * Added without a version bump because an older cookie reading undefined here means
   * an empty history, which is the correct answer for a session that predates the
   * field, not a silently withdrawn capability.
   */
  recentGuildIds?: string[];
}

/** How many picks back the guild picker remembers. */
const RECENT_GUILDS = 5;

/**
 * The picked guild moved to the front, with any earlier appearance dropped so a guild
 * cannot hold two places in the history.
 */
export function rememberGuild(recent: string[] | undefined, guildId: string): string[] {
  return [guildId, ...(recent ?? []).filter((id) => id !== guildId)].slice(0, RECENT_GUILDS);
}

const IV_BYTES = 12;

function toBase64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64url');
}

// Copied into a fresh Uint8Array rather than wrapping the Buffer's own memory: a
// Buffer's backing store is a shared pool slice, which Web Crypto's types reject and
// which would hand neighbouring allocations to subtle.decrypt if the offset were ever
// wrong.
function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const decoded = Buffer.from(value, 'base64url');
  const bytes = new Uint8Array(decoded.byteLength);
  bytes.set(decoded);
  return bytes;
}

async function importKey(secret: string): Promise<CryptoKey> {
  const raw = Buffer.from(secret, 'base64');
  if (raw.length !== 32) {
    throw new Error('SESSION_SECRET must be 32 bytes, base64 encoded: openssl rand -base64 32');
  }
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function sealSession(session: Session, secret: string): Promise<string> {
  const key = await importKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const plaintext = new TextEncoder().encode(JSON.stringify(session));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext),
  );

  const sealed = new Uint8Array(iv.length + ciphertext.length);
  sealed.set(iv);
  sealed.set(ciphertext, iv.length);
  return toBase64Url(sealed);
}

/**
 * Opens a sealed session, or returns null. A tampered, truncated, or stale-format
 * cookie reads as signed out rather than as an error: there is no case where the right
 * answer is to trust part of it.
 */
export async function openSession(sealed: string, secret: string): Promise<Session | null> {
  try {
    const bytes = fromBase64Url(sealed);
    if (bytes.length <= IV_BYTES) {
      return null;
    }
    const key = await importKey(secret);
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: bytes.subarray(0, IV_BYTES) },
      key,
      bytes.subarray(IV_BYTES),
    );
    const session = JSON.parse(new TextDecoder().decode(plaintext)) as Session;
    return session.v === SESSION_VERSION ? session : null;
  } catch {
    return null;
  }
}

export function newSession(
  fields: Omit<
    Session,
    | 'v'
    | 'selectedGuildId'
    | 'selectedGuildName'
    | 'roleIds'
    | 'guildAdmin'
    | 'abilities'
    | 'actorFetchedAt'
    | 'recentGuildIds'
  >,
): Session {
  return {
    v: SESSION_VERSION,
    selectedGuildId: null,
    selectedGuildName: null,
    roleIds: [],
    guildAdmin: false,
    abilities: null,
    actorFetchedAt: 0,
    recentGuildIds: [],
    ...fields,
  };
}

export interface CookieOptions {
  httpOnly: true;
  secure: boolean;
  sameSite: 'lax';
  path: string;
  maxAge: number;
}

/**
 * Cookie flags for the session. sameSite lax rather than strict so that returning from
 * Discord's redirect arrives signed in; every state-changing route in this dashboard is
 * a POST, which lax does not send cross-site.
 */
export function sessionCookieOptions(secure: boolean): CookieOptions {
  return {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

/** Ten minutes is longer than any honest trip through Discord's consent screen. */
export function stateCookieOptions(secure: boolean): CookieOptions {
  return {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 10 * 60,
  };
}
