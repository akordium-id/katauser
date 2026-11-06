import { describe, it, expect } from 'vitest';
import { createChangelogSchema } from '../src/schemas/changelog';

describe('Changelog Schemas Validation', () => {
  it('validates a correct changelog creation payload', () => {
    const valid = {
      title: 'v1.2.0: Dark Mode & CSV Export',
      slug: 'v1-2-0-dark-mode-csv-export',
      content: 'We are thrilled to release dark mode and CSV export capabilities.',
      postIds: ['post_1', 'post_2'],
      publishedAt: new Date().toISOString(),
    };
    const parsed = createChangelogSchema.parse(valid);
    expect(parsed.title).toBe('v1.2.0: Dark Mode & CSV Export');
    expect(parsed.postIds).toHaveLength(2);
  });

  it('rejects empty title or content', () => {
    expect(() =>
      createChangelogSchema.parse({
        title: '',
        slug: 'test',
        content: 'content',
      })
    ).toThrow();
  });

  it('allows optional postIds array', () => {
    const validWithoutPosts = {
      title: 'Performance improvements',
      slug: 'performance-improvements',
      content: 'Reduced load times across the application.',
    };
    const parsed = createChangelogSchema.parse(validWithoutPosts);
    expect(parsed.postIds).toBeUndefined();
  });
});

