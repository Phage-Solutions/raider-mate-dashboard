import { describe, expect, it } from 'vitest';

import { niceStep, niceTicks, paddedRange, verticalScale, weekSlots, weekTicks } from './week-plot';

describe('weekSlots', () => {
  it('spaces weeks by the calendar so a skipped fortnight shows as a gap', () => {
    // Three raid weeks with a month off in the middle. Spaced by index these would sit
    // at 0, 50 and 100; spaced by the calendar the break is visible.
    const slots = weekSlots(
      ['2026-06-01T00:00:00Z', '2026-06-08T00:00:00Z', '2026-07-06T00:00:00Z'],
      100,
    );

    expect(slots.map((slot) => Math.round(slot.x))).toEqual([0, 20, 100]);
  });

  it('puts a lone week in the middle rather than against the left edge', () => {
    const slots = weekSlots(['2026-06-01T00:00:00Z'], 100);

    expect(slots).toHaveLength(1);
    expect(slots[0]!.x).toBe(50);
  });

  it('labels a tick in UTC, which is how the service buckets a week', () => {
    const slots = weekSlots(['2026-08-17T00:00:00Z'], 100);

    expect(slots[0]!.label).toBe('17 Aug');
  });

  it('has nothing to place for an empty series', () => {
    expect(weekSlots([], 100)).toEqual([]);
  });

  it('places weeks in the whole window rather than stretching them across it', () => {
    // Two weeks of history in a ninety-day window belong at the right-hand end. Without
    // the window they would sit at 0 and 100 and draw as a ninety-day trend.
    const slots = weekSlots(['2026-08-10T00:00:00Z', '2026-08-17T00:00:00Z'], 100, {
      since: '2026-05-24T00:00:00Z',
      until: '2026-08-22T00:00:00Z',
    });

    expect(slots.map((slot) => Math.round(slot.x))).toEqual([87, 94]);
  });

  it('puts a lone week where it happened, not in the middle, when a window is given', () => {
    const slots = weekSlots(['2026-08-17T00:00:00Z'], 100, {
      since: '2026-05-24T00:00:00Z',
      until: '2026-08-22T00:00:00Z',
    });

    expect(Math.round(slots[0]!.x)).toBe(94);
  });
});

describe('weekTicks', () => {
  const window = { since: '2026-05-24T00:00:00Z', until: '2026-08-22T00:00:00Z' };

  it('marks every week in the window, not just the ones with data', () => {
    // Ninety days is thirteen Mondays. The chart draws a calendar, so a guild with two
    // weeks of history can see how much window it has not filled yet.
    expect(weekTicks(window, 100)).toHaveLength(13);
  });

  it('anchors on Monday, the bucket the service groups by', () => {
    // 24 May 2026 is a Sunday, so the first Monday is the 25th: one day into ninety.
    const [first] = weekTicks(window, 900);

    expect(Math.round(first!)).toBe(10);
  });

  it('has no grid to draw for a window with no width', () => {
    expect(weekTicks({ since: window.until, until: window.until }, 100)).toEqual([]);
  });
});

describe('verticalScale', () => {
  it('puts the top of the range at the top of the plot', () => {
    const y = verticalScale(600, 640, 200);

    expect(y(640)).toBe(0);
    expect(y(600)).toBe(200);
    expect(y(620)).toBe(100);
  });

  it('draws a flat series along the middle rather than on the floor', () => {
    const y = verticalScale(620, 620, 200);

    expect(y(620)).toBe(100);
  });
});

describe('niceTicks', () => {
  it('steps on numbers a reader does not have to do arithmetic on', () => {
    expect(niceTicks(47)).toEqual([0, 10, 20, 30, 40, 50]);
  });

  it('scales down for small counts', () => {
    expect(niceTicks(4)).toEqual([0, 1, 2, 3, 4]);
  });

  it('scales up for large ones', () => {
    expect(niceTicks(880)).toEqual([0, 200, 400, 600, 800, 1000]);
  });

  it('has one tick for a chart with nothing in it', () => {
    expect(niceTicks(0)).toEqual([0]);
  });
});

describe('niceStep', () => {
  it('rounds to the nearest readable interval, not the next one up', () => {
    expect(niceStep(11.75)).toBe(10);
    expect(niceStep(2.2)).toBe(2);
    expect(niceStep(220)).toBe(200);
  });

  it('never returns zero, which would loop forever at a call site', () => {
    expect(niceStep(0)).toBe(1);
    expect(niceStep(-5)).toBe(1);
  });
});

describe('paddedRange', () => {
  it('rounds outwards so a line does not weld itself to an edge', () => {
    const range = paddedRange([600, 640]);

    expect(range.min).toBeLessThan(600);
    expect(range.max).toBeGreaterThan(640);
  });

  it('gives a flat series a band to sit in', () => {
    expect(paddedRange([620])).toEqual({ min: 619, max: 621 });
  });

  it('has a usable range for no values at all', () => {
    expect(paddedRange([])).toEqual({ min: 0, max: 1 });
  });
});
