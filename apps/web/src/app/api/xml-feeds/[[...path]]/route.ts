export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { authenticatedBackend } from '@/lib/authenticated-backend';
async function proxy(req: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await context.params;
  const target = '/xml-feeds' + (path.length ? '/' + path.map(encodeURIComponent).join('/') : '') + req.nextUrl.search;
  return authenticatedBackend(target, { method: req.method, idempotencyKey: req.headers.get('idempotency-key') || undefined, ...(['POST', 'PUT', 'PATCH'].includes(req.method) ? { body: await req.json() } : {}) });
}
export const GET = proxy;
export const POST = proxy;
export const DELETE = proxy;
