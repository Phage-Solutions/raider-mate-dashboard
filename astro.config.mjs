import node from '@astrojs/node';
import { defineConfig, envField } from 'astro/config';

// Every route is server-rendered. Auth is enforced in middleware before a page runs,
// and a prerendered page would have no request to check.
export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  // The node adapter would otherwise start a filesystem-backed session store nothing
  // here uses. Session state is the sealed cookie in src/lib/session.ts and the API.
  session: false,
  env: {
    schema: {
      // All of these are declared secret, including the two that are only URLs.
      // Astro inlines public variables into the build and reads secrets at runtime,
      // and one container image has to run in dev, staging and production without a
      // rebuild. Secrecy is not the reason; build portability is.
      SERVICE_BASE_URL: envField.string({ context: 'server', access: 'secret' }),
      SERVICE_API_KEY: envField.string({ context: 'server', access: 'secret' }),
      DISCORD_CLIENT_ID: envField.string({ context: 'server', access: 'secret' }),
      DISCORD_CLIENT_SECRET: envField.string({ context: 'server', access: 'secret' }),
      DISCORD_REDIRECT_URI: envField.string({ context: 'server', access: 'secret' }),
      SESSION_SECRET: envField.string({ context: 'server', access: 'secret' }),
    },
  },
});
