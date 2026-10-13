export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

function getApiBaseUrl() {
  const raw =
    process.env.API_INTERNAL_URL || process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const normalized = raw.trim();
  if (!normalized) return 'http://localhost:3001';
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return normalized.replace(/\/$/, '');
  }
  return `https://${normalized}`.replace(/\/$/, '');
}

async function proxy(
  req: NextRequest,
  pathSegments: string[],
  method: string,
) {
  const session = await auth();
  const tenantId = (session?.user as { tenantId?: string } | undefined)?.tenantId;
  const accessToken = (session as { accessToken?: string } | null)?.accessToken;

  if (!tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const path = pathSegments.join('/');
  const search = req.nextUrl.search;
  const base = getApiBaseUrl();
  const candidates = [
    `${base}/api/commerce-ops/${path}${search}`,
    `${base}/commerce-ops/${path}${search}`,
  ];

  const body =
    method === 'GET' || method === 'HEAD' ? undefined : await req.text();

  for (const url of candidates) {
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'content-type': 'application/json',
          'x-tenant-id': tenantId,
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: body || undefined,
      });
      if (response.ok) {
        return NextResponse.json(await response.json());
      }
      if (response.status !== 404) {
        const err = await response.json().catch(() => ({}));
        return NextResponse.json(err, { status: response.status });
      }
    } catch {
      // try next
    }
  }

  return NextResponse.json({ error: 'Commerce ops API ulaşılamadı' }, { status: 502 });
}

type RouteCtx = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: RouteCtx) {
  const { path } = await ctx.params;
  return proxy(req, path, 'GET');
}

export async function POST(req: NextRequest, ctx: RouteCtx) {
  const { path } = await ctx.params;
  return proxy(req, path, 'POST');
}
