import type { APIRoute } from 'astro';

import { findComp } from '../../../lib/comps';
import { getLink } from '../../../lib/links';
import { ServiceError } from '../../../lib/service-error';
import { noticeCodeFor } from '../../../lib/service-notice';

export const prerender = false;

/**
 * Runs the assigner over a comp again, rebuilding every slot from the signups as they
 * stand now.
 *
 * First step of the documented path: re-lock so the board reflects who is actually
 * coming, then convert to manual and edit that. A manual comp has no `lock` link at
 * all, because recomputing it would throw a raid lead's work away.
 */
export const POST: APIRoute = async ({ request, params, locals, redirect }) => {
  const { session, actor, client } = locals;
  if (!session?.selectedGuildId || !actor) {
    return redirect('/guild');
  }

  const eventId = params.id!;
  const back = (notice?: string) =>
    redirect(`/events/${eventId}${notice ? `?notice=${notice}` : ''}`);

  const form = await request.formData();
  const name = form.get('name');
  if (typeof name !== 'string') {
    return back('failed');
  }

  try {
    const comp = await findComp(client, actor, eventId, name);
    if (!comp) {
      return back('gone');
    }

    const link = getLink(comp, 'lock');
    if (!link) {
      return back('denied');
    }

    await client.follow(actor, link);
    return back();
  } catch (error) {
    // 409 is the one refusal worth its own sentence: the comp went manual between the
    // page rendering and the button being pressed, and "failed" would not say why.
    if (error instanceof ServiceError && error.status === 409) {
      return back('manual');
    }
    return back(noticeCodeFor(error));
  }
};
