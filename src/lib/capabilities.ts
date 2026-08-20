import type { Actor } from './actor';
import { hasLink } from './links';
import type { ServiceClient } from './service-client';
import type { GuildCapabilities } from './service-types';

/**
 * What the service says this raider may do in a guild. Two separate answers because the
 * service treats them separately: configuring a guild is open to Discord admins as well
 * as raid leads, while running a raid belongs to the mapped raid-lead roles alone.
 */
export interface GuildAbilities {
  configure: boolean;
  createEvents: boolean;
}

/**
 * Asks the service what this raider may do in a guild, or null when the question could
 * not be put at all.
 *
 * Read from the links rather than from the booleans beside them: a link is the
 * transition the service offered, and reading the flags instead would put the rules
 * "admin or raid lead" and "raid lead only" back into this repo, where they would drift
 * the moment the service changed its mind.
 *
 * Null is the important return. A wrong API key, a service too old to have the route, a
 * service that is down: none of those are a statement about this raider, and an earlier
 * version of this function turned all of them into `false`. That answer then went into
 * the session cookie and outlived the outage that produced it, locking people out of a
 * page they could still open by typing its address. Not knowing has to stay
 * distinguishable from being told no, so the caller can retry instead of caching a
 * failure.
 */
export async function fetchGuildAbilities(
  client: ServiceClient,
  actor: Actor,
  guildId: string,
): Promise<GuildAbilities | null> {
  try {
    const capabilities = await client.get<GuildCapabilities>(
      actor,
      `/api/guilds/${guildId}/capabilities`,
    );
    return {
      configure: hasLink(capabilities, 'configure'),
      createEvents: hasLink(capabilities, 'create-event'),
    };
  } catch {
    return null;
  }
}
