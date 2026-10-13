import { authenticatedBackend } from '@/lib/authenticated-backend';
export async function POST(_request: Request, context: { params: Promise<{ platform: string }> }) {
  const { platform } = await context.params;
  return authenticatedBackend('/oauth/init/'+encodeURIComponent(platform), { method: 'POST', body: {} });
}
