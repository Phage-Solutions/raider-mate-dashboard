import { describe, expect, it } from 'vitest';

import { formatEventTime, formatSignupWindow, guildTimeToInstant } from './guild-time';

// 20:00 in Berlin on a summer evening, sent by the service as UTC.
const STARTS_AT = '2026-08-20T18:00:00Z';

describe('formatEventTime', () => {
  it('renders the guild clock time rather than the sent offset', () => {
    const formatted = formatEventTime(STARTS_AT, 'Europe/Berlin');
    expect(formatted).toContain('20:00');
    expect(formatted).toContain('20 Aug');
  });

  it('moves the time for a guild in another timezone', () => {
    expect(formatEventTime(STARTS_AT, 'America/New_York')).toContain('14:00');
  });

  it('falls back to what the service sent when the guild set no timezone', () => {
    expect(formatEventTime(STARTS_AT, null)).toBe(STARTS_AT);
  });

  it('falls back rather than throwing on a timezone Intl refuses', () => {
    expect(formatEventTime(STARTS_AT, 'Middle/Earth')).toBe(STARTS_AT);
  });

  it('falls back rather than throwing on a timestamp it cannot parse', () => {
    expect(formatEventTime('soon', 'Europe/Berlin')).toBe('soon');
  });
});

describe('formatSignupWindow', () => {
  const now = new Date('2026-08-20T12:00:00Z');

  it('counts down in minutes inside the last hour', () => {
    expect(formatSignupWindow('2026-08-20T12:41:00Z', now)).toBe('in 41 minutes');
  });

  it('counts down in hours inside the day', () => {
    expect(formatSignupWindow('2026-08-20T18:00:00Z', now)).toBe('in 6 hours');
  });

  it('counts down in days beyond that', () => {
    expect(formatSignupWindow('2026-08-23T12:00:00Z', now)).toBe('in 3 days');
  });

  it('says so once the deadline has passed', () => {
    expect(formatSignupWindow('2026-08-20T11:59:00Z', now)).toBe('Closed');
  });

  it('falls back rather than throwing on a timestamp it cannot parse', () => {
    expect(formatSignupWindow('soon', now)).toBe('soon');
  });
});

describe('guildTimeToInstant', () => {
  it('reads a typed time as the guild is standing in it', () => {
    // 20:00 in Prague in January is 19:00 UTC, and the same wall clock in July is 18:00.
    expect(guildTimeToInstant('2026-01-15T20:00', 'Europe/Prague')?.toISOString()).toBe(
      '2026-01-15T19:00:00.000Z',
    );
    expect(guildTimeToInstant('2026-07-15T20:00', 'Europe/Prague')?.toISOString()).toBe(
      '2026-07-15T18:00:00.000Z',
    );
  });

  it('lands the right side of a DST boundary', () => {
    // The hour the clocks go forward in the EU, 2026-03-29. A single-pass conversion
    // measures the offset at the wrong instant and puts this an hour out.
    expect(guildTimeToInstant('2026-03-29T04:00', 'Europe/Prague')?.toISOString()).toBe(
      '2026-03-29T02:00:00.000Z',
    );
  });

  it('reads a guild with no timezone as UTC, which is what the bot does', () => {
    expect(guildTimeToInstant('2026-01-15T20:00', null)?.toISOString()).toBe(
      '2026-01-15T20:00:00.000Z',
    );
  });

  it('refuses anything that is not a time', () => {
    expect(guildTimeToInstant('', 'Europe/Prague')).toBeNull();
    expect(guildTimeToInstant('tomorrow 20:00', 'Europe/Prague')).toBeNull();
    expect(guildTimeToInstant('2026-01-15T20:00', 'Not/AZone')).toBeNull();
  });
});
