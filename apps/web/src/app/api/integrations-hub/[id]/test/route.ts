export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { authenticatedBackend } from '@/lib/authenticated-backend';
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return authenticatedBackend('/integrations-hub/' + encodeURIComponent(id) + '/test', { method: 'POST', body: await req.json().catch(() => ({})) });
}
