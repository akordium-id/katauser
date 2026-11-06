import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  renderVoterStatusUpdateHtml,
  sendVoterNotificationEmail,
} from '../src/services/email-notifier';
import type { VoterNotificationPayload } from '@katauser/shared';

describe('Voter Email Notification Service', () => {
  const mockPayload: VoterNotificationPayload = {
    recipientEmail: 'voter@example.com',
    recipientName: 'Budi Santoso',
    workspaceName: 'Acme SaaS',
    postTitle: 'Export Data ke Excel & CSV',
    newStatus: 'shipped',
    postUrl: 'https://acme.katauser.com/b/feedback/export-excel',
    changelogUrl: 'https://acme.katauser.com/changelog',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders responsive HTML email template with status styling and post links', () => {
    const html = renderVoterStatusUpdateHtml(mockPayload);
    expect(html).toContain('Acme SaaS');
    expect(html).toContain('Export Data ke Excel & CSV');
    expect(html).toContain('Budi Santoso');
    expect(html).toContain('Shipped');
    expect(html).toContain('https://acme.katauser.com/b/feedback/export-excel');
    expect(html).toContain('Lihat Detail Rilis');
  });

  it('sends email in mock mode when RESEND_API_KEY is not configured', async () => {
    const result = await sendVoterNotificationEmail(mockPayload, undefined);
    expect(result.success).toBe(true);
    expect(result.mode).toBe('mock');
    expect(result.id).toMatch(/^mock_email_/);
  });

  it('sends email via Resend API when api key is provided', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 'email_resend_12345' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await sendVoterNotificationEmail(mockPayload, 're_fake_api_key');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer re_fake_api_key',
        }),
      })
    );
    expect(result.success).toBe(true);
    expect(result.mode).toBe('resend');
    expect(result.id).toBe('email_resend_12345');
  });
});

