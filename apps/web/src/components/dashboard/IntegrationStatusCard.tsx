'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, RefreshCw, Plug, ArrowUpRight } from 'lucide-react';
import { DashboardCard, PLATFORM_COLORS } from './dashboard-ui';

type PlatformRow = {
  platform: string;
  revenue?: number;
  orders?: number;
  growth?: number;
  share?: number;
};

export function IntegrationStatusCard({
  platforms,
  loading,
}: {
  platforms?: PlatformRow[];
  loading?: boolean;
}) {
  const items = platforms || [];

  return (
    <DashboardCard
      title="Entegrasyon Durumu"
      icon={Plug}
      loading={loading}
      action={
        <Link
          href="/dashboard/stores"
          className="text-xs font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
        >
          <span>Mağazalar</span>
          <ArrowUpRight size={13} />
        </Link>
      }
    >
      {items.length === 0 && !loading ? (
        <div className="rounded-lg border border-dashed border-border/80 p-6 text-center">
          <p className="text-xs font-medium text-foreground">Henüz platform verisi yok</p>
          <p className="text-[11px] text-muted-foreground mt-1 mb-3">Pazaryeri mağazalarınızı bağlayın.</p>
          <Link
            href="/dashboard/stores"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-500 transition-colors shadow-xs"
          >
            Entegrasyon Ekle
          </Link>
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.slice(0, 5).map((p) => {
            const growth = p.growth ?? 0;
            const healthy = growth >= 0;
            const dot = PLATFORM_COLORS[p.platform] || 'bg-slate-400';
            const share = Math.min(100, Math.max(6, p.share ?? (p.revenue ? 25 : 15)));

            return (
              <div key={p.platform} className="p-3 rounded-lg bg-muted/30 border border-border/60">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
                    <span className="text-xs font-medium text-foreground truncate">{p.platform}</span>
                  </div>
                  <div
                    className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                      healthy ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {healthy ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                    <span>{healthy ? 'Aktif' : 'İncelenmeli'}</span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full ${dot} opacity-80 transition-all duration-500`}
                    style={{ width: `${share}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2 text-[11px] text-muted-foreground">
                  <span>{p.orders ?? 0} sipariş</span>
                  <span className="tabular-nums font-medium text-foreground">
                    ₺{(p.revenue ?? 0).toLocaleString('tr-TR')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardCard>
  );
}
