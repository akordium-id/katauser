import { describe, it, expect } from 'vitest';
import {
  domainVerifySchema,
  sanitizeDomain,
  isApexOrSubdomain,
} from '../src/schemas/domain';

describe('Domain Schemas & Validation Helpers', () => {
  it('validates a valid custom domain query payload', () => {
    const valid = {
      domain: 'feedback.acme.com',
      workspaceSlug: 'acme-corp',
    };
    const parsed = domainVerifySchema.parse(valid);
    expect(parsed.domain).toBe('feedback.acme.com');
    expect(parsed.workspaceSlug).toBe('acme-corp');
  });

  it('rejects invalid domain strings', () => {
    expect(() =>
      domainVerifySchema.parse({
        domain: 'not a valid domain!@#$',
        workspaceSlug: 'acme',
      })
    ).toThrow();
  });

  it('sanitizes domain inputs properly', () => {
    expect(sanitizeDomain('https://FEEDBACK.Acme.com/path/')).toBe('feedback.acme.com');
    expect(sanitizeDomain('http://ideas.company.org:8080/')).toBe('ideas.company.org');
    expect(sanitizeDomain('  portal.startup.io  ')).toBe('portal.startup.io');
  });

  it('identifies apex vs subdomain types', () => {
    expect(isApexOrSubdomain('feedback.acme.com')).toBe('subdomain');
    expect(isApexOrSubdomain('acme.com')).toBe('apex');
  });
});

