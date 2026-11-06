import { describe, it, expect } from 'vitest';
import { formatChangelogDate, getChangelogTagMeta } from '../src/lib/changelog-helpers';

describe('Changelog UI Helpers', () => {
  it('formats dates consistently', () => {
    const formatted = formatChangelogDate('2026-11-06T00:00:00.000Z');
    expect(formatted).toContain('2026');
  });

  it('provides color and label meta for release tags', () => {
    const newFeature = getChangelogTagMeta('feature');
    expect(newFeature.label).toBe('New Feature');
    expect(newFeature.badgeClass).toContain('emerald');

    const improvement = getChangelogTagMeta('improvement');
    expect(improvement.label).toBe('Improvement');
    expect(improvement.badgeClass).toContain('blue');

    const fix = getChangelogTagMeta('fix');
    expect(fix.label).toBe('Bug Fix');
    expect(fix.badgeClass).toContain('rose');
  });
});

