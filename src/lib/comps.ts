import type { Actor } from './actor';
import { getLink } from './links';
import type { ServiceClient } from './service-client';
import type { CompInfo, Event } from './service-types';

/**
 * The named comp as the service just described it, links and all.
 *
 * Every comp write goes through here first. The name arrives in a form field, and
 * matching it against the list the service returned is what stops a crafted field
 * reaching a path of its own choosing: the link that gets followed comes from the
 * response, never from the browser. Same reasoning as the signup route, written out at
 * src/pages/events/[id]/signup.ts.
 *
 * Null means the event has no comp by that name, which is also the answer for a comp in
 * another guild: the event fetch 404s first.
 */
export async function findComp(
  client: ServiceClient,
  actor: Actor | null,
  eventId: string,
  name: string,
): Promise<CompInfo | null> {
  const event = await client.get<Event>(actor, `/api/events/${eventId}`);
  const comps = (await client.follow<CompInfo[]>(actor, getLink(event, 'comps')!)).body;
  return comps.find((comp) => comp.name === name) ?? null;
}
