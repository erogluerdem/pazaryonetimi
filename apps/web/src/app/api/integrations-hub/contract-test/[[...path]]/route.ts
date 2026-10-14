export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { authenticatedBackend } from '@/lib/authenticated-backend';

async function proxy(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await ctx.params;
  const subpath = path.length ? '/' + path.map(encodeURIComponent).join('/') : '';
  const url = `/integrations-hub/contract-test${subpath}${req.nextUrl.search}`;
  return authenticatedBackend(url, {
    method: req.method,
    ...(['POST', 'PUT', 'PATCH'].includes(req.method) ? { body: await req.json().catch(() => ({})) } : {}),
  });
}

export const GET = proxy;
export const POST = proxy;
