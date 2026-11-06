import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

/**
 * Hash a password using native crypto.scryptSync with a random 16-byte salt
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify a password against a combined salt:hash string using constant-time comparison
 */
export function verifyPassword(password: string, combined: string): boolean {
  if (!password || !combined || !combined.includes(':')) {
    return false;
  }

  try {
    const [salt, key] = combined.split(':');
    if (!salt || !key) return false;

    const hash = scryptSync(password, salt, 64);
    const keyBuf = Buffer.from(key, 'hex');

    if (hash.length !== keyBuf.length) {
      return false;
    }

    return timingSafeEqual(hash, keyBuf);
  } catch {
    return false;
  }
}

