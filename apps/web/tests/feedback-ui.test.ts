import { describe, it, expect } from 'vitest';
import { formatPostStatus, getStatusBadgeColor } from '../src/lib/feedback-helpers';

describe('Feedback UI Helpers', () => {
  it('formats status strings for display', () => {
    expect(formatPostStatus('in_progress')).toBe('In Progress');
    expect(formatPostStatus('under_review')).toBe('Under Review');
    expect(formatPostStatus('planned')).toBe('Planned');
    expect(formatPostStatus('completed')).toBe('Completed');
    expect(formatPostStatus('closed')).toBe('Closed');
  });

  it('assigns appropriate badge color classes per status', () => {
    expect(getStatusBadgeColor('planned')).toContain('blue');
    expect(getStatusBadgeColor('in_progress')).toContain('amber');
    expect(getStatusBadgeColor('completed')).toContain('emerald');
  });
});

