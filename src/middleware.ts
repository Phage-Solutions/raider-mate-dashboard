import { defineMiddleware } from 'astro:middleware';

import type { Actor } from './lib/actor';
import { cookiesSecure, oauthConfig, serviceClient, sessionSecret } from './lib/config';
import { DiscordError, fetchGuildRoleIds, refreshTokens } from './lib/discord-oauth';
import type { Session } from './lib/session';
import {
  ACTOR_TTL_MS,
  openSession,
  sealSession,
  SESSION_COOKIE,
  sessionCookieOptions,
} from './lib/session';

/**
 * Routes reachable signed out. Everything else redirects to /login before the page
 * runs: auth is enforced here, server-side, never by a check inside a page that has
 * already rendered.
 */
const PUBLIC_PATHS = new Set(['/login', '/auth/discord', '/auth/callback']);

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.has(pathname) || pathname.startsWith('/_');
}

/**
 * Brings the session's Discord facts back up to date when they have aged out, and
 * returns null when Discord says the session is no longer usable. Returns the session
 * unchanged when nothing needed doing, so the caller can tell whether to re-seal.
 */
async function refreshSession(session: Session): Promise<Session | null> {
  let current = session;

  if (Date.now() >= current.tokenExpiresAt) {
    try {
      const tokens = await refreshTokens(oauthConfig, current.refreshToken);
      current = {
        ...current,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiresAt: tokens.expiresAt,
      };
    } catch {
      // A refresh token Discord will not honour is a session that is over. Sign out
      // rather than carrying tokens that fail on every later call.
      return null;
    }
  }

  if (current.selectedGuildId && Date.now() - current.actorFetchedAt >= ACTOR_TTL_MS) {
    try {
      const roleIds = await fetchGuildRoleIds(current.accessToken, current.selectedGuildId);
      current = { ...current, roleIds, actorFetchedAt: Date.now() };
    } catch (error) {
      // The raider left the guild, or was removed from it. Drop the selection and let
      // them pick again; keeping stale role ids would hand the service facts Discord
      // no longer agrees with.
      if (error instanceof DiscordError && (error.status === 403 || error.status === 404)) {
        current = {
          ...current,
          selectedGuildId: null,
          selectedGuildName: null,
          roleIds: [],
          guildAdmin: false,
        };
      }
      // Anything else is Discord being unreachable. The existing facts are within a
      // refresh interval of correct, so the request proceeds on them.
    }
  }

  return current;
}

function actorFor(session: Session): Actor | null {
  if (!session.selectedGuildId) {
    return null;
  }
  return {
    discordId: session.discordId,
    guildId: session.selectedGuildId,
    roleIds: session.roleIds,
    guildAdmin: session.guildAdmin,
  };
}

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.client = serviceClient;
  context.locals.session = null;
  context.locals.actor = null;

  const sealed = context.cookies.get(SESSION_COOKIE)?.value;
  if (sealed) {
    const opened = await openSession(sealed, sessionSecret);
    const session = opened ? await refreshSession(opened) : null;

    if (session) {
      if (session !== opened) {
        context.cookies.set(
          SESSION_COOKIE,
          await sealSession(session, sessionSecret),
          sessionCookieOptions(cookiesSecure),
        );
      }
      context.locals.session = session;
      context.locals.actor = actorFor(session);
    } else {
      context.cookies.delete(SESSION_COOKIE, { path: '/' });
    }
  }

  if (!context.locals.session && !isPublic(context.url.pathname)) {
    return context.redirect('/login');
  }

  return next();
});
