'use client';

import React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import type { Session } from 'next-auth';
import {
  Zap,
  Sparkles,
  HelpCircle,
  Sun,
  Moon,
  Activity,
} from 'lucide-react';
import { CommandPalette } from '@/components/CommandPalette';
import NotificationBell from '@/components/dashboard/NotificationBell';
import { AnnouncementDropdown } from '@/components/announcements/AnnouncementComponents';
import { DashboardUserMenu } from './DashboardUserMenu';
import { useModules } from '@/lib/modules';

interface DashboardHeaderBarProps {
  currentPageTitle: string;
  isCompactHeader: boolean;
  session: Session | null;
  tenantPlan?: string;
  creditMenuOpen: boolean;
  setCreditMenuOpen: (open: boolean) => void;
  profileMenuOpen: boolean;
  setProfileMenuOpen: (open: boolean) => void;
  showLiveFeed: boolean;
  toggleLiveFeed: () => void;
  resolvedMode: 'light' | 'dark';
  toggleTheme: () => void;
  triggerHaptic: () => void;
  activeAnnouncements: any[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  dismiss: (id: string) => void;
}

function HeaderIconButton({
  onClick,
  label,
  active,
  children,
  className = '',
}: {
  onClick: () => void;
  label: string;
  active?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`p-2 rounded-lg transition-colors haptic-tap ${
        active
          ? 'bg-muted text-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function DashboardHeaderBar({
  currentPageTitle,
  isCompactHeader,
  session,
  tenantPlan,
  creditMenuOpen,
  setCreditMenuOpen,
  profileMenuOpen,
  setProfileMenuOpen,
  showLiveFeed,
  toggleLiveFeed,
  resolvedMode,
  toggleTheme,
  triggerHaptic,
  activeAnnouncements,
  unreadCount,
  markAsRead,
  dismiss,
}: DashboardHeaderBarProps) {
  const { aiCredits } = useModules();
  const creditPct = aiCredits.limit > 0 ? Math.round((aiCredits.used / aiCredits.limit) * 100) : 0;

  return (
    <header
      role="banner"
      aria-label="Üst menü"
      className={`dashboard-header dashboard-mobile-header sticky top-0 z-40 safe-area-top border-b border-border/80 bg-background/80 backdrop-blur-md transition-all duration-200 ${
        isCompactHeader ? 'dashboard-mobile-header-compact' : ''
      }`}
    >
      <div className="dashboard-header-inner h-16 px-4 lg:px-8 flex items-center justify-between gap-3 max-w-screen-2xl mx-auto w-full">
        {/* Sol: arama / sayfa başlığı */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="hidden lg:flex flex-1 max-w-md">
            <div className="dashboard-search-shell w-full">
              <CommandPalette />
            </div>
          </div>

          <div className="lg:hidden flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-xs shrink-0">
              <span className="text-xs font-semibold text-white">P</span>
            </div>
            <div className="dashboard-mobile-title-chip flex flex-col leading-tight min-w-0 max-w-[140px] sm:max-w-none">
              <span
                className={`text-[10px] font-medium text-muted-foreground truncate transition-all duration-200 ${
                  isCompactHeader ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'
                }`}
              >
                Pazar Yönetimi
              </span>
              <span className="text-xs sm:text-sm font-semibold text-foreground truncate">{currentPageTitle}</span>
            </div>
          </div>
        </div>

        {/* Sağ: aksiyonlar */}
        <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 shrink-0">
          <div className="lg:hidden">
            <CommandPalette />
          </div>

          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/8 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              Canlı
            </span>
          </div>

          {/* AI Kredileri */}
          <div className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => setCreditMenuOpen(!creditMenuOpen)}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                creditMenuOpen
                  ? 'bg-muted border-border text-foreground shadow-xs'
                  : 'bg-muted/40 border-border/70 hover:bg-muted/80 text-muted-foreground hover:text-foreground'
              }`}
            >
              <Zap size={13} className="text-amber-500 fill-amber-500/30" />
              <span className="tabular-nums font-semibold text-foreground">{aiCredits.limit - aiCredits.used}</span>
              <span className="text-[11px] text-muted-foreground">Kredi</span>
            </button>

            <AnimatePresence>
              {creditMenuOpen && (
                <>
                  <div className="fixed inset-0 z-[60]" onClick={() => setCreditMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-72 bg-card border border-border rounded-xl shadow-xl z-[61] overflow-hidden"
                  >
                    <div className="p-4 border-b border-border/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground">İşlem & AI Kredisi</span>
                        <Zap size={14} className="text-amber-500" />
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-semibold text-foreground tabular-nums">
                          {aiCredits.limit - aiCredits.used}
                        </span>
                        <span className="text-xs text-muted-foreground">/ {aiCredits.limit} aylık</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all"
                          style={{ width: `${100 - creditPct}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground">{aiCredits.used} kredi kullanıldı</p>
                    </div>
                    <div className="p-3">
                      <Link href="/dashboard/upgrade" onClick={() => setCreditMenuOpen(false)}>
                        <button
                          type="button"
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <Sparkles size={13} /> Paketi Yükselt
                        </button>
                      </Link>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* İkon grubu */}
          <div className="flex items-center gap-0.5 p-1 rounded-xl bg-muted/40 border border-border/70">
            <NotificationBell />
            <AnnouncementDropdown
              announcements={activeAnnouncements}
              unreadCount={unreadCount}
              onRead={markAsRead}
              onDismiss={dismiss}
            />
            <HeaderIconButton
              onClick={triggerHaptic}
              label="Yardım"
              className="hidden sm:flex"
            >
              <HelpCircle className="w-4 h-4" />
            </HeaderIconButton>
            <HeaderIconButton
              onClick={() => {
                triggerHaptic();
                toggleTheme();
              }}
              label="Tema değiştir"
            >
              {resolvedMode === 'dark' ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </HeaderIconButton>
            <HeaderIconButton
              onClick={() => {
                triggerHaptic();
                toggleLiveFeed();
              }}
              label="Canlı akış"
              active={showLiveFeed}
              className="hidden xl:flex"
            >
              <Activity className="w-4 h-4" />
            </HeaderIconButton>
          </div>

          <div className="hidden lg:block w-px h-6 bg-border/80" />

          <DashboardUserMenu
            session={session}
            tenantPlan={tenantPlan}
            open={profileMenuOpen}
            onToggle={() => setProfileMenuOpen(!profileMenuOpen)}
            onClose={() => setProfileMenuOpen(false)}
          />
        </div>
      </div>
    </header>
  );
}
