/**
 * Blizzard's class colours, the ones every player already reads in a raid frame. The
 * roster and the signup list both show a class, and a raid lead scanning for "do we
 * have a second Priest" finds the colour before they finish reading the word.
 *
 * The colour is rendered as a marker beside the class name, never as the text colour:
 * Death Knight red and Rogue yellow do not clear 4.5:1 on this background, and a
 * roster that has to be squinted at is worse than one with no colour at all.
 */

const COLORS: Record<string, string> = {
  DEATHKNIGHT: '#c41e3a',
  DEMONHUNTER: '#a330c9',
  DRUID: '#ff7c0a',
  EVOKER: '#33937f',
  HUNTER: '#aad372',
  MAGE: '#3fc7eb',
  MONK: '#00ff98',
  PALADIN: '#f48cba',
  PRIEST: '#ffffff',
  ROGUE: '#fff468',
  SHAMAN: '#0070dd',
  WARLOCK: '#8788ee',
  WARRIOR: '#c69b6d',
};

/**
 * The colour for a class name, or null when the service sent something this map does
 * not know. A new class ships with every expansion and an unknown one renders without a
 * marker rather than guessing a colour.
 *
 * Accepts whatever spelling arrives: "Death Knight", "DEATH_KNIGHT" and "deathknight"
 * are the same class, and this repo does not get to insist on one.
 */
export function classColor(name: string | undefined): string | null {
  if (!name) {
    return null;
  }
  const key = name.replace(/[^a-zA-Z]/g, '').toUpperCase();
  return COLORS[key] ?? null;
}
