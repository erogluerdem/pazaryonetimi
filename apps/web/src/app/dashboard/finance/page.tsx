"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet,
  TrendingUp,
  Receipt,
  Percent,
  Download,
  Zap,
  Scale,
  BarChart3,
  CreditCard,
  Package,
  TrendingDown,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useFinance, usePlatformPerformance, useSalesForecast, FinanceStats } from '@/lib/hooks';
import { REALISTIC_PLATFORMS } from '@/lib/marketplace-seed-data';

interface FinancePlatform {
  name: string;
  revenue: number;
  cost: number;
  margin: string;
  colors: { bg: string; bar: string; dot: string };
}

type Period = '7d' | '30d' | '90d' | '365d';

const PERIOD_LABELS: Record<Period, string> = {
  '7d': 'Son 7 Gün',
  '30d': 'Son 30 Gün',
  '90d': 'Son 90 Gün',
  '365d': 'Bu Yıl',
};

const platformColors: Record<string, { bg: string; bar: string; dot: string }> = {
  Trendyol: { bg: 'bg-orange-500/10', bar: 'bg-orange-500', dot: 'bg-orange-500' },
  Amazon: { bg: 'bg-amber-500/10', bar: 'bg-amber-500', dot: 'bg-amber-500' },
  'Amazon TR': { bg: 'bg-amber-500/10', bar: 'bg-amber-500', dot: 'bg-amber-500' },
  Hepsiburada: { bg: 'bg-blue-500/10', bar: 'bg-blue-500', dot: 'bg-blue-500' },
  N11: { bg: 'bg-purple-500/10', bar: 'bg-purple-500', dot: 'bg-purple-500' },
  Çiçeksepeti: { bg: 'bg-pink-500/10', bar: 'bg-pink-500', dot: 'bg-pink-500' },
};

