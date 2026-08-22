import type { APIRoute } from 'astro';

import { fetchGuildAbilities } from '../../lib/capabilities';
import { cookiesSecure, sessionSecret } from '../../lib/config';
import { fetchGuildRoleIds, fetchGuilds } from '../../lib/discord-oauth';
import {
  rememberGuild,
  sealSession,
  SESSION_COOKIE,
  sessionCookieOptions,
} from '../../lib/session';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, locals, redirect }) => {
  const session = locals.session;
  if (!session) {
    return redirect('/');
  }

  const form = await request.formData();
  const guildId = form.get('guild_id');
  if (typeof guildId !== 'string') {
    return redirect('/?error=guild');
  }

  // The guild id arrived in a form field, so it is the raider's claim rather than a
  // fact. Everything downstream of this hands it to the service as an actor header the
  // service does not verify, which makes this check the tenant boundary: without it,
  // any snowflake typed into a request reads another guild's roster.
  const guilds = await fetchGuilds(session.accessToken);
  const guild = guilds.find((candidate) => candidate.id === guildId);
  if (!guild) {
    return redirect('/?error=guild');
  }

  const roleIds = await fetchGuildRoleIds(session.accessToken, guild.id);

  // Asked once the role ids are known, because raid-lead capability is resolved from
  // them on the service side.
  const abilities = await fetchGuildAbilities(
    locals.client,
    { discordId: session.discordId, guildId: guild.id, roleIds, guildAdmin: guild.admin },
    guild.id,
  );

  cookies.set(
    SESSION_COOKIE,
    await sealSession(
      {
        ...session,
        selectedGuildId: guild.id,
        selectedGuildName: guild.name,
        roleIds,
        guildAdmin: guild.admin,
        abilities,
        actorFetchedAt: Date.now(),
        recentGuildIds: rememberGuild(session.recentGuildIds, guild.id),
      },
      sessionSecret,
    ),
    sessionCookieOptions(cookiesSecure),
  );

  return redirect('/dashboard');
};
