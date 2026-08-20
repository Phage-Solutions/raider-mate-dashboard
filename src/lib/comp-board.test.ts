import { describe, expect, it } from 'vitest';

import { cardsFor, columnOf, differs, move, seatedCount, stateFrom, toSave } from './comp-board';
import type { Board, Role, Signup } from './service-types';

function signup(id: string, name: string, roles: Role[], status: Signup['status']): Signup {
  return {
    _links: {},
    id: `signup-${id}`,
    character_id: id,
    character: {
      id,
      name,
      realm: 'Ravencrest',
      raiderio_url: '',
      roles: roles.map((role, index) => ({ role, priority: index })),
      is_main: true,
    },
    status,
  };
}

function board(slots: Array<[string, Role, boolean]>): Board {
  return {
    _links: {},
    name: 'Mythic',
    mode: 'MANUAL',
    slots: slots.map(([character_id, role, is_bench], index) => ({
      character_id,
      role,
      slot_index: index,
      is_bench,
      reason: 'MANUAL: placed by a raid lead',
    })),
  };
}

const SIGNUPS = [
  signup('a', 'Thalia', ['TANK'], 'CONFIRMED'),
  signup('b', 'Bryn', ['HEALER', 'RDPS'], 'CONFIRMED'),
  signup('c', 'Corvin', ['MDPS'], 'TENTATIVE'),
];

describe('cardsFor', () => {
  it('reads name, class data and declared roles off the signup', () => {
    const cards = cardsFor(board([]), SIGNUPS);

    expect(cards).toHaveLength(3);
    expect(cards[0]).toMatchObject({
      characterId: 'a',
      name: 'Thalia',
      declaredRoles: ['TANK'],
      status: 'CONFIRMED',
    });
  });

  it('orders declared roles by the priority the raider gave them', () => {
    const [, bryn] = cardsFor(board([]), SIGNUPS);

    expect(bryn!.declaredRoles).toEqual(['HEALER', 'RDPS']);
  });

  // The service accepts a placement for someone who never signed up, so a board can
  // arrive holding one. A tray built from signups alone would drop them on the next save.
  it('keeps a raider who is on the board but never signed up', () => {
    const cards = cardsFor(board([['ghost', 'RDPS', false]]), SIGNUPS);

    expect(cards.map((card) => card.characterId)).toContain('ghost');
    expect(cards.find((card) => card.characterId === 'ghost')?.status).toBeNull();
  });
});

describe('stateFrom', () => {
  it('seats the board and trays everyone else', () => {
    const given = board([
      ['a', 'TANK', false],
      ['b', 'HEALER', true],
    ]);
    const state = stateFrom(given, cardsFor(given, SIGNUPS));

    expect(state.columns.TANK).toEqual(['a']);
    expect(state.columns.BENCH).toEqual(['b']);
    expect(state.columns.TRAY).toEqual(['c']);
  });

  // A benched raider still carries a role: the service rejects a role-less slot, and
  // this is where a benched tank keeps being a tank.
  it('keeps the role of a benched raider', () => {
    const given = board([['a', 'TANK', true]]);
    const state = stateFrom(given, cardsFor(given, SIGNUPS));

    expect(state.columns.BENCH).toEqual(['a']);
    expect(state.roles.a).toBe('TANK');
  });

  it('opens an unplaced raider on their own first choice', () => {
    const state = stateFrom(board([]), cardsFor(board([]), SIGNUPS));

    expect(state.roles.b).toBe('HEALER');
  });

  it('preserves the order the board was saved in', () => {
    const given = board([
      ['c', 'MDPS', false],
      ['a', 'MDPS', false],
    ]);
    const state = stateFrom(given, cardsFor(given, SIGNUPS));

    expect(state.columns.MDPS).toEqual(['c', 'a']);
  });
});

