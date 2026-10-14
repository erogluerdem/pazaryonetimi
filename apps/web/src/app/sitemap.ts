import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { SITE_URL } from '@/lib/seo/site-seo';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const buildDate = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, priority: 1, changeFrequency: 'daily', lastModified: buildDate },
    { url: `${SITE_URL}/features`, priority: 0.9, changeFrequency: 'weekly', lastModified: buildDate },
    { url: `${SITE_URL}/pricing`, priority: 0.9, changeFrequency: 'weekly', lastModified: buildDate },
    { url: `${SITE_URL}/solutions`, priority: 0.9, changeFrequency: 'weekly', lastModified: buildDate },
    { url: `${SITE_URL}/entegrasyonlar`, priority: 0.9, changeFrequency: 'weekly', lastModified: buildDate },
    { url: `${SITE_URL}/blog`, priority: 0.8, changeFrequency: 'daily', lastModified: buildDate },
    { url: `${SITE_URL}/community`, priority: 0.7, changeFrequency: 'daily', lastModified: buildDate },
    { url: `${SITE_URL}/community/leaderboard`, priority: 0.6, changeFrequency: 'daily', lastModified: buildDate },
    { url: `${SITE_URL}/forum`, priority: 0.8, changeFrequency: 'hourly', lastModified: buildDate },
    { url: `${SITE_URL}/faq`, priority: 0.7, changeFrequency: 'monthly', lastModified: buildDate },
    { url: `${SITE_URL}/destek`, priority: 0.7, changeFrequency: 'weekly', lastModified: buildDate },
    { url: `${SITE_URL}/destek/makaleler`, priority: 0.7, changeFrequency: 'weekly', lastModified: buildDate },
    { url: `${SITE_URL}/demo`, priority: 0.8, changeFrequency: 'monthly', lastModified: buildDate },
    { url: `${SITE_URL}/demo-talep`, priority: 0.8, changeFrequency: 'monthly', lastModified: buildDate },
    { url: `${SITE_URL}/signup`, priority: 0.8, changeFrequency: 'monthly', lastModified: buildDate },
    { url: `${SITE_URL}/comparison`, priority: 0.7, changeFrequency: 'weekly', lastModified: buildDate },
    { url: `${SITE_URL}/iletisim`, priority: 0.6, changeFrequency: 'monthly', lastModified: buildDate },
  ];

  const [blogPosts, cmsPages, forumBoards, forumTopics, publishedPages, helpArticles] = await Promise.all([
    prisma.cmsPage.findMany({
      where: { category: 'blog', isActive: true },
      select: { slug: true, updatedAt: true },
      take: 500,
    }).catch(() => []),
    prisma.cmsPage.findMany({
      where: { isActive: true, category: { not: 'blog' } },
      select: { slug: true, updatedAt: true },
      take: 200,
    }).catch(() => []),
    prisma.forumBoard.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
      take: 100,
    }).catch(() => []),
    prisma.forumTopic.findMany({
      where: { status: { not: 'DELETED' } },
      select: { slug: true, lastPostAt: true },
      orderBy: { lastPostAt: 'desc' },
      take: 500,
    }).catch(() => []),
    prisma.page.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true, updatedAt: true },
      take: 100,
    }).catch(() => []),
    prisma.forumHelpArticle.findMany({
      where: { status: 'PUBLISHED', isInternal: false },
      select: { slug: true, updatedAt: true },
      take: 200,
    }).catch(() => []),
  ]);

  const dynamicPages: MetadataRoute.Sitemap = [
    ...blogPosts.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...cmsPages.map((page) => ({
      url: `${SITE_URL}/${page.slug}`,
      lastModified: page.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    ...publishedPages.map((page) => ({
      url: `${SITE_URL}/${page.slug}`,
      lastModified: page.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...forumBoards.map((board) => ({
      url: `${SITE_URL}/forum/board/${board.slug}`,
      lastModified: board.updatedAt,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    })),
    ...forumTopics.map((topic) => ({
      url: `${SITE_URL}/forum/topic/${topic.slug}`,
      lastModified: topic.lastPostAt,
      changeFrequency: 'daily' as const,
      priority: 0.6,
    })),
    ...helpArticles.map((article) => ({
      url: `${SITE_URL}/destek/${article.slug}`,
      lastModified: article.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];

  return [...staticPages, ...dynamicPages];
}
