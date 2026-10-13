import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/admin-auth';
import { getJsonSetting, setJsonSetting } from '@/lib/admin-settings-store';
import { generateBlogImage } from '@/lib/ai/blog-assistant';

export const dynamic = 'force-dynamic';

type StudioHistoryItem = {
  id: string;
  theme: string;
  originalPreview?: string;
  resultUrl: string;
  createdAt: string;
};

const THEME_PROMPTS: Record<string, string> = {
  minimalist:
    'premium minimalist modern living room, soft natural lighting, high-end product photography',
  luxury:
    'luxury penthouse at sunset, marble surfaces, cinematic lighting, ultra-realistic commercial photo',
  nature:
    'serene zen garden with soft morning mist, macro product photography, vibrant natural colors',
  urban:
    'modern urban industrial loft, brick walls, large windows, city skyline, trendy commercial vibe',
  cozy:
    'cozy autumn setting, wooden table, warm fireplace glow, knitted textures, inviting atmosphere',
};

function getApiBaseUrl() {
  const raw = process.env.API_INTERNAL_URL || process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  return raw.replace(/\/$/, '');
}

export async function GET() {
  const authResult = await requirePlatformAdmin();
  if (authResult.error) return authResult.error;

  const history = await getJsonSetting<StudioHistoryItem[]>('ai_studio_history', []);
  return NextResponse.json({ history: history.slice(0, 20) });
}

export async function POST(request: NextRequest) {
  const authResult = await requirePlatformAdmin();
  if (authResult.error) return authResult.error;

  const body = await request.json();
  const theme = (body.theme || 'minimalist') as string;
  const originalImageUrl = body.originalImageUrl as string;
  const productDescription = (body.productDescription || 'premium product') as string;

  if (!originalImageUrl) {
    return NextResponse.json({ error: 'Ürün görseli gerekli' }, { status: 400 });
  }

  let resultUrl = '';
  let model = '';

  const base = getApiBaseUrl();
  const nestCandidates = [
    `${base}/api/ai/studio/lifestyle`,
    `${base}/ai/studio/lifestyle`,
  ];

  for (const url of nestCandidates) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': 'platform',
        },
        body: JSON.stringify({
          productId: `studio-${Date.now()}`,
          originalImageUrl,
          theme,
          customDescription: productDescription,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          resultUrl = data.url;
          model = 'nest-ai-studio';
          break;
        }
      }
    } catch {
      continue;
    }
  }

  if (!resultUrl) {
    const scenePrompt = `Commercial product photo of ${productDescription}, ${THEME_PROMPTS[theme] || THEME_PROMPTS.minimalist}`;
    const generated = await generateBlogImage(scenePrompt, theme);
    resultUrl = generated.imageUrl;
    model = generated.model;
  }

  const item: StudioHistoryItem = {
    id: crypto.randomUUID(),
    theme,
    originalPreview: originalImageUrl.startsWith('data:') ? undefined : originalImageUrl,
    resultUrl,
    createdAt: new Date().toISOString(),
  };

  const history = await getJsonSetting<StudioHistoryItem[]>('ai_studio_history', []);
  history.unshift(item);
  await setJsonSetting('ai_studio_history', history.slice(0, 50), 'ai_studio');

  return NextResponse.json({ url: resultUrl, model, item });
}
