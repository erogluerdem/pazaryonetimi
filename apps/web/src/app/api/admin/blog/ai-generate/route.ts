import { NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/admin-auth';
import { buildExcerpt, slugifyTitle } from '@/lib/blog-service';
import { fetchFromApi } from '@/lib/server-api-url';
import { generateGeminiJsonResponse } from '@/lib/gemini-chat';

export const dynamic = 'force-dynamic';

type AiDraft = {
  title: string;
  excerpt: string;
  content: string;
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  tags?: string;
  source: 'ai' | 'fallback';
};

function getApiBaseUrl() {
  const raw = process.env.API_INTERNAL_URL || process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const normalized = raw.trim();
  if (!normalized) return 'http://localhost:3001';
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) return normalized.replace(/\/$/, '');
  if (normalized.startsWith('/')) return normalized.replace(/\/$/, '');
  return `https://${normalized}`.replace(/\/$/, '');
}

function extractJson(raw: string): Record<string, unknown> | null {
  const cleaned = raw.trim().replace(/```json|```/g, '');
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) return null;

  try {
    return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function fallbackDraft(topic: string, audience: string, tone: string, keywords: string[]): AiDraft {
  const title = `${topic}: ${audience} İçin Pratik Rehber`;
  const keywordLine = keywords.length > 0 ? keywords.join(', ') : `${topic}, e-ticaret, pazaryeri`;
  const content = `## Giriş\n${audience} için hazırlanan bu rehberde ${topic.toLowerCase()} konusuna odaklanıyoruz.\n\n## Neden Önemli?\n${topic} doğru uygulandığında operasyon maliyetlerini düşürür ve dönüşümü artirir.\n\n## Uygulama Adımları\n1. Mevcut veriyi toplayın ve baz metrikleri oluşturun.\n2. Küçük bir pilot ürün grubu seçin.\n3. Haftalık performans takibiyle süreci optimize edin.\n\n## Kontrol Listesi\n- KPI takibi\n- Stok ve fiyat senkronu\n- İçerik optimizasyonu\n\n## Sonuç\nBu adımlar ${tone.toLowerCase()} bir yaklaşımla uygulanırsa 30 gün içinde ölçülebilir sonuç alabilirsiniz.\n\nAnahtar kelimeler: ${keywordLine}`;

  return {
    title,
    slug: slugifyTitle(title),
    excerpt: buildExcerpt(content, 170),
    content,
    metaTitle: `${title} | Pazar Yönetimi`,
    metaDescription: `${audience} için hazırlanan bu rehberde ${topic.toLowerCase()} konusuna odaklanıyoruz.`,
    metaKeywords: keywordLine,
    tags: 'E-Ticaret,Rehber,Strateji',
    source: 'fallback',
  };
}

async function requestAiDraft(
  topic: string,
  audience: string,
  tone: string,
  keywords: string[],
  length: string,
  customInstructions: string,
  accessToken?: string
): Promise<AiDraft | null> {
  let lengthDesc = 'en az 800-1000 kelime blog icerigi';
  if (length === 'short') lengthDesc = 'yaklasik 500 kelime blog icerigi';
  if (length === 'long') lengthDesc = 'en az 1500 kelime detayli rehber icerigi';
  if (length === 'extra-long') lengthDesc = 'en az 2000-2500 kelime kapsamli e-kitap ve rehber icerigi';

  let instructionsPrompt = '';
  if (customInstructions) {
    instructionsPrompt = `\nOzel yapay zeka talimatlari (bu kurallara kesinlikle uy):\n${customInstructions}`;
  }

  const prompt = `\n${topic} konusunda son derece detayli, insansi, akici, tamamen ozgun ve uzman bir Turkce blog yazisi uret.
Hedef kitle: ${audience}
Ton: ${tone}
Anahtar kelimeler: ${keywords.join(', ') || 'e-ticaret, pazaryeri yonetimi'}

Gereksinimler:
1. Icerik gercekten kapsamli ve doyurucu olmali. ${lengthDesc}. Cok kisa kesme, her alt basligi aciklayici paragraflarla doldur.
2. Markdown formatini (basliklar, alt basliklar, listeler, kalin yazi, alintilar, kod bloklari veya tablolar vb.) cok estetik, zengin ve okunabilir sekilde kullan. Paragraflari cok uzun tutma, alt basliklar altinda net bolumler olustur.
3. Insansi bir yazi dili kullan. Gereksiz tekrarlardan ve yapay zeka kliselerinden uzak dur. Gercek hayattan pratik ornekler ve tavsiyeler ekle.
4. SEO icin baslik, aciklama, keywordler ve etiketleri (tags) eksiksiz hazirla.${instructionsPrompt}

Lutfen SADECE asagidaki JSON formatinda donus yap, JSON disinda hicbir metin veya isaret ekleme:
{
  "title": "Cekici ve SEO uyumlu blog basligi",
  "excerpt": "Blogun listeleme sayfalarinda gorunecek 120-160 karakterlik kisa ozeti",
  "content": "Markdown formatinda yazilmis, detayli, insansi ve gorsel olarak zenginlestirilmis blog icerigi...",
  "metaTitle": "Arama motorlari (Google) icin SEO odakli baslik (maks 60 karakter)",
  "metaDescription": "Arama motorlari icin SEO odakli meta aciklamasi (maks 160 karakter)",
  "metaKeywords": "virgulle ayrilmis 5-8 anahtar kelime",
  "tags": "virgulle ayrilmis kategori/etiket isimleri (ornegin: Trendyol,Satis,KOBI)"
}`;

  try {
    const parsed = await generateGeminiJsonResponse<AiDraft>(prompt);
    if (!parsed) return null;

    const title = typeof parsed.title === 'string' ? parsed.title.trim() : '';
    const excerpt = typeof parsed.excerpt === 'string' ? parsed.excerpt.trim() : '';
    const content = typeof parsed.content === 'string' ? parsed.content.trim() : '';
    const metaTitle = typeof parsed.metaTitle === 'string' ? parsed.metaTitle.trim() : '';
    const metaDescription = typeof parsed.metaDescription === 'string' ? parsed.metaDescription.trim() : '';
    const metaKeywords = typeof parsed.metaKeywords === 'string' ? parsed.metaKeywords.trim() : '';
    const tags = typeof parsed.tags === 'string' ? parsed.tags.trim() : '';

    if (!title || !content) return null;

    return {
      title,
      excerpt: excerpt || buildExcerpt(content, 170),
      content,
      slug: slugifyTitle(title),
      metaTitle,
      metaDescription,
      metaKeywords,
      tags,
      source: 'ai',
    };
  } catch (error) {
    console.error('Request AI draft failed:', error);
    return null;
  }
}

export async function POST(request: Request) {
  const authResult = await requirePlatformAdmin();
  if (authResult.error) return authResult.error;

  const body = (await request.json()) as {
    topic?: string;
    audience?: string;
    tone?: string;
    keywords?: string;
    length?: string;
    customInstructions?: string;
  };

  const topic = body.topic?.trim() || '';
  if (!topic) {
    return NextResponse.json({ message: 'Konu zorunludur.' }, { status: 400 });
  }

  const audience = (body.audience || 'Turkiye e-ticaret saticilari').trim();
  const tone = (body.tone || 'Profesyonel').trim();
  const length = body.length || 'medium';
  const customInstructions = body.customInstructions?.trim() || '';

  const keywords = (body.keywords || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);

  const aiDraft = await requestAiDraft(topic, audience, tone, keywords, length, customInstructions, authResult.accessToken);
  if (aiDraft) return NextResponse.json(aiDraft);

  return NextResponse.json(fallbackDraft(topic, audience, tone, keywords));
}
