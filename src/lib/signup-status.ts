import type { SignupStatus } from './service-types';

/**
 * How a signup status is spoken and coloured. The event view and the comp builder both
 * show it, and a raid lead reads the colour before they finish reading the word, which
 * is the point of a status column twenty rows long.
 *
 * This is the raider's own self-report and nothing else. Bench is not in here and never
 * will be: it lives on the comp, and a raider can be CONFIRMED and benched at once.
 */
export const STATUS_LABELS: Record<SignupStatus, string> = {
  CONFIRMED: 'Confirmed',
  TENTATIVE: 'Tentative',
  DECLINED: 'Declined',
  LATE: 'Late',
  ABSENT: 'Absent',
  NO_SHOW: 'No show',
};

export const STATUS_HUES: Record<SignupStatus, string> = {
  CONFIRMED: 'var(--success)',
  TENTATIVE: 'var(--info)',
  DECLINED: 'var(--danger)',
  LATE: 'var(--warning)',
  ABSENT: 'var(--text-tertiary)',
  NO_SHOW: 'var(--danger)',
};
