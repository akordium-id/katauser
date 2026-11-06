import { describe, it, expect } from 'vitest';
import { formatRevenueBadge, validateWebhookUrl } from '../src/lib/integrations-helpers';

describe('Integrations & Revenue UI Helpers', () => {
  it('formats revenue MRR badge properly', () => {
    expect(formatRevenueBadge(0)).toBe('');
    expect(formatRevenueBadge(undefined)).toBe('');
    expect(formatRevenueBadge(500)).toBe('$500/mo MRR');
    expect(formatRevenueBadge(12500)).toBe('$12,500/mo MRR');
  });

  it('validates Slack webhook URL strictly', () => {
    expect(validateWebhookUrl('https://hooks.slack.com/services/T00/B00/X00', 'slack').valid).toBe(true);
    expect(validateWebhookUrl('http://hooks.slack.com/services/insecure', 'slack').valid).toBe(false);
    expect(validateWebhookUrl('https://malicious.com/webhook', 'slack').valid).toBe(false);
    expect(validateWebhookUrl('', 'slack').valid).toBe(true); // empty is allowed
  });

  it('validates Discord webhook URL strictly', () => {
    expect(validateWebhookUrl('https://discord.com/api/webhooks/123/abc', 'discord').valid).toBe(true);
    expect(validateWebhookUrl('http://discord.com/api/webhooks/123/abc', 'discord').valid).toBe(false);
    expect(validateWebhookUrl('https://other.com/webhook', 'discord').valid).toBe(false);
  });
});

