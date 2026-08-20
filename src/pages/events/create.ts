import type { APIRoute } from 'astro';

import { fetchGuildTimezone, guildTimeToInstant } from '../../lib/guild-time';
import { ServiceError } from '../../lib/service-error';
import { noticeCodeFor } from '../../lib/service-notice';
import type { Event } from '../../lib/service-types';

export const prerender = false;

/** Mirrors the bot's default, so a raid lead gets the same event from either door. */
const DEFAULT_SIGNUP_WINDOW_MS = 60 * 60 * 1000;

const SIZES = ['tanks', 'healers', 'max_melee', 'max_ranged'] as const;

function text(form: FormData, field: string): string {
  const value = form.get(field);
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Reads one of the comp size boxes. Empty stays absent rather than becoming zero: the
 * service derives what it is not told, and "no tanks" is a different instruction from
 * "you decide".
 */
function size(form: FormData, field: string): number | undefined {
  const raw = text(form, field);
  if (raw === '') {
    return undefined;
  }
  const value = Number(raw);
  return Number.isInteger(value) && value >= 0 ? value : undefined;
}

/**
 * Creates an event and asks the service to have the bot post its signup sheet.
 *
 * The guild id comes from the sealed session, never from the form. Whether this raider
 * may create anything is the service's answer alone: the page renders its form from the
 * create-event link, and the POST is refused here without it regardless.
 */
export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const { session, actor, client } = locals;
  if (!session?.selectedGuildId || !actor) {
    return redirect('/guild');
  }

  const back = (notice: string) => redirect(`/events/new?notice=${notice}`);

  const form = await request.formData();
  const title = text(form, 'title');
  const type = text(form, 'type');
  if (title === '' || (type !== 'RAID' && type !== 'MYTHIC_PLUS')) {
    return back('invalid');
  }

  // Both times are typed as wall clock in the guild's zone, so they cannot be read
  // without it. A guild that has set none gets UTC, which is what the bot does.
  const timezone = await fetchGuildTimezone(client, actor, session.selectedGuildId);

  const startsAt = guildTimeToInstant(text(form, 'starts_at'), timezone);
  if (!startsAt) {
    return back('invalid');
  }

  const typed = text(form, 'signup_deadline');
  const deadline =
    typed === ''
      ? new Date(startsAt.getTime() - DEFAULT_SIGNUP_WINDOW_MS)
      : guildTimeToInstant(typed, timezone);
  if (!deadline) {
    return back('invalid');
  }
  // The same refusal the bot makes. Signups closing after the pull is not a state the
  // rest of the product has an answer for, and it reads as a typo every time.
  if (deadline.getTime() > startsAt.getTime()) {
    return back('backwards');
  }

  const compTemplate: Record<string, number> = {};
  for (const field of SIZES) {
    const value = size(form, field);
    if (value !== undefined) {
      compTemplate[field] = value;
    }
  }

  // The form hides the difficulty field for a Mythic+ group, but a hidden field is still
  // a submitted one, and a dungeon carrying a raid difficulty would read back as one.
  const difficulty = type === 'RAID' ? text(form, 'difficulty') : '';
  const reminder = text(form, 'reminder_lead_minutes');

  try {
    const { body: event } = await client.request<Event>(
      actor,
      'POST',
      `/api/guilds/${session.selectedGuildId}/events`,
      {
        type,
        title,
        starts_at: startsAt.toISOString(),
        signup_deadline: deadline.toISOString(),
        comp_template: compTemplate,
        ...(difficulty === '' ? {} : { difficulty }),
        ...(reminder === '' ? {} : { reminder_lead_minutes: Number(reminder) }),
        // Nobody here can write in Discord. This is what has the bot put the signup
        // sheet up in the guild's events channel; without it the event would exist with
        // no message, and every reminder after it would have nowhere to speak.
        announce: true,
      },
    );
    return redirect(`/events/${event.id}`);
  } catch (error) {
    if (error instanceof ServiceError && error.status === 409) {
      return back('nochannel');
    }
    if (error instanceof ServiceError && error.status === 403) {
      return back('denied');
    }
    if (error instanceof ServiceError && error.status === 400) {
      return back('invalid');
    }
    return back(noticeCodeFor(error));
  }
};
