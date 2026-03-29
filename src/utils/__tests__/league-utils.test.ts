import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resolveLeagueName } from '../league-utils';

describe('resolveLeagueName', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
  });

  it('returns default name for known league IDs', () => {
    expect(resolveLeagueName('314')).toBe('Overall');
    expect(resolveLeagueName('321')).toBe('Second Chance');
    expect(resolveLeagueName('276')).toBe('Gameweek 1');
  });

  it('returns "Overall" for unknown league IDs when no manager data', () => {
    expect(resolveLeagueName('999')).toBe('Overall');
  });

  it('returns league name from localStorage when available', () => {
    const managerData = {
      leagues: {
        classic: [
          { id: 123, name: 'My Custom League' },
          { id: 456, name: 'Work League' },
        ],
      },
    };
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify(managerData));

    expect(resolveLeagueName('123')).toBe('My Custom League');
    expect(resolveLeagueName('456')).toBe('Work League');
  });

  it('falls back to defaults when league not found in stored data', () => {
    const managerData = {
      leagues: {
        classic: [{ id: 123, name: 'Some League' }],
      },
    };
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify(managerData));

    expect(resolveLeagueName('314')).toBe('Overall');
  });

  it('handles invalid JSON in localStorage gracefully', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('not json');
    expect(resolveLeagueName('314')).toBe('Overall');
  });
});
