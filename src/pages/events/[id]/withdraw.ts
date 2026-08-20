import type { APIRoute } from 'astro';

import { getLink } from '../../../lib/links';
import { noticeCodeFor } from '../../../lib/service-notice';
import type { Event, Signup } from '../../../lib/service-types';

export const prerender = false;

/**
 * Withdraws one signup. Same shape as the signup route, and for the same reason: the
 * form names a character, and the transition comes from a response fetched here rather
 * than from a hidden field the browser could rewrite.
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
  const characterId = form.get('character_id');
  if (typeof characterId !== 'string') {
    return back('failed');
  }

  try {
    const event = await client.get<Event>(actor, `/api/events/${eventId}`);
    const signups = (await client.follow<Signup[]>(actor, getLink(event, 'signups')!)).body;
    const existing = signups.find((signup) => signup.character_id === characterId);
    if (!existing) {
      return back('gone');
    }

    const withdraw = getLink(existing, 'withdraw');
    if (!withdraw) {
      return back('denied');
    }

    const { status } = await client.follow(actor, withdraw);
    return back(status === 202 ? 'late' : undefined);
  } catch (error) {
    return back(noticeCodeFor(error));
  }
};
