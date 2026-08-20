import type { APIRoute } from 'astro';

import { getLink } from '../../../lib/links';
import { ServiceError } from '../../../lib/service-error';
import { noticeCodeFor } from '../../../lib/service-notice';
import type { Event } from '../../../lib/service-types';

export const prerender = false;

/**
 * Attaches a WarcraftLogs report to an event, or takes one off when the field is empty.
 *
 * The form carries the URL and nothing else. The transition is read from an event
 * fetched here rather than from a hidden field: an href in a form would let a browser
 * aim this dashboard's shared API key at any path on the service, and the absence of
 * `set-warcraftlogs` is still the answer for a raider who is not a raid lead.
 *
 * Nothing here checks the URL. The service owns what counts as a report link, and a
 * second copy of that rule in this repo is the drift HATEOAS exists to avoid.
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
  const url = form.get('warcraftlogs_url');
  if (typeof url !== 'string') {
    return back('failed');
  }

  try {
    const event = await client.get<Event>(actor, `/api/events/${eventId}`);
    const link = getLink(event, 'set-warcraftlogs');
    if (!link) {
      return back('denied');
    }

    await client.follow(actor, link, { warcraftlogs_url: url.trim() });
    return back();
  } catch (error) {
    // The one 400 a raid lead can cause here, and the only one worth its own sentence:
    // everything else on this route is a permission or a reachability problem.
    if (error instanceof ServiceError && error.status === 400) {
      return back('badlog');
    }
    return back(noticeCodeFor(error));
  }
};
