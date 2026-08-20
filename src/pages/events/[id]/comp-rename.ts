import type { APIRoute } from 'astro';

import { findComp } from '../../../lib/comps';
import { getLink } from '../../../lib/links';
import { ServiceError } from '../../../lib/service-error';
import { noticeCodeFor } from '../../../lib/service-notice';
import type { CompInfo } from '../../../lib/service-types';

export const prerender = false;

/**
 * Renames a comp.
 *
 * The slots come with it, so this is a label change and not a rebuild. The service
 * answers with the name it actually stored, which is not always the one that was sent:
 * it trims, and the redirect has to land on the comp that now exists rather than on the
 * string the raid lead typed.
 */
export const POST: APIRoute = async ({ request, params, locals, redirect }) => {
  const { session, actor, client } = locals;
  if (!session?.selectedGuildId || !actor) {
    return redirect('/guild');
  }

  const eventId = params.id!;
  const form = await request.formData();
  const name = form.get('name');
  const newName = form.get('new_name');

  const builder = (comp: string, notice?: string) =>
    redirect(
      `/events/${eventId}/comp/${encodeURIComponent(comp)}${notice ? `?notice=${notice}` : ''}`,
    );

  if (typeof name !== 'string' || typeof newName !== 'string') {
    return redirect(`/events/${eventId}?notice=failed`);
  }

  try {
    const comp = await findComp(client, actor, eventId, name);
    if (!comp) {
      return redirect(`/events/${eventId}?notice=gone`);
    }

    const link = getLink(comp, 'rename');
    if (!link) {
      return builder(name, 'denied');
    }

    const { body } = await client.follow<CompInfo>(actor, link, { name: newName });
    return builder(body.name);
  } catch (error) {
    if (error instanceof ServiceError) {
      // 409 is the only refusal a raid lead can do anything about, and "pick another
      // name" is a different sentence from "that went wrong".
      if (error.status === 409) {
        return builder(name, 'taken');
      }
      if (error.status === 400) {
        return builder(name, 'badname');
      }
    }
    return builder(name, noticeCodeFor(error));
  }
};
