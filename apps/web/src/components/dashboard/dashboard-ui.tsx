'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, Loader2, Minus } from 'lucide-react';
import type { DashboardPeriod } from '@/lib/dashboard-layout';
import { PERIOD_LABELS } from '@/lib/dashboard-layout';

export const PLATFORM_COLORS: Record<string, string> = {
  Trendyol: 'bg-orange-500',
  TRENDYOL: 'bg-orange-500',
  Hepsiburada: 'bg-blue-500',
  HEPSIBURADA: 'bg-blue-500',
  Amazon: 'bg-amber-500',
  AMAZON: 'bg-amber-500',
  N11: 'bg-purple-500',
  Çiçeksepeti: 'bg-pink-500',
};

export const CHART_COLORS = ['#4f46e5', '#6366f1', '#818cf8', '#10b981', '#0ea5e9', '#8b5cf6'];

export function DashboardCard({
  children,
  className = '',
  title,
  icon: Icon,
  action,
  loading,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  icon?: React.ComponentType<{ className?: string; size?: number }>;
  action?: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`dash-card p-5 lg:p-6 relative overflow-hidden rounded-xl border border-border/70 bg-card shadow-xs transition-shadow duration-200 hover:shadow-sm ${className}`}
    >
      {(title || Icon) && (
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            {Icon && (
              <div className="w-8 h-8 rounded-lg bg-muted/60 text-muted-foreground border border-border/40 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4" />
              </div>
            )}
            {title && (
              <h3 className="text-sm font-semibold text-foreground tracking-tight truncate">
                {title}
              </h3>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
            {action}
          </div>
        </div>
      )}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

export function PeriodSelector({
  value,
  onChange,
}: {
  value: DashboardPeriod;
  onChange: (p: DashboardPeriod) => void;
}) {
  return (
    <div className="inline-flex p-1 rounded-xl bg-muted/50 border border-border/60">
      {(Object.keys(PERIOD_LABELS) as DashboardPeriod[]).map((p) => {
        const isSelected = value === p;
        return (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all duration-150 ${
              isSelected
                ? 'bg-card text-foreground font-semibold shadow-xs border border-border/40'
                : 'text-muted-foreground hover:text-foreground font-medium'
            }`}
          >
            {PERIOD_LABELS[p]}
          </button>
        );
      })}
    </div>
  );
}

export function AnimatedNumber({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = 600;
    const steps = 20;
    const increment = (value - display) / steps;
    let current = display;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      current += increment;
      if (step >= steps) {
        current = value;
        clearInterval(timer);
      }
      setDisplay(current);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <span>
      {prefix}
      {display.toLocaleString('tr-TR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  );
}

export function TrendBadge({ value, suffix = '%' }: { value: number; suffix?: string }) {
  const isPositive = value > 0;
  const isNeutral = value === 0;

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium tabular-nums border ${
        isPositive
          ? 'bg-emerald-500/8 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
          : isNeutral
            ? 'bg-slate-500/8 text-slate-500 dark:text-slate-400 border-slate-500/20'
            : 'bg-rose-500/8 text-rose-600 dark:text-rose-400 border-rose-500/20'
      }`}
    >
      {isPositive ? (
        <ArrowUpRight size={11} className="shrink-0" />
      ) : isNeutral ? (
        <Minus size={11} className="shrink-0" />
      ) : (
        <ArrowDownRight size={11} className="shrink-0" />
      )}
      <span>
        {isPositive ? '+' : ''}
        {value.toFixed(1)}
        {suffix}
      </span>
    </div>
  );
}

export function Sparkline({
  data,
  color = '#4f46e5',
  height = 32,
}: {
  data: number[];
  color?: string;
  height?: number;
}) {
  if (data.length < 2) return <div className="h-8" />;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 100;
  const points = data
    .map(
      (v, i) =>
        `${(i / (data.length - 1)) * w},${height - ((v - min) / range) * (height - 6) - 3}`,
    )
    .join(' ');
  const areaPoints = `0,${height} ${points} ${w},${height}`;
  const gradId = `spark-${Math.abs(data[0] || 1)}-${color.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full h-8 overflow-visible" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.15} />
          <stop offset="100%" stopColor={color} stopOpacity={0.0} />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#${gradId})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function KPICard({
  title,
  value,
  format = 'number',
  trend,
  icon: Icon,
  sparkData,
  loading,
  accent = 'text-indigo-600 dark:text-indigo-400',
}: {
  title: string;
  value?: number;
  format?: 'number' | 'currency' | 'percentage';
  trend?: number;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  sparkData?: number[];
  loading?: boolean;
  accent?: string;
  glow?: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className="dash-card p-4 sm:p-5 relative overflow-hidden rounded-xl border border-border/70 bg-card shadow-xs hover:shadow-sm hover:border-border transition-all duration-200 min-w-0"
    >
      {loading ? (
        <div className="flex items-center gap-2 py-5">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Yükleniyor...</span>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3 relative z-10 gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-muted/60 text-muted-foreground border border-border/40 ${accent}`}>
              <Icon className="w-4 h-4" />
            </div>
            {trend !== undefined && trend !== null && <TrendBadge value={trend} />}
          </div>
          <p className="text-xs font-medium text-muted-foreground mb-1 truncate">{title}</p>
          <p className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight tabular-nums truncate">
            {typeof value === 'number' ? (
              <AnimatedNumber
                value={value}
                prefix={format === 'currency' ? '₺' : ''}
                suffix={format === 'percentage' ? '%' : ''}
                decimals={format === 'percentage' ? 1 : 0}
              />
            ) : format === 'currency' ? (
              '₺0'
            ) : format === 'percentage' ? (
              '0%'
            ) : (
              '0'
            )}
          </p>
          {sparkData && sparkData.length > 1 && (
            <div className="mt-2.5 overflow-hidden">
              <Sparkline data={sparkData} />
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}

export function buildSparkSeries(base: number, change = 0, points = 8): number[] {
  const safe = Math.max(base, 1);
  return Array.from({ length: points }, (_, i) => {
    const progress = i / (points - 1);
    const wave = Math.sin(i * 0.9) * 0.05;
    const trendFactor = 1 + (change / 100) * progress * 0.4;
    return Math.round((safe / points) * (0.8 + progress * 0.4 + wave) * trendFactor * points);
  });
}

export function buildRevenueTrend(revenue = 0, orders = 0, change = 0, period: DashboardPeriod) {
  const len = period === '7d' ? 7 : period === '90d' ? 12 : 10;
  return Array.from({ length: len }, (_, i) => {
    const progress = (i + 1) / len;
    const factor = 0.65 + progress * 0.35 + (change / 100) * progress * 0.25;
    return {
      name: period === '7d' ? `G${i + 1}` : `H${i + 1}`,
      value: Math.round((revenue / len) * factor),
      value2: Math.round((orders / len) * factor),
    };
  });
}

export function StatusPill({ status }: { status: string }) {
  const normalized = status?.toLowerCase() || '';
  const isCompleted =
    normalized.includes('tamam') || normalized.includes('deliver') || normalized === 'completed';
  const isShipped = normalized.includes('kargo') || normalized.includes('ship');
  const isCancelled = normalized.includes('iptal') || normalized.includes('cancel');

  const cls = isCompleted
    ? 'bg-emerald-500/8 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
    : isShipped
      ? 'bg-sky-500/8 text-sky-600 dark:text-sky-400 border-sky-500/20'
      : isCancelled
        ? 'bg-rose-500/8 text-rose-600 dark:text-rose-400 border-rose-500/20'
        : 'bg-amber-500/8 text-amber-600 dark:text-amber-400 border-amber-500/20';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${cls}`}>
      {status}
    </span>
  );
}
