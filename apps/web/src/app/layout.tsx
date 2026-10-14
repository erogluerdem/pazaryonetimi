import type { Metadata, Viewport } from "next";
import { Inter, Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// PWA Viewport ayarları
export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://pazaryonetimi.com'),
  title: {
    default: 'Pazaryonetimi | AI Destekli E-ticaret Yönetim Platformu',
    template: '%s | Pazaryonetimi',
  },
  description: 'Trendyol, Hepsiburada, Amazon, N11, Çiçeksepeti — tüm pazaryerlerinizi tek platformdan yönetin. AI destekli stok senkronizasyonu, akıllı fiyatlandırma, sipariş yönetimi ve satış tahminleri. 14 gün ücretsiz deneyin.',
  keywords: [
    'e-ticaret yönetimi',
    'pazaryeri yönetimi',
    'pazaryeri entegrasyonu',
    'trendyol entegrasyonu',
    'hepsiburada entegrasyonu',
    'amazon türkiye',
    'n11 entegrasyonu',
    'çiçeksepeti entegrasyonu',
    'stok yönetimi',
    'sipariş yönetimi',
    'e-ticaret yazılımı',
    'çoklu pazaryeri yönetimi',
    'e-ticaret otomasyon',
    'ai e-ticaret',
    'yapay zeka e-ticaret',
    'fiyat optimizasyonu',
    'stok senkronizasyonu',
    'e-ticaret analitik',
    'satış tahmini',
    'e-ticaret platformu',
    'online satış yönetimi',
    'dijital ticaret',
    'marketplace yönetimi',
    'e-ticaret erp',
  ],
  authors: [{ name: 'Pazaryonetimi', url: 'https://pazaryonetimi.com' }],
  creator: 'Pazaryonetimi',
  publisher: 'Pazaryonetimi',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: 'https://pazaryonetimi.com',
    siteName: 'Pazaryonetimi',
    title: 'Pazaryonetimi | AI Destekli E-ticaret Yönetim Platformu',
    description: 'Tüm pazaryerlerinizi tek platformdan yönetin. Trendyol, Hepsiburada, Amazon, N11 entegrasyonları. AI destekli stok, fiyat ve sipariş yönetimi.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Pazaryonetimi - AI Destekli E-ticaret Yönetim Platformu',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@pazaryonetimi',
    creator: '@pazaryonetimi',
    title: 'Pazaryonetimi | AI Destekli E-ticaret Yönetim Platformu',
    description: 'Tüm pazaryerlerinizi tek platformdan yönetin. AI destekli e-ticaret çözümleri.',
    images: {
      url: '/twitter-image',
      alt: 'Pazaryonetimi - E-ticaret Yönetim Platformu',
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || 'GOOGLE_VERIFICATION_CODE',
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION_CODE || 'YANDEX_VERIFICATION_CODE',
    other: {
      'msvalidate.01': process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION || 'BING_VERIFICATION_CODE',
    },
  },
  alternates: {
    canonical: 'https://pazaryonetimi.com',
    languages: {
      'tr-TR': 'https://pazaryonetimi.com',
    },
  },
  category: 'business',
  applicationName: 'Pazaryonetimi',
  generator: 'Next.js',
  referrer: 'origin-when-cross-origin',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Pazaryonetimi',
  },
  other: {
    'google-site-verification': process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || 'GOOGLE_VERIFICATION_CODE',
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#2563eb',
    'msapplication-config': '/browserconfig.xml',
  },
};

import { ThemeProvider } from "@/providers/theme-provider";
import QueryProvider from "@/providers/query-provider";
import { I18nProvider } from "@/lib/i18n/index";
import { ConsoleSuppressor } from "@/providers/console-suppressor";
import { OfflineBanner, InstallPrompt } from "@/hooks/usePWA";
import CommandCenter from "@/components/CommandCenter";
import CookieBanner from "@/components/CookieBanner";
import NextDevIndicatorKiller from "@/components/NextDevIndicatorKiller";
import StructuredData from "@/components/SEO/StructuredData";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=JSON.parse(localStorage.getItem('pazar-theme-settings'));var m=s&&s.mode||'light';if(m==='system'){m=window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'}document.documentElement.setAttribute('data-theme',m);if(m==='dark'){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}if(s&&s.themeStyle){document.documentElement.setAttribute('data-theme-style',s.themeStyle)}}catch(e){document.documentElement.setAttribute('data-theme','light')}})()`,
          }}
        />
        {/* PWA: beforeinstallprompt event'ini React hydration'dan önce yakala */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){if(typeof window==='undefined'||window.__pwaInitialized)return;window.__pwaInitialized=true;window.__pwaInstallPrompt=null;window.__pwaInstalled=false;window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__pwaInstallPrompt=e;window.dispatchEvent(new CustomEvent('pwa-prompt-captured'))},{once:true});window.addEventListener('appinstalled',function(){window.__pwaInstalled=true;window.__pwaInstallPrompt=null})})()`,
          }}
        />
        {/* manifest.ts otomatik olarak Next.js tarafından yönetilir */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/api/pwa-icon?size=192" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="theme-color" content="#2563eb" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1e40af" media="(prefers-color-scheme: dark)" />
        <meta name="geo.region" content="TR" />
        <meta name="geo.placename" content="Istanbul" />
        <meta name="language" content="Turkish" />
        <meta name="rating" content="general" />
        <meta name="revisit-after" content="3 days" />
        <meta name="distribution" content="global" />
      </head>
      <body
        className={`${inter.variable} ${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {/* Skip to main content - Accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[9999] focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded-md focus:outline-none"
        >
          Ana içeriğe geç
        </a>
        <ThemeProvider>
          <QueryProvider>
            <SessionProvider>
              <I18nProvider>
                <ConsoleSuppressor />
                {children}
                <CommandCenter />
                <CookieBanner />
                <NextDevIndicatorKiller />
                <StructuredData />
                <OfflineBanner />
                <InstallPrompt />
              </I18nProvider>
            </SessionProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
