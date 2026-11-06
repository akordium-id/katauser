import { z } from 'zod';
import { createHmac, timingSafeEqual } from 'node:crypto';

export const widgetIdentifySchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID wajib diisi'),
  userId: z.string().min(1, 'User ID wajib diisi'),
  email: z.string().email('Format email tidak valid'),
  name: z.string().optional(),
  hash: z.string().optional(),
});

export type WidgetIdentifyInput = z.infer<typeof widgetIdentifySchema>;

/**
 * Generate HMAC SHA-256 for user identity verification
 */
export function generateUserHmac(secretKey: string, userId: string): string {
  return createHmac('sha256', secretKey).update(userId).digest('hex');
}

/**
 * Constant-time verification of user HMAC SHA-256 signature
 */
export function verifyUserHmac(secretKey: string, userId: string, hash: string): boolean {
  if (!secretKey || !userId || !hash) return false;
  const expectedHash = generateUserHmac(secretKey, userId);

  try {
    const expectedBuf = Buffer.from(expectedHash, 'hex');
    const actualBuf = Buffer.from(hash, 'hex');

    if (expectedBuf.length !== actualBuf.length) {
      return false;
    }

    return timingSafeEqual(expectedBuf, actualBuf);
  } catch {
    return false;
  }
}
