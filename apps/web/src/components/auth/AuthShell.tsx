'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { GalleryVerticalEnd } from 'lucide-react';

interface AuthShellProps {
  children: React.ReactNode;
  badge?: string;
  title: React.ReactNode;
  description: string;
  topLink?: {
    text: string;
    linkText: string;
    href: string;
  };
}

const ROW_1_LOGOS = [
  { name: 'Trendyol', src: '/images/pazaryeri/Trendyol.png' },
  { name: 'Hepsiburada', src: '/images/pazaryeri/Hepsiburada.png' },
  { name: 'Amazon', src: '/images/pazaryeri/Amazon.png' },
  { name: 'N11', src: '/images/pazaryeri/N11.png' },
  { name: 'Çiçeksepeti', src: '/images/pazaryeri/ciceksepeti.png' },
  { name: 'Pazarama', src: '/images/pazaryeri/Pazarama.png' },
  { name: 'eBay', src: '/images/pazaryeri/EBay.png' },
  { name: 'Etsy', src: '/images/pazaryeri/Etsy.png' },
];

const ROW_2_LOGOS = [
  { name: 'Shopify', src: '/images/pazaryeri/Shopify.png' },
  { name: 'ikas', src: '/images/pazaryeri/ikas.png' },
  { name: 'WooCommerce', src: '/images/pazaryeri/WooCommerce.png' },
  { name: 'Ticimax', src: '/images/pazaryeri/ticimax.webp' },
  { name: 'Ideasoft', src: '/images/pazaryeri/ideasoft-logo.webp' },
  { name: 'T-Soft', src: '/images/pazaryeri/tsoft.webp' },
  { name: 'OpenCart', src: '/images/pazaryeri/opencart.webp' },
  { name: 'PrestaShop', src: '/images/pazaryeri/prestashop.webp' },
];

const ALL_MOBILE_LOGOS = [
  ...ROW_1_LOGOS.slice(0, 5),
  ...ROW_2_LOGOS.slice(0, 4),
];

