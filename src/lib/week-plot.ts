/**
 * Geometry for the two weekly charts on the analysis page. Placing a point is arithmetic
 * over dates, not markup, so it lives here and is tested rather than being written twice
 * inside two .astro files.
 *
 * Nothing here decides what a number means. The service already did that; these
 * functions only decide where it lands.
 */

/** One week's place on the horizontal axis. */
export interface WeekSlot {
  /** The RFC 3339 week start the service sent, carried through unparsed. */
  week: string;
  x: number;
  /** Short enough to sit under a tick without turning. */
  label: string;
}

const LOCALE = 'en-GB';
const TICK_FORMAT: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };

/** The stretch of time a chart's axis covers, whatever the data does inside it. */
export interface Window {
  since: string;
  until: string;
}

/**
 * Spaces weeks by the calendar rather than by their position in the array.
 *
 * A guild that skipped a fortnight sends no rows for it, and spacing by index would draw
 * that break as an ordinary step: three weeks of raiding and a month off would look like
 * four weeks of raiding. The gap is the fact worth seeing, so the axis is real time.
 *
 * The axis is the whole window rather than the extent of the data. A guild two weeks
 * into using this has two points, and stretching them edge to edge draws a wedge that
 * claims to be a ninety-day trend. Placed in the real window they sit together at the
 * right-hand end, which is what having two weeks of history actually looks like.
 */
export function weekSlots(weeks: string[], width: number, window?: Window): WeekSlot[] {
  if (weeks.length === 0) {
    return [];
  }

  const times = weeks.map((week) => new Date(week).getTime());
  const first = window ? new Date(window.since).getTime() : times[0]!;
  const last = window ? new Date(window.until).getTime() : times[times.length - 1]!;
  const span = last - first;

  return weeks.map((week, index) => ({
    week,
    // A single week with no window has no span to divide by, and sits in the middle
    // rather than at the left edge, where it would read as the start of a series that
    // never arrived.
    x: span <= 0 ? width / 2 : ((times[index]! - first) / span) * width,
    label: weekLabel(week),
  }));
}

/**
 * The nearest readable interval to rough: 1, 2 or 5 times a power of ten.
 *
 * Nearest, not the next one up. Rounding 11.75 up to 20 halves the number of gridlines
 * and leaves a chart labelled 0/20/40 where 0/10/20/30/40/50 was available.
 */
export function niceStep(rough: number): number {
  if (rough <= 0) {
    return 1;
  }
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const normalised = rough / magnitude;
  return (normalised < 1.5 ? 1 : normalised < 3 ? 2 : normalised < 7 ? 5 : 10) * magnitude;
}

/**
 * Every week start in the window, as x positions.
 *
 * A guild two weeks into using this has two weeks of data in a ninety-day frame, and
 * the eighty-seven percent of empty chart either side reads as something broken. Drawn
 * against a week grid it reads as what it is: thirteen weeks, two of which had raids.
 * Weeks with nothing in them are not filled with zeroes, because "we took the week off"
 * and "we were not using this yet" are different facts and neither of them is a zero.
 */
export function weekTicks(window: Window, width: number): number[] {
  const first = new Date(window.since).getTime();
  const last = new Date(window.until).getTime();
  const span = last - first;
  if (span <= 0) {
    return [];
  }

  const ticks: number[] = [];
  // Walk from the first Monday at or after the window opens. Anchoring on Monday keeps
  // the grid lined up with the buckets the service groups by.
  const cursor = new Date(first);
  cursor.setUTCHours(0, 0, 0, 0);
  cursor.setUTCDate(cursor.getUTCDate() + ((8 - cursor.getUTCDay()) % 7));
  while (cursor.getTime() <= last) {
    ticks.push(((cursor.getTime() - first) / span) * width);
    cursor.setUTCDate(cursor.getUTCDate() + 7);
  }
  return ticks;
}

/**
 * A y placement for values in [min, max] over a plot of the given height, in SVG
 * coordinates where 0 is the top.
 *
 * A flat series has no range to spread over and is drawn along the middle, which is the
 * honest picture: a roster whose item level did not move should read as a straight line,
 * not as a line pinned to the floor or the ceiling of the chart.
 */
export function verticalScale(min: number, max: number, height: number): (value: number) => number {
  const span = max - min;
  if (span <= 0) {
    return () => height / 2;
  }
  return (value) => height - ((value - min) / span) * height;
}

/**
 * Round values to label a y-axis with, from zero up to at least max.
 *
 * Steps land on 1, 2 or 5 times a power of ten, because those are the intervals people
 * read without doing arithmetic: 0/10/20/30 is a scale, 0/7/14/21 is a puzzle.
 */
export function niceTicks(max: number, count = 4): number[] {
  if (max <= 0 || count < 1) {
    return [0];
  }

  const rough = max / count;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const normalised = rough / magnitude;
  // Nearest nice step, not the next one up: rounding 11.75 up to 20 halves the number of
  // gridlines and leaves a chart labelled 0/20/40 where 0/10/20/30/40/50 was available.
  const step = (normalised < 1.5 ? 1 : normalised < 3 ? 2 : normalised < 7 ? 5 : 10) * magnitude;

  // The top tick sits at or above max, never below it: a gridline under the tallest bar
  // is a scale the chart has already outgrown.
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let value = 0; value <= top + step / 2; value += step) {
    ticks.push(Math.round(value * 1000) / 1000);
  }
  return ticks;
}

/**
 * Rounds a range outwards to whole numbers with a little air above and below, so a
 * median line never sits welded to the top edge of its own chart.
 */
export function paddedRange(values: number[]): { min: number; max: number } {
  if (values.length === 0) {
    return { min: 0, max: 1 };
  }
  const low = Math.min(...values);
  const high = Math.max(...values);
  // A flat series still needs a band to sit in, and one item level either side is the
  // smallest amount of gear that means anything.
  const pad = high === low ? 1 : (high - low) * 0.15;
  return { min: Math.floor(low - pad), max: Math.ceil(high + pad) };
}

function weekLabel(week: string): string {
  const date = new Date(week);
  if (Number.isNaN(date.getTime())) {
    return week;
  }
  // UTC, because the service buckets weeks with date_trunc in UTC. Rendering the tick
  // in a guild's timezone would move a Monday bucket to the Sunday before it.
  return new Intl.DateTimeFormat(LOCALE, { ...TICK_FORMAT, timeZone: 'UTC' }).format(date);
}
