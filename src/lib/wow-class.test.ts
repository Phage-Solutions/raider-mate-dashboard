import { describe, expect, it } from 'vitest';
import { classColor } from './wow-class';

describe('classColor', () => {
  it('reads the spellings the service might send', () => {
    expect(classColor('Death Knight')).toBe('#c41e3a');
    expect(classColor('DEATH_KNIGHT')).toBe('#c41e3a');
    expect(classColor('deathknight')).toBe('#c41e3a');
  });

  it('returns null for a class it does not know', () => {
    // A new class ships with every expansion. Rendering no marker is honest; guessing
    // a colour puts the wrong one in a raid frame.
    expect(classColor('Tinkerer')).toBeNull();
  });

  it('returns null when the character has no class yet', () => {
    expect(classColor(undefined)).toBeNull();
    expect(classColor('')).toBeNull();
  });
});
