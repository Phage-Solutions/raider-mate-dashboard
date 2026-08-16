/**
 * Discord OAuth2 and the three reads the dashboard needs from it.
 *
 * The service performs no verification of the actor headers it is sent, so this file
 * is where "who is this and what are they in the guild" is actually established. Every
 * fact that ends up in an X-Actor-* header originates in a response from here.
 */

const DISCORD_API = 'https://discord.com/api/v10';

/**
 * identify gives the user id. guilds gives their guild list and the permission
 * bitfield per guild. guilds.members.read is what makes the per-guild role ids
 * readable, which is the whole basis of raid-lead resolution on the service side.
 */
export const OAUTH_SCOPES = 'identify guilds guilds.members.read';

/** Discord's ADMINISTRATOR permission bit. */
const ADMINISTRATOR = 1n << 3n;

export class DiscordError extends Error {
  readonly status: number;

  constructor(status: number, path: string, body: string) {
    super(`discord returned ${status} for ${path}: ${body}`);
    this.name = 'DiscordError';
    this.status = status;
  }
}

export interface DiscordTokens {
  accessToken: string;
  refreshToken: string;
  /** Epoch milliseconds. */
  expiresAt: number;
}

export interface DiscordUser {
  id: string;
  username: string;
  avatar: string | null;
}

export interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  /** Discord's ADMINISTRATOR bit, already resolved out of the permission bitfield. */
  admin: boolean;
}

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export function authorizeUrl(config: OAuthConfig, state: string): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: OAUTH_SCOPES,
    state,
    // A raider who has already granted these scopes should land back here without
    // being asked again.
    prompt: 'none',
  });
  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

async function postToken(config: OAuthConfig, form: URLSearchParams): Promise<DiscordTokens> {
  form.set('client_id', config.clientId);
  form.set('client_secret', config.clientSecret);

  const response = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new DiscordError(response.status, '/oauth2/token', await response.text());
  }

  const body = (await response.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
  return {
    accessToken: body.access_token,
    refreshToken: body.refresh_token,
    expiresAt: Date.now() + body.expires_in * 1000,
  };
}

export function exchangeCode(config: OAuthConfig, code: string): Promise<DiscordTokens> {
  return postToken(
    config,
    new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.redirectUri,
    }),
  );
}

export function refreshTokens(config: OAuthConfig, refreshToken: string): Promise<DiscordTokens> {
  return postToken(
    config,
    new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }),
  );
}

async function getAsUser<T>(accessToken: string, path: string): Promise<T> {
  const response = await fetch(DISCORD_API + path, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new DiscordError(response.status, path, await response.text());
  }
  return (await response.json()) as T;
}

export async function fetchUser(accessToken: string): Promise<DiscordUser> {
  const user = await getAsUser<{ id: string; username: string; avatar: string | null }>(
    accessToken,
    '/users/@me',
  );
  return { id: user.id, username: user.username, avatar: user.avatar };
}

/**
 * Every guild the user is in, which is not the same as every guild running Raider
 * Mate: the service has no endpoint saying which guilds it knows, so an unregistered
 * guild here simply renders empty.
 */
export async function fetchGuilds(accessToken: string): Promise<DiscordGuild[]> {
  const guilds = await getAsUser<
    { id: string; name: string; icon: string | null; permissions: string }[]
  >(accessToken, '/users/@me/guilds');

  return guilds.map((guild) => ({
    id: guild.id,
    name: guild.name,
    icon: guild.icon,
    // The bitfield is a string because it exceeds 2^53. Parsing it as a number loses
    // the high bits, and ADMINISTRATOR is low enough that the bug would not show until
    // Discord adds another permission.
    admin: (BigInt(guild.permissions) & ADMINISTRATOR) === ADMINISTRATOR,
  }));
}

/**
 * The user's role ids in one guild. This is what guilds.members.read exists for, and
 * what the service maps against guild_raid_lead_roles to decide raid-lead capability.
 */
export async function fetchGuildRoleIds(accessToken: string, guildId: string): Promise<string[]> {
  const member = await getAsUser<{ roles: string[] }>(
    accessToken,
    `/users/@me/guilds/${guildId}/member`,
  );
  return member.roles;
}
