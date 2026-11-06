import { describe, it, expect } from 'vitest';
import {
  isRootDomain,
  resolveCustomDomain,
  rewritePathForCustomDomain,
} from '../src/lib/domain-router';

describe('Custom Domain Routing in SvelteKit', () => {
  it('identifies root SaaS platform domains vs customer custom domains', () => {
    expect(isRootDomain('katauser.com')).toBe(true);
    expect(isRootDomain('app.katauser.com')).toBe(true);
    expect(isRootDomain('localhost:5173')).toBe(true);
    expect(isRootDomain('127.0.0.1')).toBe(true);

    expect(isRootDomain('feedback.acme.com')).toBe(false);
    expect(isRootDomain('ideas.startup.io')).toBe(false);
  });

  it('resolves custom domain to workspace slug', () => {
    expect(resolveCustomDomain('feedback.acme.com')).toBe('acme');
    expect(resolveCustomDomain('ideas.startup.io')).toBe('startup');
  });

  it('rewrites public portal paths transparently for custom domains', () => {
    const slug = 'acme';

    // Root path rewrites to default feedback board
    expect(rewritePathForCustomDomain('/', slug)).toBe('/b/acme/general');

    // Roadmap path
    expect(rewritePathForCustomDomain('/roadmap', slug)).toBe('/roadmap/acme');

    // Changelog path
    expect(rewritePathForCustomDomain('/changelog', slug)).toBe('/changelog/acme');

    // Does not rewrite static assets or internal endpoints
    expect(rewritePathForCustomDomain('/_app/immutable/test.js', slug)).toBe(
      '/_app/immutable/test.js'
    );
    expect(rewritePathForCustomDomain('/api/health', slug)).toBe('/api/health');
  });
});