export function AuthShell({
  children,
  badge = 'Modern e-ticaret ve pazaryeri operasyonları',
  title,
  description,
  topLink = {
    text: 'Hesabınız yok mu?',
    linkText: 'Hesap oluşturun',
    href: '/register',
  },
}: AuthShellProps) {
  const row1Doubled = [...ROW_1_LOGOS, ...ROW_1_LOGOS];
  const row2Doubled = [...ROW_2_LOGOS, ...ROW_2_LOGOS];
  const mobileDoubled = [...ALL_MOBILE_LOGOS, ...ALL_MOBILE_LOGOS];

  return (
    <div className="relative flex min-h-screen min-h-[100dvh] flex-col overflow-hidden bg-background text-foreground font-sans selection:bg-primary/20">
      {/* Nexora Dot Pattern Background with Radial Vignette */}
      <div className="nexora-dot-pattern" />

      {/* Top Header */}
      <header className="relative z-20 flex h-20 items-center justify-between px-6 lg:px-12">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-sm font-semibold tracking-tight text-foreground group"
        >
          <div className="flex size-8 items-center justify-center rounded-lg bg-foreground text-background font-black text-xs transition-transform group-hover:scale-105">
            <GalleryVerticalEnd className="size-4" />
          </div>
          <span>Pazaryonetimi</span>
        </Link>

        {topLink && (
          <p className="text-xs sm:text-sm text-muted-foreground">
            {topLink.text}{' '}
            <Link
              href={topLink.href}
              className="font-medium text-foreground underline underline-offset-4 hover:text-primary transition-colors"
            >
              {topLink.linkText}
            </Link>
          </p>
        )}
      </header>

      {/* Main Split Layout */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-6 py-8">
        <div className="grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_390px] xl:grid-cols-[1.2fr_420px] lg:gap-14">
          {/* Left Hero Section (Desktop) */}
          <section className="hidden lg:block overflow-hidden">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur-sm shadow-xs">
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
              {badge}
            </div>

            <h1 className="max-w-xl text-4xl font-semibold tracking-tight xl:text-5xl text-foreground leading-[1.15]">
              {title}
            </h1>

            <p className="mt-6 max-w-lg text-sm sm:text-base leading-7 text-muted-foreground">
              {description}
            </p>

            {/* Seamless Infinite Logo Marquee / Slider */}
            <div className="mt-12">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Entegre Lider Pazaryerleri & E-Ticaret Altyapıları
                </p>
                <span className="text-[10px] text-muted-foreground/70 font-medium">
                  30+ Entegrasyon
                </span>
              </div>

              <div className="relative w-full overflow-hidden py-1 space-y-3">
                {/* Edge fade gradients */}
                <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background via-background/80 to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background via-background/80 to-transparent z-10 pointer-events-none" />

                {/* Row 1 - Sliding Left */}
                <div className="flex gap-3 animate-auth-marquee-left w-max">
                  {row1Doubled.map((item, idx) => (
                    <div
                      key={`r1-${item.name}-${idx}`}
                      title={item.name}
                      className="flex items-center justify-center h-14 min-w-[130px] px-5 rounded-2xl border border-border/80 bg-card/80 dark:bg-card/50 backdrop-blur-md shadow-xs hover:border-primary/50 hover:bg-card hover:scale-105 transition-all shrink-0 cursor-default"
                    >
                      <img
                        src={item.src}
                        alt={item.name}
                        className="h-7 w-auto max-w-[100px] object-contain filter contrast-105 dark:brightness-110"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>

                {/* Row 2 - Sliding Right */}
                <div className="flex gap-3 animate-auth-marquee-right w-max">
                  {row2Doubled.map((item, idx) => (
                    <div
                      key={`r2-${item.name}-${idx}`}
                      title={item.name}
                      className="flex items-center justify-center h-14 min-w-[130px] px-5 rounded-2xl border border-border/80 bg-card/80 dark:bg-card/50 backdrop-blur-md shadow-xs hover:border-primary/50 hover:bg-card hover:scale-105 transition-all shrink-0 cursor-default"
                    >
                      <img
                        src={item.src}
                        alt={item.name}
                        className="h-7 w-auto max-w-[100px] object-contain filter contrast-105 dark:brightness-110"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Right Card (Form Container) */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="w-full rounded-2xl border border-border bg-card/90 dark:bg-card/75 p-7 shadow-xl backdrop-blur-md sm:p-8 text-card-foreground"
          >
            {children}

            {/* Mobile Marquee (Under Form on Small Screens) */}
            <div className="mt-8 pt-6 border-t border-border/60 lg:hidden overflow-hidden">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-center mb-3">
                Entegre Pazaryerleri
              </p>
              <div className="relative w-full overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-card to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-card to-transparent z-10 pointer-events-none" />

                <div className="flex gap-2.5 animate-auth-marquee-left w-max">
                  {mobileDoubled.map((item, idx) => (
                    <div
                      key={`m-${item.name}-${idx}`}
                      className="flex items-center justify-center h-11 min-w-[100px] px-3.5 rounded-xl border border-border/70 bg-background/60 shadow-2xs shrink-0"
                    >
                      <img
                        src={item.src}
                        alt={item.name}
                        className="h-5 w-auto max-w-[80px] object-contain"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 flex flex-col items-center justify-between gap-4 px-6 pb-6 pt-4 text-xs text-muted-foreground sm:flex-row sm:px-10 lg:px-12 border-t border-border/40">
        <p>
          Geliştirici:{' '}
          <Link
            href="/"
            className="font-medium text-foreground transition-colors hover:text-primary"
          >
            Pazaryonetimi CRM
          </Link>
        </p>
        <nav className="flex items-center gap-5">
          <Link href="/kurumsal/hakkimizda" className="transition-colors hover:text-foreground">
            Hakkımızda
          </Link>
          <Link href="/destek" className="transition-colors hover:text-foreground">
            Destek
          </Link>
          <Link href="/kurumsal/gizlilik" className="transition-colors hover:text-foreground">
            Gizlilik
          </Link>
          <Link href="/kurumsal/kullanim-kosullari" className="transition-colors hover:text-foreground">
            Kullanım Koşulları
          </Link>
        </nav>
      </footer>

      {/* Marquee Animation Styles */}
      <style jsx global>{`
        @keyframes auth-marquee-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        @keyframes auth-marquee-right {
          0% {
            transform: translateX(-50%);
          }
          100% {
            transform: translateX(0);
          }
        }
        .animate-auth-marquee-left {
          animation: auth-marquee-left 32s linear infinite;
        }
        .animate-auth-marquee-right {
          animation: auth-marquee-right 32s linear infinite;
        }
        .animate-auth-marquee-left:hover,
        .animate-auth-marquee-right:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
