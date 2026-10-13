import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withSentryConfig } from '@sentry/nextjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../..'),
  typescript: {
    ignoreBuildErrors: true,
  },
  // Prisma/pg must not be bundled by Turbopack (breaks driver adapter runtime with "reading 'bind'").
  // Do not list @pazaryonetimi/database in both transpilePackages and serverExternalPackages.
  serverExternalPackages: [
    '@pazaryonetimi/database',
    '@prisma/client',
    '@prisma/adapter-pg',
    'pg',
    'bcryptjs',
  ],
  productionBrowserSourceMaps: false,
  turbopack: {},
  experimental: {
    // Package import optimization for better tree-shaking
    optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion'],
  },
  images: {
    formats: ['image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 days
  },
  // Enable compression
  compress: true,
  poweredByHeader: false,

  // Security & Performance Headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },

  // API Proxy to backend (analyze routes stay on Next.js — see app/api/marketplace/analyze/)
  async rewrites() {
    const apiBase = (
      process.env.API_INTERNAL_URL ||
      process.env.API_URL ||
      'http://localhost:3001'
    ).replace(/\/$/, '');

    return [
      {
        source: '/api/scraping/:path*',
        destination: `${apiBase}/api/scraping/:path*`,
      },
      {
        source: '/api/marketplace/:path*',
        destination: `${apiBase}/api/v1/marketplace/:path*`,
      },
      {
        source: '/api/integrations-hub/:path*',
        destination: `${apiBase}/api/v1/integrations-hub/:path*`,
      },
      {
        source: '/api/v1/:path*',
        destination: `${apiBase}/api/v1/:path*`,
      },
      {
        source: '/tenant-credentials/:path*',
        destination: `${apiBase}/api/v1/tenant-credentials/:path*`,
      },
      {
        source: '/api/tenant-credentials/:path*',
        destination: `${apiBase}/api/v1/tenant-credentials/:path*`,
      },
      {
        source: '/api/demo/:path*',
        destination: `${apiBase}/api/v1/demo/:path*`,
      },
      {
        source: '/oauth/:path*',
        destination: `${apiBase}/api/v1/oauth/:path*`,
      },
      {
        source: '/api/oauth/:path*',
        destination: `${apiBase}/api/v1/oauth/:path*`,
      },
      {
        source: '/marketplace/:path*',
        destination: `${apiBase}/api/v1/marketplace/:path*`,
      },
      {
        source: '/integrations-hub/:path*',
        destination: `${apiBase}/api/v1/integrations-hub/:path*`,
      },
    ];
  },

  webpack: (config) => {
    config.performance = { hints: false };
    return config;
  },
};

// Sentry configuration
const sentryConfig = {
  // Sentry org slug
  org: process.env.SENTRY_ORG || 'pazaryonetimi',
  // Sentry project name
  project: process.env.SENTRY_PROJECT || 'pazaryonetimi-web',

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Automatically annotate React components to show their full name in breadcrumbs and session replay
  reactComponentAnnotation: {
    enabled: true,
  },

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers
  tunnelRoute: '/monitoring',

  // Hides source maps from generated client bundles
  hideSourceMaps: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors
  automaticVercelMonitors: true,
};

const hasSentry = Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN);
export default hasSentry ? withSentryConfig(nextConfig, sentryConfig) : nextConfig;
