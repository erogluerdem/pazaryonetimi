import 'server-only';
import { createHmac } from 'node:crypto';

// The web server and Nest API share JWT_SECRET. Only call with a server-verified user.
export function createBackendSessionToken(user: { id: string; email: string; tenantId: string; type: string }): string | undefined {
  const secret = process.env.JWT_SECRET || (process.env.NODE_ENV !== 'production' ? 'change-this-secret-in-production' : '');
  if (!secret) return undefined;
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub: user.id, email: user.email, tenantId: user.tenantId, type: user.type, iat: now, exp: now + 86400 * 7 })).toString('base64url');
  const unsigned = `${header}.${payload}`;
  return `${unsigned}.${createHmac('sha256', secret).update(unsigned).digest('base64url')}`;
}

