import { describe, expect, it } from 'vitest';

import { getLink, hasLink, type Linked } from './links';

// A raid lead's view of an auto comp: it can be locked, but not saved over.
const autoComp: Linked = {
  _links: {
    self: { href: '/api/events/e/comps/main' },
    lock: { href: '/api/events/e/comps/main/lock', method: 'POST' },
    mode: { href: '/api/events/e/comps/main/mode', method: 'PUT' },
  },
};

describe('hasLink', () => {
  it('finds a transition the service offered', () => {
    expect(hasLink(autoComp, 'lock')).toBe(true);
  });

  it('reports absence for a transition the service withheld', () => {
    expect(hasLink(autoComp, 'save')).toBe(false);
  });
});

describe('getLink', () => {
  it('returns href and method together', () => {
    expect(getLink(autoComp, 'lock')).toEqual({
      href: '/api/events/e/comps/main/lock',
      method: 'POST',
    });
  });

  it('returns undefined rather than throwing, since absence is the answer', () => {
    expect(getLink(autoComp, 'save')).toBeUndefined();
  });

  it('leaves a GET transition without a method', () => {
    expect(getLink(autoComp, 'self')?.method).toBeUndefined();
  });
});