function SparkLine({ values, color = '#10b981' }: { values: number[]; color?: string }) {
  if (!values || values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const w = 260;
  const h = 48;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 6) - 3;
      return `${x},${y}`;
    })
    .join(' ');
  const areaPath =
    `M0,${h} ` +
    values
      .map((v, i) => {
        const x = (i / (values.length - 1)) * w;
        const y = h - ((v - min) / range) * (h - 6) - 3;
        return `L${x},${y}`;
      })
      .join(' ') +
    ` L${w},${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-12" preserveAspectRatio="none">
      <defs>
        <linearGradient id="fin-sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#fin-sg)" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function FinancePage() {
  const [period, setPeriod] = useState<Period>('30d');
  const { getStats, loading } = useFinance();
  const { data: platformData } = usePlatformPerformance(period);
  const { data: forecastData } = useSalesForecast(30);
  const [stats, setStats] = useState<FinanceStats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      const data = await getStats();
      setStats(data as FinanceStats | null);
    };
    fetchStats();
  }, [period]);

  const displayStats = stats || {
    totalRevenue: 284950,
    totalProfit: 68388,
    totalCommission: 42742,
    margin: 24,
    orderCount: 412,
  };

  const platformsSource =
    Array.isArray(platformData) && platformData.length > 0 ? platformData : REALISTIC_PLATFORMS;

  const displayPlatforms: FinancePlatform[] = (platformsSource as any[]).map((p) => ({
    name: p.name || p.platform,
    revenue: p.revenue || 0,
    cost: p.cost || Math.round((p.revenue || 0) * 0.15),
    margin:
      p.revenue > 0
        ? (((p.revenue - (p.cost || Math.round(p.revenue * 0.15))) / p.revenue) * 100).toFixed(1)
        : '0.0',
    colors: platformColors[p.name || p.platform] || {
      bg: 'bg-slate-500/10',
      bar: 'bg-slate-500',
      dot: 'bg-slate-500',
    },
  }));

  const maxRevenue = Math.max(...displayPlatforms.map((p) => p.revenue), 1);

  const sparkValues = [
    Math.round(displayStats.totalRevenue * 0.72),
    Math.round(displayStats.totalRevenue * 0.78),
    Math.round(displayStats.totalRevenue * 0.85),
    Math.round(displayStats.totalRevenue * 0.91),
    Math.round(displayStats.totalRevenue * 0.89),
    Math.round(displayStats.totalRevenue * 0.96),
    displayStats.totalRevenue,
  ];

  const downloadCSV = () => {
    if (!displayPlatforms.length) return;
    const rows = [
      ['Platform', 'Gelir (₺)', 'Maliyet (₺)', 'Marj (%)'],
      ...displayPlatforms.map((p) => [p.name, p.revenue.toFixed(2), p.cost.toFixed(2), p.margin]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finans-raporu-${period}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Wallet className="w-4 h-4" />
            </div>
            <h1 className="text-xl lg:text-2xl font-semibold text-foreground tracking-tight">
              Finans & Kârlılık Analizi
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Pazaryeri komisyonları, net marjlar ve kanallara göre kârlılık özetiniz.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex p-0.5 rounded-lg bg-muted/50 border border-border/60">
            {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                  period === p
                    ? 'bg-card text-foreground font-semibold shadow-2xs border border-border/40'
                    : 'text-muted-foreground hover:text-foreground font-medium'
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={downloadCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-card hover:bg-muted border border-border/70 rounded-lg text-xs font-medium text-foreground transition-colors shadow-2xs"
          >
            <Download size={13} />
            <span>CSV Aktar</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {[
          {
            label: 'Toplam Ciro',
            value: `₺${displayStats.totalRevenue.toLocaleString('tr-TR')}`,
            trend: '+18.4%',
            up: true,
            color: 'text-indigo-600 dark:text-indigo-400',
          },
          {
            label: 'Net Kâr',
            value: `₺${displayStats.totalProfit.toLocaleString('tr-TR')}`,
            trend: '+15.2%',
            up: true,
            color: 'text-emerald-600 dark:text-emerald-400',
          },
          {
            label: 'Toplam Komisyon',
            value: `₺${displayStats.totalCommission.toLocaleString('tr-TR')}`,
            trend: '-2.1%',
            up: false,
            color: 'text-amber-600 dark:text-amber-400',
          },
          {
            label: 'Kâr Marjı',
            value: `%${displayStats.margin}`,
            trend: '+1.1%',
            up: true,
            color: 'text-sky-600 dark:text-sky-400',
          },
        ].map((s) => (
          <div
            key={s.label}
            className="dash-card p-3.5 sm:p-4 rounded-xl border border-border/70 bg-card shadow-2xs"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
              <span
                className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${
                  s.up
                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/8 border-emerald-500/20'
                    : 'text-rose-600 dark:text-rose-400 bg-rose-500/8 border-rose-500/20'
                }`}
              >
                {s.up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />} {s.trend}
              </span>
            </div>
            <p className={`text-lg sm:text-xl font-semibold ${s.color} tracking-tight tabular-nums`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Revenue Trend Sparkline Card */}
      <div className="rounded-xl border border-border/70 bg-card p-4 sm:p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xs sm:text-sm font-semibold text-foreground tracking-tight">
              Gelir ve Nakit Akış Trendi
            </h3>
            <p className="text-[11px] text-muted-foreground">Son 30 günlük dönemsel büyüme grafiği</p>
          </div>
          <span className="text-[11px] font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md border border-border/50">
            {PERIOD_LABELS[period]}
          </span>
        </div>
        <SparkLine values={sparkValues} color="#10b981" />
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-border/50 text-[11px] text-muted-foreground">
          <span>Dönem Başı: ₺{Math.round(displayStats.totalRevenue * 0.72).toLocaleString('tr-TR')}</span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
            ₺{displayStats.totalRevenue.toLocaleString('tr-TR')} Güncel Ciro
          </span>
        </div>
      </div>

      {/* Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Platform P&L Breakdown */}
        <div className="lg:col-span-7 rounded-xl border border-border/70 bg-card p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-foreground tracking-tight">
                Pazaryeri Kârlılık Dağılımı
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Kanallara göre brüt gelir, kesintiler ve kalan net kâr
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {displayPlatforms.map((platform, i) => (
              <div key={platform.name} className="space-y-1.5 p-2.5 rounded-lg bg-muted/20 border border-border/40">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${platform.colors.dot}`} />
                    <span className="font-medium text-foreground">{platform.name}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-muted-foreground tabular-nums">
                      ₺{platform.revenue.toLocaleString('tr-TR')}
                    </span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      %{platform.margin}
                    </span>
                  </div>
                </div>

                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(platform.revenue / maxRevenue) * 100}%` }}
                    transition={{ delay: 0.1 * i, duration: 0.5 }}
                    className={`h-full rounded-full ${platform.colors.bar}`}
                  />
                </div>

                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Komisyon & Kesinti: ₺{platform.cost.toLocaleString('tr-TR')}</span>
                  <span className="font-medium text-foreground">
                    Net: ₺{(platform.revenue - platform.cost).toLocaleString('tr-TR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Financial Insights */}
        <div className="lg:col-span-5 rounded-xl border border-border/70 bg-card p-4 sm:p-5 shadow-2xs space-y-3.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Zap size={13} />
            </div>
            <h3 className="text-xs sm:text-sm font-semibold text-foreground tracking-tight">
              Akıllı Kârlılık Öngörüleri
            </h3>
          </div>

          <div className="space-y-2.5">
            <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold mb-1">
                <TrendingUp size={13} />
                <span>Fiyat Optimizasyonu</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Trendyol Elektronik kategorisinde ortalama marjınız %24. Fiyatları %3.5 esnetmek satış hacmini %18 büyütebilir.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-sky-500/5 border border-sky-500/20 text-xs">
              <div className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 font-semibold mb-1">
                <Scale size={13} />
                <span>Nakit Akışı & Mutabakat</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Hepsiburada ve Amazon hakediş ödemeleri haftaya cuma hesabınıza aktarılacak (Tahmini ₺84.200).
              </p>
            </div>

            <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs">
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold mb-1">
                <BarChart3 size={13} />
                <span>Kargo Maliyeti Tasarrufu</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Desi ağırlığı 2 kg altı gönderilerde Trendyol Express ile anlaşmalı tarife ₺3.800 tasarruf sağlıyor.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <div className="p-3 rounded-lg bg-muted/40 border border-border/60 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Gelecek Ay Tahmini Kâr</p>
                <p className="text-base font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  ₺{Math.round(displayStats.totalProfit * 1.15).toLocaleString('tr-TR')}
                </p>
              </div>
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                +%15 Tahmini Artış
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cost Breakdown Cards */}
      <div className="rounded-xl border border-border/70 bg-card p-4 sm:p-5 shadow-2xs">
        <h3 className="text-xs sm:text-sm font-semibold text-foreground tracking-tight mb-3">
          Operasyonel Gider Dağılımı
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: 'Pazaryeri Komisyonu',
              value: displayStats.totalCommission,
              pct: '%15.0',
              icon: CreditCard,
              color: 'text-amber-600 dark:text-amber-400',
            },
            {
              label: 'Kargo & Lojistik',
              value: Math.round(displayStats.totalRevenue * 0.065),
              pct: '%6.5',
              icon: Package,
              color: 'text-blue-600 dark:text-blue-400',
            },
            {
              label: 'Pazaryeri Reklamı',
              value: Math.round(displayStats.totalRevenue * 0.045),
              pct: '%4.5',
              icon: TrendingDown,
              color: 'text-violet-600 dark:text-violet-400',
            },
            {
              label: 'İade & Fire Maliyeti',
              value: Math.round(displayStats.totalRevenue * 0.02),
              pct: '%2.0',
              icon: RefreshCw,
              color: 'text-rose-600 dark:text-rose-400',
            },
          ].map((c) => (
            <div key={c.label} className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex items-center justify-between mb-1.5">
                <c.icon className={`w-3.5 h-3.5 ${c.color}`} />
                <span className="text-[10px] font-medium text-muted-foreground">{c.pct}</span>
              </div>
              <p className="text-sm sm:text-base font-semibold text-foreground tabular-nums">
                ₺{c.value.toLocaleString('tr-TR')}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{c.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
