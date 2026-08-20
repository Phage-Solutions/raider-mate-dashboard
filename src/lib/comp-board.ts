import { ROLE_ORDER } from './roles';
import type { Board, Role, SaveComp, Signup, SignupStatus } from './service-types';

/**
 * The board a raid lead is editing, as data. This module moves raiders between columns
 * and serialises the result; it decides nothing. Whether a comp is any good, who ought
 * to be benched, and what a legal composition looks like are all questions the service
 * answers or, in the manual case, deliberately declines to answer.
 *
 * Pure on purpose. It is the only part of the builder that can be tested without a
 * browser or a running service, and keeping the rules of "where did that card go" out
 * of the DOM code is what makes the drag and the keyboard path provably agree.
 */

/**
 * Where a raider currently sits. Bench is one tray rather than four, matching how the
 * event view already draws it, but a benched raider still carries the role they would
 * have filled: the service requires one on every placement.
 *
 * TRAY is not a placement. Raiders there are simply not part of the board and are not
 * submitted.
 */
export type Column = Role | 'BENCH' | 'TRAY';

export const COLUMN_ORDER: Column[] = [...ROLE_ORDER, 'BENCH', 'TRAY'];

/** A raider the builder can place, drawn from the signups and from the board itself. */
export interface Card {
  characterId: string;
  name: string;
  realm: string;
  class?: string | undefined;
  spec?: string | undefined;
  ilvl?: number | undefined;
  /** What this raider said they can play, best first. Informational, never a rule. */
  declaredRoles: Role[];
  /**
   * What the raider self-reported, or null when they never signed up. Kept strictly
   * apart from bench: a raider can be CONFIRMED and benched at once, and on this
   * surface that is the ordinary case rather than a contradiction to reconcile.
   */
  status: SignupStatus | null;
}

export interface BoardState {
  /** Ordered character ids per column. An id appears in exactly one. */
  columns: Record<Column, string[]>;
  /**
   * The role each raider carries, kept even while they sit on the bench or in the
   * tray. Holding it here rather than only on a seated slot is what makes a role-less
   * placement impossible to build, which is one of the two ways a save can be rejected.
   */
  roles: Record<string, Role>;
}

/**
 * The role a raider starts on when they have never been placed. Their own first choice
 * where they made one, and RDPS otherwise, because the wire needs some role and the
 * raid lead can move them in one drag. This is a starting position, not a judgement:
 * nothing here works out what anyone ought to play.
 */
function openingRole(card: Card): Role {
  return card.declaredRoles[0] ?? 'RDPS';
}

function emptyColumns(): Record<Column, string[]> {
  return { TANK: [], HEALER: [], MDPS: [], RDPS: [], BENCH: [], TRAY: [] };
}

/**
 * Every raider the builder can place: everyone signed up, plus anyone already on the
 * board who is not. The second half is not hypothetical. The service accepts a
 * placement for a character who never signed up, so a board can legitimately arrive
 * holding one, and a tray built from signups alone would lose them on the next save.
 */
export function cardsFor(board: Board, signups: Signup[]): Card[] {
  const cards = new Map<string, Card>();

  for (const signup of signups) {
    const character = signup.character;
    cards.set(signup.character_id, {
      characterId: signup.character_id,
      name: character?.name ?? signup.character_id,
      realm: character?.realm ?? '',
      class: character?.class,
      spec: character?.spec,
      ilvl: character?.ilvl,
      declaredRoles: (character?.roles ?? [])
        .slice()
        .sort((a, b) => a.priority - b.priority)
        .map((choice) => choice.role),
      status: signup.status,
    });
  }

  for (const slot of board.slots) {
    if (cards.has(slot.character_id)) {
      continue;
    }
    const character = slot.character;
    cards.set(slot.character_id, {
      characterId: slot.character_id,
      name: character?.name ?? slot.character_id,
      realm: character?.realm ?? '',
      class: character?.class,
      spec: character?.spec,
      ilvl: character?.ilvl,
      declaredRoles: (character?.roles ?? [])
        .slice()
        .sort((a, b) => a.priority - b.priority)
        .map((choice) => choice.role),
      status: null,
    });
  }

  return [...cards.values()];
}

