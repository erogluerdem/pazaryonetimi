export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { authenticatedBackend } from '@/lib/authenticated-backend';
export async function GET(req: NextRequest) {
  return authenticatedBackend('/integrations-hub/catalog' + req.nextUrl.search, {});
}
