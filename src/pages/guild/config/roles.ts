import type { APIRoute } from 'astro';

import { getLink } from '../../../lib/links';
import { ServiceError } from '../../../lib/service-error';
import { noticeCodeFor } from '../../../lib/service-notice';
import type { RaidLeadRoles } from '../../../lib/service-types';

export const prerender = false;

/**
 * Replaces the guild's raid-lead roles. A whole-set write, not a per-role toggle: the
 * form submits every box that is ticked, so an empty submission means "nobody", which is
 * a legitimate thing to want and has to be distinguishable from "no change".
 *
 * The transition is read from a response fetched here rather than from a hidden field.
 * An href in a form would let a browser aim this dashboard's shared API key at any path
 * on the service, and the absence of an edit link is still the answer for anyone who is
 * not a server admin.
 */
export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const { session, actor, client } = locals;
  if (!session?.selectedGuildId || !actor) {
    return redirect('/guild');
  }

  const back = (notice: string) => redirect(`/guild/config?notice=${notice}`);

  const form = await request.formData();
  const roleIds = form
    .getAll('role_ids')
    .filter((value): value is string => typeof value === 'string');

  try {
    const current = await client.get<RaidLeadRoles>(
      actor,
      `/api/guilds/${session.selectedGuildId}/raid-lead-roles`,
    );
    const replace = getLink(current, 'replace');
    if (!replace) {
      return back('denied');
    }

    // The form always submits the highest role, and the service refuses the write
    // without it. Not re-derived here: which role is highest is the service's answer,
    // and a second copy of that rule in this repo is the drift HATEOAS exists to avoid.
    await client.follow(actor, replace, { role_ids: roleIds });
    return back('saved');
  } catch (error) {
    if (error instanceof ServiceError && error.status === 400) {
      return back(error.serviceMessage.includes('highest role') ? 'lockout' : 'invalid');
    }
    return back(noticeCodeFor(error));
  }
};
