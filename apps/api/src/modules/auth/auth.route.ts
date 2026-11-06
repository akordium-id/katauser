import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { registerSchema, loginSchema, type UserProfile } from '@katauser/shared';
import { hashPassword, verifyPassword } from '../../services/password-hasher';
import { setCookie, getCookie, deleteCookie } from 'hono/cookie';
import { randomBytes } from 'node:crypto';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  passwordHash: string;
  createdAt: string;
}

interface SessionRecord {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
}

const usersStore: UserRecord[] = [];
const sessionsStore: SessionRecord[] = [];

function generateSessionToken(): string {
  return 'sess_' + randomBytes(24).toString('hex');
}

export const authRoute = new Hono()
  // Register new account
  .post(
    '/auth/register',
    zValidator('json', registerSchema, (result, c) => {
      if (!result.success) {
        return c.json({ success: false, errors: result.error.errors }, 400);
      }
    }),
    async (c) => {
      const { name, email, password } = c.req.valid('json');
      const normalizedEmail = email.toLowerCase().trim();

      const existing = usersStore.find((u) => u.email === normalizedEmail);
      if (existing) {
        return c.json({ success: false, message: 'Email sudah terdaftar' }, 409);
      }

      const passwordHash = hashPassword(password);
      const user: UserRecord = {
        id: 'usr_' + Math.random().toString(36).substring(2, 10),
        name,
        email: normalizedEmail,
        role: 'user',
        passwordHash,
        createdAt: new Date().toISOString(),
      };

      usersStore.push(user);

      // Create session
      const token = generateSessionToken();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
      sessionsStore.push({
        id: 'sid_' + Math.random().toString(36).substring(2, 10),
        userId: user.id,
        token,
        expiresAt,
      });

      setCookie(c, 'katauser_session', token, {
        httpOnly: true,
        path: '/',
        sameSite: 'Lax',
        maxAge: 30 * 24 * 60 * 60,
      });

      const profile: UserProfile = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      };

      return c.json({ success: true, user: profile, token }, 201);
    }
  )

  // Login
  .post(
    '/auth/login',
    zValidator('json', loginSchema, (result, c) => {
      if (!result.success) {
        return c.json({ success: false, errors: result.error.errors }, 400);
      }
    }),
    async (c) => {
      const { email, password } = c.req.valid('json');
      const normalizedEmail = email.toLowerCase().trim();

      const user = usersStore.find((u) => u.email === normalizedEmail);
      if (!user) {
        return c.json({ success: false, message: 'Email atau password salah' }, 401);
      }

      const isValid = verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return c.json({ success: false, message: 'Email atau password salah' }, 401);
      }

      const token = generateSessionToken();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      sessionsStore.push({
        id: 'sid_' + Math.random().toString(36).substring(2, 10),
        userId: user.id,
        token,
        expiresAt,
      });

      setCookie(c, 'katauser_session', token, {
        httpOnly: true,
        path: '/',
        sameSite: 'Lax',
        maxAge: 30 * 24 * 60 * 60,
      });

      const profile: UserProfile = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      };

      return c.json({ success: true, user: profile, token });
    }
  )

  // Get current user profile
  .get('/auth/me', (c) => {
    const authHeader = c.req.header('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const cookieToken = getCookie(c, 'katauser_session');

    const token = bearerToken || cookieToken;
    if (!token) {
      return c.json({ success: false, message: 'Unauthorized' }, 401);
    }

    const session = sessionsStore.find((s) => s.token === token);
    if (!session || new Date(session.expiresAt) < new Date()) {
      return c.json({ success: false, message: 'Session expired or invalid' }, 401);
    }

    const user = usersStore.find((u) => u.id === session.userId);
    if (!user) {
      return c.json({ success: false, message: 'User not found' }, 401);
    }

    const profile: UserProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };

    return c.json({ success: true, user: profile });
  })

  // Logout
  .post('/auth/logout', (c) => {
    const token = getCookie(c, 'katauser_session') || c.req.header('authorization')?.replace('Bearer ', '');
    if (token) {
      const idx = sessionsStore.findIndex((s) => s.token === token);
      if (idx > -1) sessionsStore.splice(idx, 1);
    }

    deleteCookie(c, 'katauser_session', { path: '/' });
    return c.json({ success: true, message: 'Berhasil logout' });
  });
