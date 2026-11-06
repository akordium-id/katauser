import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { widgetIdentifySchema, verifyUserHmac } from '@katauser/shared';

// For workspace HMAC secret lookup (in production, retrieved from workspaces table)
const WORKSPACE_HMAC_SECRETS: Record<string, string> = {
  'acme-corp': 'test-workspace-secret-key',
  default: 'default-widget-secret',
};

export const widgetRoute = new Hono().post(
  '/widget/identify',
  zValidator('json', widgetIdentifySchema, (result, c) => {
    if (!result.success) {
      return c.json({ success: false, errors: result.error.errors }, 400);
    }
  }),
  async (c) => {
    const { workspaceId, userId, email, name, hash } = c.req.valid('json');

    const secretKey =
      WORKSPACE_HMAC_SECRETS[workspaceId] || WORKSPACE_HMAC_SECRETS['default'];

    let isVerified = false;

    if (hash) {
      const isValid = verifyUserHmac(secretKey, userId, hash);
      if (!isValid) {
        return c.json(
          {
            success: false,
            message: 'Invalid HMAC signature for user identification',
          },
          401
        );
      }
      isVerified = true;
    }

    // Generate a secure widget session token
    const sessionToken = `wgt_${Buffer.from(
      JSON.stringify({
        workspaceId,
        userId,
        email,
        verified: isVerified,
        exp: Date.now() + 24 * 60 * 60 * 1000,
      })
    ).toString('base64url')}`;

    return c.json({
      success: true,
      sessionToken,
      user: {
        userId,
        email,
        name: name || email.split('@')[0],
        verified: isVerified,
      },
    });
  }
);

