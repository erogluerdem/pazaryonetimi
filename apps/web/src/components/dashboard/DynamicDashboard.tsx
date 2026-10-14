'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  DollarSign, ShoppingCart, Package, TrendingUp, Sparkles, Activity,
  AlertTriangle, LayoutGrid, Percent, CheckCircle2,
} from 'lucide-react';
import {
  useDashboardStats,
  useRecentOrders,
  useAiInsights,
  usePlatformPerformance,
  useActivityFeed,
  useStockAlerts,
  useGoals,
  useMarketplaceHealth,
} from '@/lib/hooks';
import {
  loadDashboardWidgets,
  loadDashboardWidgetsFromApi,
  isWidgetVisible,
  type DashboardPeriod,
} from '@/lib/dashboard-layout';
import {
  DashboardCard,
  KPICard,
  buildSparkSeries,
  buildRevenueTrend,
  CHART_COLORS,
} from './dashboard-ui';
import { AnimatedAreaChart, AnimatedPieChart } from '@/components/ui/AnimatedCharts';
import { IntegrationStatusCard } from './IntegrationStatusCard';
import { DashboardOrdersTable } from './DashboardOrdersTable';
import GoalTracker from './GoalTracker';
import MarketplaceHealthMap from './MarketplaceHealthMap';
import { GhostStockWidget } from './GhostStockWidget';
import { OrderPipeline } from './OrderPipeline';
import { SyncQueuePanel } from './SyncQueuePanel';
import { useModules } from '@/lib/modules';

function toSafeArray<T = any>(val: any): T[] {
  if (Array.isArray(val)) return val;
  if (Array.isArray(val?.data)) return val.data;
  if (Array.isArray(val?.items)) return val.items;
  return [];
}

interface DynamicDashboardProps {
  period?: DashboardPeriod;
  editable?: boolean;
}

