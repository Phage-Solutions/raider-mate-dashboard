import type { Actor } from './actor';
import type { ServiceClient } from './service-client';
import type { Character } from './service-types';

/**
 * Finds one of the signed-in raider's own characters, with the links the service
 * attached to it.
 *
 * The service has no `GET /api/characters/{cid}`: a character is only ever handed out
 * as part of a list, so this reads the caller's own list and picks from it. That is not
 * a workaround, it is the ownership check. The list is scoped to the actor's guild and
 * carries the `roles`, `edit` and `delete` links only where the service decided this
 * caller may use them, so a character id belonging to somebody else simply is not in it.
 */
export async function findOwnCharacter(
  client: ServiceClient,
  actor: Actor,
  discordId: string,
  characterId: string,
): Promise<Character | undefined> {
  const mine = await client.get<Character[]>(actor, `/api/users/${discordId}/characters`);
  return mine.find((character) => character.id === characterId);
}
