'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { GalleryVerticalEnd, Sparkles, ShieldCheck } from 'lucide-react';

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

const MARKETPLACES = [
  { name: 'Trendyol', color: '#f27a1a', bg: 'rgba(242, 122, 26, 0.1)' },
  { name: 'Hepsiburada', color: '#ff6000', bg: 'rgba(255, 96, 0, 0.1)' },
  { name: 'Amazon', color: '#ff9900', bg: 'rgba(255, 153, 0, 0.1)' },
  { name: 'N11', color: '#5e35b1', bg: 'rgba(94, 53, 177, 0.1)' },
  { name: 'Çiçeksepeti', color: '#00a0d6', bg: 'rgba(0, 160, 214, 0.1)' },
  { name: 'Shopify', color: '#96bf48', bg: 'rgba(150, 191, 72, 0.1)' },
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
        <div className="grid w-full max-w-5xl items-center gap-12 lg:grid-cols-[1fr_390px] xl:grid-cols-[1fr_420px] lg:gap-16">
          {/* Left Hero Section (Desktop) */}
          <section className="hidden lg:block">
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

            <div className="mt-14">
              <p className="mb-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Entegre Lider Pazaryerleri
              </p>
              <div className="flex flex-wrap items-center gap-2.5">
                {MARKETPLACES.map((mp) => (
                  <div
                    key={mp.name}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card/50 text-xs font-medium text-foreground backdrop-blur-xs hover:border-primary/40 transition-colors"
                  >
                    <span
                      className="size-2 rounded-full shrink-0"
                      style={{ backgroundColor: mp.color }}
                    />
                    {mp.name}
                  </div>
                ))}
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
    </div>
  );
}
