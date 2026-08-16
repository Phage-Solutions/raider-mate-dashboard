import type { APIRoute } from 'astro';

import { cookiesSecure, oauthConfig } from '../../lib/config';
import { authorizeUrl } from '../../lib/discord-oauth';
import { OAUTH_STATE_COOKIE, stateCookieOptions } from '../../lib/session';

export const prerender = false;

export const GET: APIRoute = ({ cookies, redirect }) => {
  // The state nonce is what stops someone else's authorization code being planted in
  // this browser. The callback refuses anything that does not match the cookie.
  const state = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64url');
  cookies.set(OAUTH_STATE_COOKIE, state, stateCookieOptions(cookiesSecure));

  return redirect(authorizeUrl(oauthConfig, state));
};
