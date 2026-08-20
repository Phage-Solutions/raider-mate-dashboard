import type { Role } from './service-types';

/**
 * How a role is spoken and coloured on this surface. Three screens render role columns
 * now (the event view, the comp builder page, and the builder island), and each had no
 * business keeping its own copy: a role's colour is the same fact everywhere.
 *
 * Tanks first, then healers, then damage. That is the order a raid frame uses and the
 * order a raid lead reads a comp in.
 */
export const ROLE_ORDER: Role[] = ['TANK', 'HEALER', 'MDPS', 'RDPS'];

/** Plural, because these head a column of raiders rather than label one. */
export const ROLE_LABELS: Record<Role, string> = {
  TANK: 'Tanks',
  HEALER: 'Healers',
  MDPS: 'Melee',
  RDPS: 'Ranged',
};

export const ROLE_HUES: Record<Role, string> = {
  TANK: 'var(--role-tank)',
  HEALER: 'var(--role-healer)',
  MDPS: 'var(--role-mdps)',
  RDPS: 'var(--role-rdps)',
};
