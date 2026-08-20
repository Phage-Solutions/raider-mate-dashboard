/**
 * Who a request is being made on behalf of. The service trusts this dashboard about
 * all four facts and resolves raid-lead capability itself against the guild's mapped
 * roles, so what travels here is what Discord said, never what it means.
 *
 * Snowflakes stay strings. They exceed 2^53 and do not survive JavaScript's number
 * type, which is the same reason the service keeps them strings on the wire.
 */
export interface Actor {
  discordId: string;
  guildId: string;
  roleIds: string[];
  guildAdmin: boolean;
}

/**
 * An actor for the one call made before a guild is chosen: asking the service which
 * guilds it knows this person in.
 *
 * The service parses a guild header on every API request, so this sends 0, which is not
 * a snowflake any guild can have. The route it is for ignores the actor's guild by
 * design, because it is asked precisely to find out which guild to work in, and it
 * refuses to answer about anybody but the caller. Nothing else may use this.
 */
export function actorBeforeGuildChosen(discordId: string): Actor {
  return { discordId, guildId: '0', roleIds: [], guildAdmin: false };
}

/**
 * The four headers requireAuth in the service parses. Nothing here may originate in
 * the browser: the service performs no verification of its own, so a guild id taken
 * from a query string would be a tenant boundary the caller chooses for themselves.
 */
export function actorHeaders(actor: Actor): Record<string, string> {
  const headers: Record<string, string> = {
    'X-Actor-Discord-Id': actor.discordId,
    'X-Actor-Guild-Id': actor.guildId,
    'X-Actor-Guild-Admin': String(actor.guildAdmin),
  };
  // The service rejects an empty entry in the list, so an actor with no roles sends no
  // header rather than an empty one.
  if (actor.roleIds.length > 0) {
    headers['X-Actor-Roles'] = actor.roleIds.join(',');
  }
  return headers;
}
