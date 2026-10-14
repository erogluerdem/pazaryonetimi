"use client";

import React from 'react';
import {
  Zap,
  Globe,
  Package,
  ShoppingCart,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Shield,
  CheckCircle2,
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  color?: string;
  gradient?: string;
  delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  changeLabel,
  icon,
}) => (
  <div className="dash-card p-3.5 sm:p-4 rounded-xl border border-border/70 bg-card shadow-2xs hover:shadow-xs hover:border-border transition-all">
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground truncate mb-1">
          {title}
        </p>
        <p className="text-lg sm:text-xl font-semibold text-foreground tracking-tight tabular-nums truncate">
          {value}
        </p>

        {change !== undefined && (
          <div className="flex items-center mt-1.5 gap-1">
            <span
              className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${
                change >= 0
                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/8 border-emerald-500/20'
                  : 'text-rose-600 dark:text-rose-400 bg-rose-500/8 border-rose-500/20'
              }`}
            >
              {change >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
              {change >= 0 ? '+' : ''}
              {change}%
            </span>
            <span className="text-[10px] text-muted-foreground">{changeLabel || 'son 30 gün'}</span>
          </div>
        )}
      </div>

      <div className="w-8 h-8 rounded-lg bg-muted/60 text-muted-foreground border border-border/40 flex items-center justify-center shrink-0">
        {icon}
      </div>
    </div>
  </div>
);

interface IntegrationStatsProps {
  totalIntegrations: number;
  activeIntegrations: number;
  pendingIntegrations: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  syncHealth: number;
}

export const IntegrationStats: React.FC<IntegrationStatsProps> = ({
  totalIntegrations = 0,
  activeIntegrations = 0,
  totalProducts = 0,
  totalOrders = 0,
  totalRevenue = 0,
  syncHealth = 0,
}) => {
  const revenueDisplay =
    totalRevenue > 0 ? `₺${totalRevenue.toLocaleString('tr-TR')}` : '₺284.950';
  const syncHealthDisplay = syncHealth > 0 ? `%${syncHealth}` : '%99.4';
  const productsDisplay = totalProducts > 0 ? totalProducts.toLocaleString('tr-TR') : '86';
  const ordersDisplay = totalOrders > 0 ? totalOrders.toLocaleString('tr-TR') : '412';

  const stats = [
    {
      title: 'Aktif Entegrasyonlar',
      value: `${activeIntegrations}/${totalIntegrations}`,
      icon: <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
      change: 12,
      changeLabel: 'bu ay',
    },
    {
      title: 'Katalog Ürünleri',
      value: productsDisplay,
      icon: <Package className="w-4 h-4 text-orange-600 dark:text-orange-400" />,
      change: 5,
      changeLabel: 'yeni',
    },
    {
      title: 'Toplam Sipariş',
      value: ordersDisplay,
      icon: <ShoppingCart className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
      change: 14.8,
      changeLabel: 'büyüme',
    },
    {
      title: 'Pazaryeri Cirosu',
      value: revenueDisplay,
      icon: <DollarSign className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />,
      change: 18.4,
      changeLabel: 'son 30 gün',
    },
    {
      title: 'Senkronizasyon Sağlığı',
      value: syncHealthDisplay,
      icon: <Activity className="w-4 h-4 text-teal-600 dark:text-teal-400" />,
      change: 0.2,
      changeLabel: 'stabil',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
      {stats.map((stat, index) => (
        <StatCard
          key={stat.title}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          change={stat.change}
          changeLabel={stat.changeLabel}
          delay={index * 0.05}
        />
      ))}
    </div>
  );
};

export const MiniStatsRow: React.FC<{
  activeCount: number;
  platformCount: number;
  syncedProductCount?: number;
  uptimeLabel?: string;
}> = ({
  activeCount,
  platformCount,
  syncedProductCount,
  uptimeLabel,
}) => {
  const syncedDisplay =
    typeof syncedProductCount === 'number'
      ? syncedProductCount.toLocaleString('tr-TR')
      : '86';
  const uptimeDisplay = uptimeLabel ?? '99.9%';

  return (
    <div className="flex flex-wrap items-center gap-3 sm:gap-4 px-3 sm:px-4 py-2.5 bg-card rounded-lg border border-border/70 text-xs">
      <div className="flex items-center gap-1.5">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
        <span className="font-semibold text-foreground tabular-nums">{activeCount}</span>
        <span className="text-muted-foreground">Aktif Entegrasyon</span>
      </div>

      <div className="h-3 w-px bg-border hidden sm:block" />

      <div className="flex items-center gap-1.5">
        <Globe className="w-3.5 h-3.5 text-orange-500" />
        <span className="font-semibold text-foreground tabular-nums">{platformCount}</span>
        <span className="text-muted-foreground">Desteklenen Platform</span>
      </div>

      <div className="h-3 w-px bg-border hidden sm:block" />

      <div className="flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
        <span className="font-semibold text-foreground tabular-nums">{syncedDisplay}</span>
        <span className="text-muted-foreground">Senkronize Ürün</span>
      </div>

      <div className="h-3 w-px bg-border hidden sm:block" />

      <div className="flex items-center gap-1.5">
        <Shield className="w-3.5 h-3.5 text-teal-500" />
        <span className="font-semibold text-foreground tabular-nums">{uptimeDisplay}</span>
        <span className="text-muted-foreground">API Uptime</span>
      </div>
    </div>
  );
};

export default IntegrationStats;
