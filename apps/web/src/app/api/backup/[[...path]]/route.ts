export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { authenticatedBackend } from '@/lib/authenticated-backend';
async function proxy(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
 const { path = [] } = await ctx.params;
 return authenticatedBackend('/backup' + (path.length ? '/' + path.map(encodeURIComponent).join('/') : '') + req.nextUrl.search, { method: req.method, ...(['POST','PUT','PATCH'].includes(req.method) ? { body: await req.json() } : {}) });
}
export const GET = proxy; export const POST = proxy; export const PUT = proxy; export const PATCH = proxy; export const DELETE = proxy;
