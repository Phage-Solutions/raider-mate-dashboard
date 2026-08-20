/**
 * The fixed outward-facing addresses and marks. They appear on the landing page, in the
 * public footer and in the legal pages, which is three call sites and one fact each.
 *
 * Both logo paths are inline rather than fetched: the Caddyfile's CSP allows no external
 * image host but Discord's CDN, and a link to GitHub is one of the few places another
 * party's mark is the clearest label available.
 */

/** The company behind the hosted instance. */
export const COMPANY_URL = 'https://phage.sk';

export const ORG_URL = 'https://github.com/Raider-Mate';

export const REPOS = [
  { label: 'Service', href: `${ORG_URL}/raider-mate-service` },
  { label: 'Discord bot', href: `${ORG_URL}/raider-mate-discord-bot` },
  { label: 'Dashboard', href: `${ORG_URL}/raider-mate-dashboard` },
];

/**
 * The bot's public install link. A guild starts here rather than at sign-in: nothing
 * reaches the dashboard until the bot is posting events in a channel.
 */
export const BOT_INVITE = 'https://discord.com/oauth2/authorize?client_id=1537567534201569452';

export const GITHUB_MARK =
  'M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8Z';

export const DISCORD_MARK =
  'M20.32 1.53A19.8 19.8 0 0 0 15.43.02a13.9 13.9 0 0 0-.63 1.28 18.4 18.4 0 0 0-5.47 0A13.6 13.6 0 0 0 8.7.02a19.7 19.7 0 0 0-4.9 1.51C.71 6.13-.13 10.62.29 15.04a19.9 19.9 0 0 0 6 3.03c.48-.66.91-1.36 1.28-2.1a13 13 0 0 1-2.02-.96l.5-.39a14.2 14.2 0 0 0 12.05 0l.5.39c-.64.38-1.32.7-2.02.97.37.73.8 1.43 1.28 2.09a19.8 19.8 0 0 0 6.01-3.03c.5-5.13-.85-9.58-3.55-13.51ZM8.02 12.33c-1.18 0-2.15-1.08-2.15-2.4 0-1.33.95-2.41 2.15-2.41 1.2 0 2.17 1.09 2.15 2.4 0 1.33-.95 2.41-2.15 2.41Zm7.95 0c-1.18 0-2.15-1.08-2.15-2.4 0-1.33.95-2.41 2.15-2.41 1.21 0 2.17 1.09 2.15 2.4 0 1.33-.94 2.41-2.15 2.41Z';
