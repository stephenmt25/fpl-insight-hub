import { describe, it, expect } from 'vitest';
import { getPositionLabel } from '../player-utils';

describe('getPositionLabel', () => {
  it('returns GK for element type 1', () => {
    expect(getPositionLabel(1)).toBe('GK');
  });

  it('returns DEF for element type 2', () => {
    expect(getPositionLabel(2)).toBe('DEF');
  });

  it('returns MID for element type 3', () => {
    expect(getPositionLabel(3)).toBe('MID');
  });

  it('returns FWD for element type 4', () => {
    expect(getPositionLabel(4)).toBe('FWD');
  });

  it('returns empty string for unknown type', () => {
    expect(getPositionLabel(0)).toBe('');
    expect(getPositionLabel(99)).toBe('');
  });
});
