import type { APIRoute } from 'astro';

import { cookiesSecure, oauthConfig, sessionSecret } from '../../lib/config';
import { exchangeCode, fetchUser } from '../../lib/discord-oauth';
import {
  newSession,
  OAUTH_STATE_COOKIE,
  sealSession,
  SESSION_COOKIE,
  sessionCookieOptions,
} from '../../lib/session';

export const prerender = false;

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const expectedState = cookies.get(OAUTH_STATE_COOKIE)?.value;
  cookies.delete(OAUTH_STATE_COOKIE, { path: '/' });

  // Discord sends the raider back here with an error when they decline the consent
  // screen. That is a choice, not a failure.
  if (url.searchParams.has('error')) {
    return redirect('/login?error=denied');
  }

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code || !state || !expectedState || state !== expectedState) {
    return redirect('/login?error=state');
  }

  try {
    const tokens = await exchangeCode(oauthConfig, code);
    const user = await fetchUser(tokens.accessToken);

    const session = newSession({
      discordId: user.id,
      username: user.username,
      avatar: user.avatar,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenExpiresAt: tokens.expiresAt,
    });

    cookies.set(
      SESSION_COOKIE,
      await sealSession(session, sessionSecret),
      sessionCookieOptions(cookiesSecure),
    );
  } catch {
    return redirect('/login?error=discord');
  }

  return redirect('/');
};
