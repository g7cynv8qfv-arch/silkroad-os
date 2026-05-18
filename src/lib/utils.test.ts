import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('resolves Tailwind conflicts in favour of the last class', () => {
    expect(cn('p-4', 'p-8')).toBe('p-8');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'skipped', 'added')).toBe('base added');
  });
});
