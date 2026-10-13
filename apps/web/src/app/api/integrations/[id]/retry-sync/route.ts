export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

function getApiBaseUrl() {
  const raw = process.env.API_INTERNAL_URL || process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const normalized = raw.trim();
  if (!normalized) return 'http://localhost:3001';
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return normalized.replace(/\/$/, '');
  }
  return `https://${normalized}`.replace(/\/$/, '');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    const tenantId = (session?.user as { tenantId?: string } | undefined)?.tenantId;
    const accessToken = (session as { accessToken?: string } | null)?.accessToken;

    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const integration = await prisma.integration.findFirst({
      where: { id, tenantId },
      select: { id: true, platform: true, isActive: true },
    });

    if (!integration) {
      return NextResponse.json({ error: 'Entegrasyon bulunamadı' }, { status: 404 });
    }

    const base = getApiBaseUrl();
    const candidates = [
      `${base}/integrations/${id}/retry-sync?tenantId=${encodeURIComponent(tenantId)}`,
      `${base}/api/integrations/${id}/retry-sync?tenantId=${encodeURIComponent(tenantId)}`,
      `${base}/api/v1/integrations/${id}/retry-sync?tenantId=${encodeURIComponent(tenantId)}`,
    ];

    for (const url of candidates) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-tenant-id': tenantId,
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({ syncType: 'all' }),
        });

        if (response.ok) {
          const data = await response.json();
          return NextResponse.json(data);
        }

        if (response.status !== 404) {
          const err = await response.json().catch(() => ({}));
          return NextResponse.json(err, { status: response.status });
        }
      } catch {
        // try next candidate
      }
    }

    await prisma.integration.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    await prisma.activityLog.create({
      data: {
        tenantId,
        action: 'integration.sync.retry',
        resource: 'integration',
        resourceId: id,
        details: { queued: false, fallback: true },
      },
    });

    return NextResponse.json({
      success: true,
      queued: false,
      message: 'Senkronizasyon isteği kaydedildi',
      integrationId: id,
    });
  } catch (error) {
    console.error('Retry sync error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
