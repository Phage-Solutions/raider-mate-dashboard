import type { APIRoute } from 'astro';

import { findComp } from '../../../lib/comps';
import { getLink } from '../../../lib/links';
import { noticeCodeFor } from '../../../lib/service-notice';
import type { CompInfo } from '../../../lib/service-types';

export const prerender = false;

/**
 * Converts a comp between assigner-owned and raid-lead-owned.
 *
 * This is the action that opens the builder. The service sends a `save` link only for a
 * manual comp, so flipping the mode is literally what turns a read-only board into an
 * editable one, and a full reload afterwards is the honest render of a resource whose
 * links just changed.
 *
 * The slots are left alone by the conversion, which is the point: a raid lead locks an
 * auto comp, flips it, and hand-edits the assigner's output as a starting board.
 */
export const POST: APIRoute = async ({ request, params, locals, redirect }) => {
  const { session, actor, client } = locals;
  if (!session?.selectedGuildId || !actor) {
    return redirect('/guild');
  }

  const eventId = params.id!;
  const form = await request.formData();
  const name = form.get('name');
  const mode = form.get('mode');

  const back = (notice?: string) =>
    redirect(
      notice
        ? `/events/${eventId}?notice=${notice}`
        : `/events/${eventId}/comp/${encodeURIComponent(String(name))}`,
    );

  if (typeof name !== 'string' || (mode !== 'AUTO' && mode !== 'MANUAL')) {
    return back('failed');
  }

  try {
    const comp = await findComp(client, actor, eventId, name);
    if (!comp) {
      return back('gone');
    }

    const link = getLink(comp, 'mode');
    if (!link) {
      return back('denied');
    }

    const { body } = await client.follow<CompInfo>(actor, link, { mode });

    // Landing on the builder is only right if the comp came back editable. Converting
    // back to auto has nowhere to go but the event.
    return body.mode === 'MANUAL' ? back() : redirect(`/events/${eventId}`);
  } catch (error) {
    return back(noticeCodeFor(error));
  }
};
