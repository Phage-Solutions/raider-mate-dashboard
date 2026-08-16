import type { APIRoute } from 'astro';

import { cookiesSecure, sessionSecret } from '../../lib/config';
import { fetchGuildRoleIds, fetchGuilds } from '../../lib/discord-oauth';
import { sealSession, SESSION_COOKIE, sessionCookieOptions } from '../../lib/session';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, locals, redirect }) => {
  const session = locals.session;
  if (!session) {
    return redirect('/login');
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

  cookies.set(
    SESSION_COOKIE,
    await sealSession(
      {
        ...session,
        selectedGuildId: guild.id,
        selectedGuildName: guild.name,
        roleIds,
        guildAdmin: guild.admin,
        actorFetchedAt: Date.now(),
      },
      sessionSecret,
    ),
    sessionCookieOptions(cookiesSecure),
  );

  return redirect('/');
};
