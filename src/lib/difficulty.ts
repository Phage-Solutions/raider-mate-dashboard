import type { RaidDifficulty } from './service-types';

/**
 * How a raid difficulty is spoken and coloured. Difficulty is what a raid lead sorts by,
 * so difficulty is what gets the colour. Normal has no hue because it is the baseline,
 * not a warning.
 */
export const DIFFICULTY_LABELS: Record<RaidDifficulty, string> = {
  NORMAL: 'Normal',
  HEROIC: 'Heroic',
  MYTHIC: 'Mythic',
};

export const DIFFICULTY_HUES: Record<RaidDifficulty, string | null> = {
  NORMAL: null,
  HEROIC: 'var(--info)',
  MYTHIC: 'var(--role-rdps)',
};
