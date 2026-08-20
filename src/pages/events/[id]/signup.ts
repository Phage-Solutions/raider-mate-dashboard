import type { APIRoute } from 'astro';

import { getLink } from '../../../lib/links';
import { noticeCodeFor } from '../../../lib/service-notice';
import type { Character, Event, Signup } from '../../../lib/service-types';

export const prerender = false;

/**
 * Writes one signup status on behalf of the signed-in raider.
 *
 * The form carries a character id and a status, and nothing else. It deliberately does
 * not carry the link to follow: a hidden field holding an href would let a browser aim
 * this dashboard's shared API key at any path on the service. The transition is read
 * from a response fetched here instead, so the absence of a link is still the answer.
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
  const status = form.get('status');
  if (typeof characterId !== 'string' || typeof status !== 'string') {
    return back('failed');
  }

  try {
    const event = await client.get<Event>(actor, `/api/events/${eventId}`);
    const signups = (await client.follow<Signup[]>(actor, getLink(event, 'signups')!)).body;
    const existing = signups.find((signup) => signup.character_id === characterId);

    let written: { status: number };
    if (existing) {
      const self = getLink(existing, 'self');
      if (!self) {
        return back('denied');
      }
      written = await client.follow(actor, self, { status });
    } else {
      // No signup row means no resource, so no link to follow. The path is built here,
      // but the id is not taken on trust: it has to be one the service just listed as
      // this raider's own, which also makes it impossible for a form field to reach a
      // path of its own choosing.
      const mine = await client.get<Character[]>(
        actor,
        `/api/users/${session.discordId}/characters`,
      );
      if (!mine.some((character) => character.id === characterId)) {
        return back('denied');
      }
      written = await client.request(
        actor,
        'PUT',
        `/api/events/${eventId}/signups/${characterId}`,
        { status },
      );
    }

    // 202 is a late request filed against a closed event, not the status the raider
    // asked for. Reporting it as done would have them turn up to a raid they are not on.
    return back(written.status === 202 ? 'late' : undefined);
  } catch (error) {
    return back(noticeCodeFor(error));
  }
};
