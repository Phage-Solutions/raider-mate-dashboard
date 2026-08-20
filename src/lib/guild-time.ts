import type { Actor } from './actor';
import type { ServiceClient } from './service-client';
import { ServiceError, ServiceUnreachableError } from './service-error';
import type { GuildSettings } from './service-types';

/**
 * Raid times are rendered in the guild's timezone, not the viewer's and not the
 * server's. A raid lead announces "Thursday at 20:00" in Discord, and a dashboard that
 * says 19:00 to someone travelling is a dashboard nobody trusts on a raid night.
 */

/**
 * The guild's timezone, or null when it has not set one. A service that will not answer
 * returns null rather than throwing: a missing timezone is a worse-looking timestamp,
 * not a reason to blank a page whose real content loaded.
 */
export async function fetchGuildTimezone(
  client: ServiceClient,
  actor: Actor | null,
  guildId: string,
): Promise<string | null> {
  try {
    const settings = await client.get<GuildSettings>(actor, `/api/guilds/${guildId}/settings`);
    return settings.timezone ?? null;
  } catch (error) {
    if (error instanceof ServiceError || error instanceof ServiceUnreachableError) {
      return null;
    }
    throw error;
  }
}

// en-GB rather than the server's locale, which is whatever the container happened to
// boot with and would move the day and month around between deployments.
const LOCALE = 'en-GB';

const FORMAT: Intl.DateTimeFormatOptions = {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZoneName: 'short',
};

/**
 * Formats an RFC 3339 timestamp in the given timezone. Falls back to the string the
 * service sent when there is no timezone, or when the timezone or the timestamp is one
 * Intl refuses: an offset a raider has to read is better than a page that throws.
 */
export function formatEventTime(iso: string, timezone: string | null): string {
  if (!timezone) {
    return iso;
  }
  try {
    return new Intl.DateTimeFormat(LOCALE, { ...FORMAT, timeZone: timezone }).format(new Date(iso));
  } catch {
    return iso;
  }
}

const RELATIVE = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto', style: 'long' });

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * How long is left to sign up, as one short phrase. A raid lead reading a list of
 * fourteen raids wants "in 41 minutes" to jump out of a column of "in 6 days"; the exact
 * deadline is still on the row as a real timestamp.
 *
 * Computed at request time, which is honest for a server-rendered page: it is correct
 * when the page arrives and the page says the absolute time too.
 */
export function formatSignupWindow(iso: string, now: Date = new Date()): string {
  const deadline = new Date(iso).getTime();
  if (Number.isNaN(deadline)) {
    return iso;
  }

  const delta = deadline - now.getTime();
  if (delta <= 0) {
    return 'Closed';
  }
  if (delta < HOUR) {
    return RELATIVE.format(Math.round(delta / MINUTE), 'minute');
  }
  if (delta < DAY) {
    return RELATIVE.format(Math.round(delta / HOUR), 'hour');
  }
  return RELATIVE.format(Math.round(delta / DAY), 'day');
}

const LOCAL_INPUT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2})?$/;

/**
 * How far ahead of UTC `timeZone` is at a given instant, in milliseconds. Read back out
 * of Intl rather than from a table, so the answer is right either side of a DST change
 * without this repo shipping a copy of the tz database.
 */
function offsetAt(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant);

  const field = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);

  const wallClock = Date.UTC(
    field('year'),
    field('month') - 1,
    field('day'),
    field('hour'),
    field('minute'),
    field('second'),
  );
  return wallClock - instant.getTime();
}

/**
 * Reads what a raid lead typed into a `datetime-local` field as a moment in the guild's
 * timezone, and returns the instant to send the service. Null when the field is not a
 * time at all, or when the timezone is one Intl refuses.
 *
 * The guild's zone, never the browser's and never the server's, for the same reason the
 * rest of this file formats in it: a raid lead in Prague typing 20:00 means the 20:00
 * their guild raids at, and a dashboard that quietly reads it as the container's UTC
 * would post the raid an hour out.
 *
 * A guild that has set no timezone gets UTC, which is what the bot does with a time
 * carrying no offset.
 */
export function guildTimeToInstant(local: string, timeZone: string | null): Date | null {
  const match = LOCAL_INPUT.exec(local.trim());
  if (!match) {
    return null;
  }
  const [, year, month, day, hour, minute] = match;
  const asUTC = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
  );

  if (!timeZone) {
    return new Date(asUTC);
  }

  try {
    // Two passes. The first offset is measured at the wrong instant, since the right one
    // is what we are solving for, and that is wrong by an hour only for a time within a
    // DST shift of the boundary. The second pass, measured at the corrected instant,
    // lands on the answer.
    const first = new Date(asUTC - offsetAt(new Date(asUTC), timeZone));
    return new Date(asUTC - offsetAt(first, timeZone));
  } catch {
    return null;
  }
}