/**
 * The opening state: the board as the service sent it, with everyone else in the tray.
 *
 * Slot order is taken as given. The service numbers `slot_index` within each `is_bench`
 * partition in the order the board was written, so reading the array back in order
 * reproduces the arrangement the last raid lead saved.
 */
export function stateFrom(board: Board, cards: Card[]): BoardState {
  const columns = emptyColumns();
  const roles: Record<string, Role> = {};
  const placed = new Set<string>();

  for (const slot of board.slots) {
    if (placed.has(slot.character_id)) {
      // The service rejects a duplicate, so this should not arrive. Dropping the second
      // one keeps the builder from being the thing that sends it back.
      continue;
    }
    placed.add(slot.character_id);
    roles[slot.character_id] = slot.role;
    columns[slot.is_bench ? 'BENCH' : slot.role].push(slot.character_id);
  }

  for (const card of cards) {
    if (placed.has(card.characterId)) {
      continue;
    }
    roles[card.characterId] = openingRole(card);
    columns.TRAY.push(card.characterId);
  }

  // Nothing sorts the tray. The page hands the cards over in the order it wants them
  // read, which is the signup order the event view already uses.
  return { columns, roles };
}

/** Which column a raider is in, or null when the state has never heard of them. */
export function columnOf(state: BoardState, characterId: string): Column | null {
  for (const column of COLUMN_ORDER) {
    if (state.columns[column].includes(characterId)) {
      return column;
    }
  }
  return null;
}

/**
 * Moves one raider to a column, optionally to a position within it. Returns a new
 * state; the caller keeps the old one, which is how a cancelled drag costs nothing.
 *
 * Dropping into a role column sets that role. Dropping onto the bench or back into the
 * tray keeps whatever role they were carrying, so a benched tank stays a tank and comes
 * back as one.
 */
export function move(
  state: BoardState,
  characterId: string,
  to: Column,
  index?: number,
): BoardState {
  if (!(characterId in state.roles)) {
    return state;
  }

  const columns = emptyColumns();
  for (const column of COLUMN_ORDER) {
    columns[column] = state.columns[column].filter((id) => id !== characterId);
  }

  const target = columns[to];
  const at = index === undefined ? target.length : Math.max(0, Math.min(index, target.length));
  target.splice(at, 0, characterId);

  const roles = { ...state.roles };
  if (to !== 'BENCH' && to !== 'TRAY') {
    roles[characterId] = to;
  }

  return { columns, roles };
}

/**
 * The whole board, as the service takes it. Seated raiders in role order, then the
 * bench; the tray is left out because those raiders are not on the comp.
 *
 * Whole board, always. A partial write is what the manual model exists to avoid: two
 * raid leads editing at once resolve to whoever saved last, with no half-applied state
 * to reconcile between them.
 */
export function toSave(state: BoardState): SaveComp {
  const slots = ROLE_ORDER.flatMap((role) =>
    state.columns[role].map((characterId) => ({
      character_id: characterId,
      role,
      is_bench: false,
    })),
  );

  for (const characterId of state.columns.BENCH) {
    slots.push({
      character_id: characterId,
      role: state.roles[characterId]!,
      is_bench: true,
    });
  }

  return { slots };
}

/**
 * Whether two states would save differently. Compares what goes on the wire and nothing
 * else, so shuffling the tray does not light up the save button.
 */
export function differs(a: BoardState, b: BoardState): boolean {
  const key = (state: BoardState) =>
    toSave(state)
      .slots.map((slot) => `${slot.character_id}:${slot.role}:${slot.is_bench}`)
      .join('|');
  return key(a) !== key(b);
}

/** How many raiders are seated, which is the number a raid lead counts before pull. */
export function seatedCount(state: BoardState): number {
  return ROLE_ORDER.reduce((total, role) => total + state.columns[role].length, 0);
}
