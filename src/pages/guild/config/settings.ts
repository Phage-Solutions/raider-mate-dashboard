import type { APIRoute } from 'astro';

import { getLink } from '../../../lib/links';
import { ServiceError } from '../../../lib/service-error';
import { noticeCodeFor } from '../../../lib/service-notice';
import type { GuildSettings } from '../../../lib/service-types';

export const prerender = false;

/** An empty field means "not set", which the service reads as null rather than "". */
function optional(form: FormData, field: string): string | null {
  const value = form.get(field);
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}

/**
 * Saves the guild's event settings. Every field is sent every time, because the form
 * shows every field: a partial write here would make clearing one of them impossible.
 */
export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const { session, actor, client } = locals;
  if (!session?.selectedGuildId || !actor) {
    return redirect('/guild');
  }

  const back = (notice: string) => redirect(`/guild/config?notice=${notice}`);

  const form = await request.formData();
  const lead = optional(form, 'reminder_lead_minutes');
  const parsedLead = lead === null ? null : Number.parseInt(lead, 10);
  if (parsedLead !== null && Number.isNaN(parsedLead)) {
    return back('invalid');
  }

  try {
    const current = await client.get<GuildSettings>(
      actor,
      `/api/guilds/${session.selectedGuildId}/settings`,
    );
    const replace = getLink(current, 'replace');
    if (!replace) {
      return back('denied');
    }

    await client.follow(actor, replace, {
      events_channel_id: optional(form, 'events_channel_id'),
      timezone: optional(form, 'timezone'),
      // Always sent, empty included: "ping nobody" and "not configured" are different
      // answers and the service keeps them apart.
      event_mention_role_ids: form
        .getAll('event_mention_role_ids')
        .filter((value): value is string => typeof value === 'string'),
      reminder_lead_minutes: parsedLead,
      reminder_delivery: optional(form, 'reminder_delivery'),
    });
    return back('saved');
  } catch (error) {
    if (error instanceof ServiceError && error.status === 400) {
      return back('invalid');
    }
    return back(noticeCodeFor(error));
  }
};