export const DynamicDashboard: React.FC<DynamicDashboardProps> = ({ period = '30d' }) => {
  const [widgets, setWidgets] = useState(loadDashboardWidgets);

  useEffect(() => {
    (async () => {
      const remote = await loadDashboardWidgetsFromApi();
      setWidgets(remote || loadDashboardWidgets());
    })();
    const onStorage = () => setWidgets(loadDashboardWidgets());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const { data: stats, loading: statsLoading } = useDashboardStats(period);
  const comparison = stats?.periodComparison;
  const { data: ordersRaw, loading: ordersLoading } = useRecentOrders(8);
  const orders = toSafeArray(ordersRaw);
  const { data: insightsRaw, loading: insightsLoading } = useAiInsights();
  const insights = toSafeArray(insightsRaw);
  const { data: platformsRaw, loading: platformsLoading } = usePlatformPerformance();
  const platforms = toSafeArray(platformsRaw);
  const { data: activitiesRaw, loading: activitiesLoading } = useActivityFeed(8);
  const activities = toSafeArray(activitiesRaw);
  const { data: stockAlertsRaw, loading: stockLoading } = useStockAlerts();
  const stockAlerts = toSafeArray(stockAlertsRaw);
  const { data: goalsRaw, loading: goalsLoading } = useGoals();
  const goals = toSafeArray(goalsRaw);
  const { data: marketplaceHealthRaw, loading: healthLoading } = useMarketplaceHealth();
  const marketplaceHealth = toSafeArray(marketplaceHealthRaw);
  const { syncQueue, orderPipeline, retrySyncIntegration } = useModules();

  const pieData = useMemo(
    () =>
      platforms.map((p: any) => ({
        name: p.platform,
        value: Math.round(p.revenue || p.orders || 1),
      })),
    [platforms],
  );

  const revenueTrend = useMemo(
    () =>
      buildRevenueTrend(
        stats?.totalRevenue || 0,
        stats?.totalOrders || 0,
        comparison?.revenueChange || 0,
        period,
      ),
    [stats, comparison, period],
  );

  const show = (id: Parameters<typeof isWidgetVisible>[1]) => isWidgetVisible(widgets, id);

  return (
    <div className="space-y-6">
      {show('kpis') && (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 lg:gap-4">
          <KPICard
            title="Toplam Ciro"
            value={stats?.totalRevenue}
            trend={comparison?.revenueChange ?? 0}
            icon={DollarSign}
            format="currency"
            sparkData={buildSparkSeries(stats?.totalRevenue || 0, comparison?.revenueChange ?? 0)}
            loading={statsLoading}
            accent="text-indigo-600 dark:text-indigo-400"
          />
          <KPICard
            title="Sipariş Hacmi"
            value={stats?.totalOrders}
            trend={comparison?.ordersChange ?? 0}
            icon={ShoppingCart}
            sparkData={buildSparkSeries(stats?.totalOrders || 0, comparison?.ordersChange ?? 0)}
            loading={statsLoading}
            accent="text-blue-600 dark:text-blue-400"
          />
          <KPICard
            title="Aktif Ürünler"
            value={stats?.activeProducts}
            trend={comparison?.productsChange ?? 0}
            icon={Package}
            loading={statsLoading}
            accent="text-violet-600 dark:text-violet-400"
          />
          <KPICard
            title="Dönüşüm Oranı"
            value={stats?.conversionRate}
            trend={comparison?.conversionChange ?? 0}
            icon={TrendingUp}
            format="percentage"
            loading={statsLoading}
            accent="text-emerald-600 dark:text-emerald-400"
          />
          <KPICard
            title="Net Kâr"
            value={stats?.netProfit}
            trend={comparison?.profitChange ?? 0}
            icon={DollarSign}
            format="currency"
            loading={statsLoading}
            accent="text-teal-600 dark:text-teal-400"
          />
          <KPICard
            title="Kâr Marjı"
            value={stats?.profitMargin}
            trend={comparison?.marginChange ?? 0}
            icon={Percent}
            format="percentage"
            loading={statsLoading}
            accent="text-sky-600 dark:text-sky-400"
          />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {show('revenue-chart') && (
          <div className="xl:col-span-7">
            <DashboardCard title="Gelir & Sipariş Trendi" icon={TrendingUp} loading={statsLoading}>
              <div className="h-[280px]">
                <AnimatedAreaChart data={revenueTrend} colors={[CHART_COLORS[0], CHART_COLORS[1]]} />
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" /> Ciro
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 inline-block" /> Sipariş
                  </span>
                </div>
                <span className="font-medium text-[11px] text-muted-foreground">Seçili Aralık: {period}</span>
              </div>
            </DashboardCard>
          </div>
        )}

        {show('platform-chart') && (
          <div className="xl:col-span-5">
            <DashboardCard title="Platform Dağılımı" icon={Package} loading={platformsLoading}>
              <div className="h-[280px]">
                {pieData.length > 0 ? (
                  <AnimatedPieChart data={pieData} />
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                    Platform verisi bekleniyor
                  </div>
                )}
              </div>
            </DashboardCard>
          </div>
        )}

        {show('integration-status') && (
          <div className="xl:col-span-4">
            <IntegrationStatusCard platforms={platforms as any[]} loading={platformsLoading} />
          </div>
        )}

        {show('orders') && (
          <div className="xl:col-span-8">
            <DashboardOrdersTable orders={orders} loading={ordersLoading} />
          </div>
        )}
      </div>

      {show('ai-hero') && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="rounded-xl border border-border/80 bg-card p-6 shadow-xs relative overflow-hidden"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Akıllı Operasyon & Öngörüler
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Aktif
                </span>
              </div>
              <h3 className="text-base font-semibold text-foreground tracking-tight">
                Otomatik Senkronizasyon ve Fiyat/Stok Optimizasyonu
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Pazaryeri entegrasyonlarınız genelinde siparişler, fiyat güncellemeleri ve kritik stok alarmları sürekli denetlenir.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 shrink-0">
              <div className="p-3.5 rounded-lg bg-muted/40 border border-border/50 text-left min-w-[120px]">
                <p className="text-[11px] font-medium text-muted-foreground mb-0.5">Öngörü Başarısı</p>
                <p className="text-lg font-semibold text-foreground tabular-nums">
                  %{stats?.aiMetrics?.accuracy?.toFixed(1) || '96.4'}
                </p>
              </div>
              <div className="p-3.5 rounded-lg bg-muted/40 border border-border/50 text-left min-w-[120px]">
                <p className="text-[11px] font-medium text-muted-foreground mb-0.5">Otomatik İşlem</p>
                <p className="text-lg font-semibold text-foreground tabular-nums">
                  {stats?.aiMetrics?.automatedActions || 0}
                </p>
              </div>
              <div className="p-3.5 rounded-lg bg-muted/40 border border-border/50 text-left min-w-[120px]">
                <p className="text-[11px] font-medium text-muted-foreground mb-0.5">Maliyet Tasarrufu</p>
                <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  ₺{(stats?.aiMetrics?.savingsGenerated || 0).toLocaleString('tr-TR')}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {show('profitability') && (
          <DashboardCard title="Kârlılık Analizi" icon={TrendingUp} loading={statsLoading}>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Brüt Ciro</span>
                <span className="font-semibold text-foreground tabular-nums">
                  ₺{(stats?.totalRevenue || 0).toLocaleString('tr-TR')}
                </span>
              </div>
              <div className="flex justify-between items-center text-rose-500 text-xs">
                <span>Ürün Maliyeti</span>
                <span className="tabular-nums font-medium">
                  - ₺{(stats?.financialAnalytics?.totalProductCost || 0).toLocaleString('tr-TR')}
                </span>
              </div>
              <div className="flex justify-between items-center text-rose-500 text-xs">
                <span>Pazaryeri Komisyonu</span>
                <span className="tabular-nums font-medium">
                  - ₺{(stats?.financialAnalytics?.totalCommission || 0).toLocaleString('tr-TR')}
                </span>
              </div>
              <div className="flex justify-between items-center text-rose-500 text-xs">
                <span>Kargo Maliyeti</span>
                <span className="tabular-nums font-medium">
                  - ₺{(stats?.financialAnalytics?.totalShipping || 0).toLocaleString('tr-TR')}
                </span>
              </div>
              <div className="pt-3 mt-3 border-t border-border flex justify-between items-center">
                <span className="font-semibold text-foreground text-sm">Net Kâr</span>
                <div className="text-right">
                  <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    ₺{(stats?.netProfit || 0).toLocaleString('tr-TR')}
                  </div>
                  <div className="text-[11px] font-medium text-muted-foreground">
                    %{stats?.profitMargin || 0} kâr marjı
                  </div>
                </div>
              </div>
            </div>
          </DashboardCard>
        )}

        {show('ai-insights') && (
          <DashboardCard title="Optimizasyon Önerileri" icon={Sparkles} loading={insightsLoading}>
            <div className="space-y-2.5 max-h-60 overflow-y-auto">
              {(insights || []).slice(0, 4).map((insight: any, i: number) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-muted/40 border border-border/60 hover:bg-muted/70 transition-colors"
                >
                  <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mb-0.5">
                    {insight.type || insight.title || 'Öneri'}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {insight.message || insight.description}
                  </p>
                </div>
              ))}
              {!insights?.length && !insightsLoading && (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  Şu an için yeni bir optimizasyon önerisi yok
                </p>
              )}
            </div>
          </DashboardCard>
        )}

        {show('stock-alerts') && (
          <DashboardCard title="Kritik Stok Uyarıları" icon={AlertTriangle} loading={stockLoading}>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {(stockAlerts || []).slice(0, 5).map((alert: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/40 border border-border/60"
                >
                  <div className="w-7 h-7 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Package className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground truncate">{alert.productName}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Kalan stok: <span className="font-semibold text-amber-600 dark:text-amber-400">{alert.currentStock ?? alert.stock} adet</span>
                    </p>
                  </div>
                </div>
              ))}
              {!stockAlerts?.length && !stockLoading && (
                <div className="py-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-500" />
                  Tüm ürünlerin stok seviyesi yeterli
                </div>
              )}
            </div>
          </DashboardCard>
        )}
      </div>

      {(show('order-pipeline') || show('sync-queue')) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {show('order-pipeline') && (
            <OrderPipeline
              orders={orders}
              counts={orderPipeline}
              loading={ordersLoading}
            />
          )}
          {show('sync-queue') && (
            <SyncQueuePanel items={syncQueue} onRetry={retrySyncIntegration} />
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {show('ghost-stock') && (
          <div className="lg:col-span-1">
            <GhostStockWidget />
          </div>
        )}
        {show('goals') && (
          <div className="lg:col-span-1">
            <GoalTracker goals={(goalsLoading ? [] : goals || []) as any} />
          </div>
        )}
        {show('marketplace-health') && (
          <div className="lg:col-span-1">
            <MarketplaceHealthMap data={(healthLoading ? [] : marketplaceHealth || []) as any} />
          </div>
        )}
      </div>

      {show('activity') && (
        <DashboardCard title="Son Aktiviteler" icon={Activity} loading={activitiesLoading}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {(activities || []).map((activity: any, i: number) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/60">
                <div className="w-7 h-7 rounded-md bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{activity.action}</p>
                  <p className="text-[11px] text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>
      )}

      <div className="flex justify-end pt-2">
        <Link
          href="/dashboard/widget-editor"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/70 bg-card text-xs font-medium text-muted-foreground hover:text-foreground hover:border-border transition-colors shadow-xs"
        >
          <LayoutGrid size={13} /> Paneli Özelleştir
        </Link>
      </div>
    </div>
  );
};
