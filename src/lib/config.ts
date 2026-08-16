import {
  DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET,
  DISCORD_REDIRECT_URI,
  SERVICE_API_KEY,
  SERVICE_BASE_URL,
  SESSION_SECRET,
} from 'astro:env/server';

import type { OAuthConfig } from './discord-oauth';
import { ServiceClient } from './service-client';

/**
 * Server-only configuration, read through astro:env so that importing any of it from
 * an island fails the build instead of shipping a shared API key to a browser.
 */

export const serviceClient = new ServiceClient(SERVICE_BASE_URL, SERVICE_API_KEY);

export const oauthConfig: OAuthConfig = {
  clientId: DISCORD_CLIENT_ID,
  clientSecret: DISCORD_CLIENT_SECRET,
  redirectUri: DISCORD_REDIRECT_URI,
};

export const sessionSecret = SESSION_SECRET;

/**
 * Whether to mark cookies Secure. Taken from the redirect URI rather than NODE_ENV,
 * since that is the one place the deployment already had to state its own scheme, and
 * a Secure cookie on plain http is silently dropped.
 */
export const cookiesSecure = DISCORD_REDIRECT_URI.startsWith('https://');