describe('move', () => {
  const start = stateFrom(board([]), cardsFor(board([]), SIGNUPS));

  it('places a raider and takes the column role', () => {
    const next = move(start, 'a', 'HEALER');

    expect(next.columns.HEALER).toEqual(['a']);
    expect(next.roles.a).toBe('HEALER');
    expect(next.columns.TRAY).not.toContain('a');
  });

  // Nothing here argues. A tank dropped into healers is a healer, with no correction
  // and no warning: a builder that overrides a raid lead gets switched off.
  it('accepts a raider in a role they never declared', () => {
    const next = move(start, 'a', 'RDPS');

    expect(next.columns.RDPS).toEqual(['a']);
    expect(next.roles.a).toBe('RDPS');
  });

  it('keeps the carried role when benching', () => {
    const next = move(move(start, 'a', 'TANK'), 'a', 'BENCH');

    expect(next.columns.BENCH).toEqual(['a']);
    expect(next.roles.a).toBe('TANK');
  });

  it('honours a drop position inside a column', () => {
    const filled = move(move(start, 'a', 'MDPS'), 'b', 'MDPS');
    const next = move(filled, 'c', 'MDPS', 1);

    expect(next.columns.MDPS).toEqual(['a', 'c', 'b']);
  });

  it('clamps a position past the end of a column', () => {
    const next = move(move(start, 'a', 'TANK'), 'b', 'TANK', 99);

    expect(next.columns.TANK).toEqual(['a', 'b']);
  });

  it('leaves a raider in exactly one column', () => {
    const next = move(move(start, 'a', 'TANK'), 'a', 'RDPS');

    expect(next.columns.TANK).toEqual([]);
    expect(columnOf(next, 'a')).toBe('RDPS');
  });

  it('does not mutate the state it was given', () => {
    move(start, 'a', 'TANK');

    expect(start.columns.TANK).toEqual([]);
  });

  it('ignores a raider it has never heard of', () => {
    expect(move(start, 'nobody', 'TANK')).toBe(start);
  });
});

describe('toSave', () => {
  const start = stateFrom(board([]), cardsFor(board([]), SIGNUPS));

  it('sends seated raiders in role order, then the bench', () => {
    const state = move(move(move(start, 'c', 'MDPS'), 'a', 'TANK'), 'b', 'BENCH');

    expect(toSave(state).slots).toEqual([
      { character_id: 'a', role: 'TANK', is_bench: false },
      { character_id: 'c', role: 'MDPS', is_bench: false },
      { character_id: 'b', role: 'HEALER', is_bench: true },
    ]);
  });

  it('leaves the tray out of the board entirely', () => {
    const state = move(start, 'a', 'TANK');

    expect(toSave(state).slots.map((slot) => slot.character_id)).toEqual(['a']);
  });

  // slot_index is the service's to derive, from the submitted order, per is_bench
  // partition. Sending one would be this repo guessing at a value it does not own.
  it('never sends a slot index', () => {
    const state = move(start, 'a', 'TANK');

    expect(Object.keys(toSave(state).slots[0]!)).toEqual(['character_id', 'role', 'is_bench']);
  });

  // The two ways a save is refused outright. Both are unreachable by construction: a
  // raider sits in one column, and every card carries a role.
  it('gives every slot a role and every raider one slot', () => {
    const state = move(move(move(start, 'a', 'TANK'), 'b', 'BENCH'), 'c', 'BENCH');
    const { slots } = toSave(state);
    const ids = slots.map((slot) => slot.character_id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(slots.every((slot) => slot.role)).toBe(true);
  });
});

describe('differs', () => {
  const start = stateFrom(board([]), cardsFor(board([]), SIGNUPS));

  it('sees a placement', () => {
    expect(differs(start, move(start, 'a', 'TANK'))).toBe(true);
  });

  it('sees a reorder inside a column', () => {
    const filled = move(move(start, 'a', 'MDPS'), 'b', 'MDPS');

    expect(differs(filled, move(filled, 'b', 'MDPS', 0))).toBe(true);
  });

  it('ignores a shuffle of the tray, which is not part of the board', () => {
    expect(differs(start, move(start, 'a', 'TRAY', 0))).toBe(false);
  });
});

describe('seatedCount', () => {
  it('counts seated raiders and not the bench or the tray', () => {
    const start = stateFrom(board([]), cardsFor(board([]), SIGNUPS));
    const state = move(move(start, 'a', 'TANK'), 'b', 'BENCH');

    expect(seatedCount(state)).toBe(1);
  });
});
