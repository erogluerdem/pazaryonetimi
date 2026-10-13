"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { AnimatePresence } from 'framer-motion';
import { RefreshCw, Download, Loader2, LayoutGrid } from 'lucide-react';
import { useDashboardStats, useRecentOrders, useAiInsights } from '@/lib/hooks';
import type { DashboardPeriod } from '@/lib/dashboard-layout';
import { PeriodSelector } from '@/components/dashboard/dashboard-ui';
import { MorningBriefing } from '@/components/dashboard/MorningBriefing';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const DynamicDashboard = dynamic(
  () => import('@/components/dashboard/DynamicDashboard').then((mod) => ({ default: mod.DynamicDashboard })),
  {
    ssr: false,
    loading: () => <DashboardSkeleton />,
  },
);

const BRIEFING_KEY = 'pazaryonetimi-briefing-seen';

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-28 bg-muted/40 rounded-xl border border-border/50" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-72 bg-muted/40 rounded-xl border border-border/50" />
        <div className="h-72 bg-muted/40 rounded-xl border border-border/50" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<DashboardPeriod>('30d');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showBriefing, setShowBriefing] = useState(false);

  const { refetch: refetchStats } = useDashboardStats(period);
  const { refetch: refetchOrders } = useRecentOrders(8);
  const { refetch: refetchInsights } = useAiInsights();

  useEffect(() => {
    const today = new Date().toDateString();
    const seen = localStorage.getItem(BRIEFING_KEY);
    if (seen !== today) setShowBriefing(true);
  }, []);

  const dismissBriefing = () => {
    localStorage.setItem(BRIEFING_KEY, new Date().toDateString());
    setShowBriefing(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchStats(), refetchOrders(), refetchInsights()]);
    setIsRefreshing(false);
  };

  const handleDownloadReport = () => {
    window.open('/api/reports/dashboard-export', '_blank');
  };

  return (
    <>
      <AnimatePresence>{showBriefing && <MorningBriefing onClose={dismissBriefing} />}</AnimatePresence>

      <div className="space-y-6 animate-in fade-in duration-300 pb-20" data-dashboard>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl lg:text-2xl font-semibold text-foreground tracking-tight">
                Kontrol Paneli
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/8 border border-emerald-500/20 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Canlı Veri
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Satış performansı, envanter durumu ve pazaryeri hareketlerinizin anlık özeti.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <PeriodSelector value={period} onChange={setPeriod} />

            <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
              <Link
                href="/dashboard/widget-editor"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-card hover:bg-muted border border-border/80 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground transition-colors shadow-xs"
                title="Paneli Özelleştir"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Özelleştir</span>
              </Link>

              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-card hover:bg-muted border border-border/80 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground transition-colors shadow-xs disabled:opacity-50"
              >
                {isRefreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">Yenile</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadReport}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white border border-transparent rounded-lg text-xs font-medium transition-colors shadow-xs"
                title="Rapor Dışa Aktar"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Rapor</span>
              </button>
            </div>
          </div>
        </div>

        <ErrorBoundary>
          <DynamicDashboard period={period} />
        </ErrorBoundary>
      </div>
    </>
  );
}
