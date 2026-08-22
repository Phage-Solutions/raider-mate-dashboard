import type { APIRoute } from 'astro';

import { fetchGuildTimezone, guildTimeToInstant } from '../../../lib/guild-time';
import { getLink } from '../../../lib/links';
import { ServiceError } from '../../../lib/service-error';
import { noticeCodeFor } from '../../../lib/service-notice';
import type { Event } from '../../../lib/service-types';

export const prerender = false;

const SIZES = ['tanks', 'healers', 'max_melee', 'max_ranged'] as const;

function text(form: FormData, field: string): string {
  const value = form.get(field);
  return typeof value === 'string' ? value.trim() : '';
}

/** Empty stays absent rather than becoming zero, same as the create form. */
function size(form: FormData, field: string): number | undefined {
  const raw = text(form, field);
  if (raw === '') {
    return undefined;
  }
  const value = Number(raw);
  return Number.isInteger(value) && value >= 0 ? value : undefined;
}

/**
 * Edits an event. Raid lead only, and the `edit` link on an event fetched here is the
 * whole of that decision: an href never arrives in a form field, and a raider who is not
 * a raid lead is answered by the link's absence rather than by a 403 from the service.
 *
 * The event's own type decides whether a difficulty is sent, not the form, because a
 * dungeon carrying a raid difficulty would read back as a raid.
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
  const title = text(form, 'title');
  if (title === '') {
    return back('invalid');
  }

  // Both times are typed as wall clock in the guild's zone, so they cannot be read
  // without it. A guild that has set none gets UTC, which is what the bot does.
  const timezone = await fetchGuildTimezone(client, actor, session.selectedGuildId);

  const startsAt = guildTimeToInstant(text(form, 'starts_at'), timezone);
  const deadline = guildTimeToInstant(text(form, 'signup_deadline'), timezone);
  if (!startsAt || !deadline) {
    return back('invalid');
  }
  // The same refusal the create form makes. Signups closing after the pull is not a state
  // the rest of the product has an answer for, and it reads as a typo every time.
  if (deadline.getTime() > startsAt.getTime()) {
    return back('backwards');
  }

  // Sent whole every time, because the service takes the template as one value: a box
  // left empty is "you decide", and only a complete object says so.
  const compTemplate: Record<string, number> = {};
  for (const field of SIZES) {
    const value = size(form, field);
    if (value !== undefined) {
      compTemplate[field] = value;
    }
  }

  const reminder = text(form, 'reminder_lead_minutes');

  try {
    const event = await client.get<Event>(actor, `/api/events/${eventId}`);
    const link = getLink(event, 'edit');
    if (!link) {
      return back('denied');
    }

    const difficulty = event.type === 'RAID' ? text(form, 'difficulty') : '';

    await client.follow(actor, link, {
      title,
      starts_at: startsAt.toISOString(),
      signup_deadline: deadline.toISOString(),
      comp_template: compTemplate,
      ...(difficulty === '' ? {} : { difficulty }),
      ...(reminder === '' ? {} : { reminder_lead_minutes: Number(reminder) }),
    });
    return back('saved');
  } catch (error) {
    if (error instanceof ServiceError && error.status === 403) {
      return back('denied');
    }
    if (error instanceof ServiceError && error.status === 400) {
      return back('invalid');
    }
    return back(noticeCodeFor(error));
  }
};
