"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    ShoppingBag,
    Package,
    MousePointer,
    Zap,
    Loader2
} from 'lucide-react';
import {
    useDashboardStats,
    usePlatformPerformance,
    useTopProducts,
    usePerformanceTrend,
    useSalesForecast,
    useCategoryPerformance,
    TrendData
} from '@/lib/hooks';

// Time periods
const periods = [
    { id: '7d', label: 'Son 7 Gün' },
    { id: '30d', label: 'Son 30 Gün' },
    { id: '90d', label: 'Son 90 Gün' },
    { id: '1y', label: 'Son 1 Yıl' }
];

const MetricCard = ({
    title,
    value,
    change,
    icon,
    format = 'number',
    loading = false
}: {
    title: string;
    value: number;
    change: number;
    icon: React.ReactNode;
    format?: 'number' | 'currency' | 'percent';
    loading?: boolean;
}) => {
    const formatValue = (val: number) => {
        if (loading) return '-';
        switch (format) {
            case 'currency':
                return `₺${(val / 1000).toFixed(0)}K`;
            case 'percent':
                return `%${val.toFixed(1)}`;
            default:
                return val.toLocaleString('tr-TR');
        }
    };

    return (
        <div
            className="bg-card p-3.5 sm:p-4 rounded-xl border border-border/70 shadow-xs"
        >
            {loading ? (
                <div className="animate-pulse">
                    <div className="h-7 w-7 bg-muted rounded-lg mb-2"></div>
                    <div className="h-5 w-16 bg-muted rounded mb-1.5"></div>
                    <div className="h-3 w-20 bg-muted rounded"></div>
                </div>
            ) : (
                <>
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-1 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                            {icon}
                        </div>
                        <div className={`flex items-center gap-1 text-[11px] font-medium ${change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                        </div>
                    </div>
                    <div className="text-lg sm:text-xl font-semibold text-foreground tabular-nums">{formatValue(value)}</div>
                    <div className="text-[11px] font-medium text-muted-foreground mt-0.5">{title}</div>
                </>
            )}
        </div>
    );
};

export default function AnalyticsPage() {
    const [selectedPeriod, setSelectedPeriod] = useState('30d');
    const [selectedMetric, setSelectedMetric] = useState('revenue');

    // Real data hooks
    const { data: stats, loading: statsLoading, refetch: refetchStats } = useDashboardStats(selectedPeriod);
    usePlatformPerformance();
    const { data: topProducts, loading: productsLoading } = useTopProducts(5);
    const { data: trendData, loading: trendLoading } = usePerformanceTrend(selectedMetric, selectedPeriod);
    useSalesForecast(30);
    const { data: categories, loading: categoriesLoading } = useCategoryPerformance();

    // Re-fetch when period changes
    useEffect(() => {
        refetchStats();
    }, [selectedPeriod, refetchStats]);

    const maxTrendValue = trendData ? Math.max(...trendData.map((d: TrendData) => d.value || 0), 1) : 0;

    return (
        <div className="space-y-6 animate-in fade-in duration-300 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl lg:text-2xl font-semibold text-foreground tracking-tight">Performans Analizi</h1>
                    <p className="text-xs text-muted-foreground mt-1">Detaylı satış ve trafik analizlerinizi inceleyin</p>
                </div>
                <div className="flex items-center gap-1 bg-card p-1 rounded-lg border border-border/80 shadow-xs self-start sm:self-auto">
                    {periods.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => setSelectedPeriod(p.id)}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${selectedPeriod === p.id
                                ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                <MetricCard
                    title="Toplam Gelir"
                    value={stats?.totalRevenue || 0}
                    change={stats?.periodComparison.revenueChange || 0}
                    icon={<DollarSign size={20} className="text-primary" />}
                    format="currency"
                    loading={statsLoading}
                />
                <MetricCard
                    title="Toplam Sipariş"
                    value={stats?.totalOrders || 0}
                    change={stats?.periodComparison.ordersChange || 0}
                    icon={<ShoppingBag size={20} className="text-primary" />}
                    loading={statsLoading}
                />
                <MetricCard
                    title="Dönüşüm Oranı"
                    value={stats?.conversionRate || 0}
                    change={stats?.periodComparison.conversionChange || 0}
                    icon={<MousePointer size={20} className="text-primary" />}
                    format="percent"
                    loading={statsLoading}
                />
                <MetricCard
                    title="Aktif Ürünler"
                    value={stats?.activeProducts || 0}
                    change={stats?.periodComparison.productsChange || 0}
                    icon={<Package size={20} className="text-primary" />}
                    loading={statsLoading}
                />
            </div>

            {/* Sales Trend Chart (Simplified CSS-based) */}
            <div className="bg-surface rounded-2xl border border-border p-6">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="font-bold text-foreground">Satış Trendi</h3>
                        <p className="text-xs text-slate-500">Seçili periyodun satış performansı</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSelectedMetric('revenue')}
                            className={`p-2 rounded-lg border transition-all ${selectedMetric === 'revenue' ? 'bg-primary/10 border-primary text-primary' : 'border-border text-slate-400 opacity-50'}`}
                        >
                            <DollarSign size={16} />
                        </button>
                        <button
                            onClick={() => setSelectedMetric('orders')}
                            className={`p-2 rounded-lg border transition-all ${selectedMetric === 'orders' ? 'bg-primary/10 border-primary text-primary' : 'border-border text-slate-400 opacity-50'}`}
                        >
                            <ShoppingBag size={16} />
                        </button>
                    </div>
                </div>

                <div className="h-64 flex items-end gap-1 relative">
                    {trendLoading ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-primary opacity-20" />
                        </div>
                    ) : trendData && trendData.filter((d: any) => !!d).map((d: TrendData, i: number) => (
                        <div key={i} className="flex-1 group relative">
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${(d.value / (maxTrendValue || 1)) * 100}%` }}
                                className="w-full bg-primary/20 hover:bg-primary rounded-t-sm transition-all"
                            />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 font-bold">
                                {selectedMetric === 'revenue' ? `₺${d.value.toLocaleString()}` : d.value}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-between mt-4 border-t border-border pt-4 px-2">
                    {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(d => (
                        <span key={d} className="text-[10px] font-bold text-slate-400 uppercase">{d}</span>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Top Products */}
                <div className="lg:col-span-2 bg-surface rounded-2xl border border-border p-6">
                    <h3 className="font-bold text-foreground mb-4">En Çok Satan Ürünler</h3>
                    {productsLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-16 bg-slate-100 dark:bg-white/5 animate-pulse rounded-xl" />
                            ))}
                        </div>
                    ) : topProducts && topProducts.length > 0 ? (
                        <div className="space-y-4">
                            {topProducts.map((product, idx) => (
                                <motion.div
                                    key={product.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="flex items-center justify-between p-4 bg-background rounded-2xl border border-border hover:border-primary/50 transition-colors group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black">
                                            #{idx + 1}
                                        </div>
                                        <div>
                                            <div className="font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                                                {product.name}
                                            </div>
                                            <div className="text-xs text-slate-500 font-medium">
                                                {product.sales} satış • ₺{product.revenue.toLocaleString()} gelir
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-xs font-black p-1 px-2 rounded-lg ${idx < 2 ? 'bg-green-500/10 text-green-500' : 'bg-slate-500/10 text-slate-500'}`}>
                                            %{Math.floor(((idx * 7) % 20) + 5)}%
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-500 font-medium">
                            Henüz ürün verisi yok
                        </div>
                    )}
                </div>

                {/* Category Performance */}
                <div className="bg-surface rounded-2xl border border-border p-6 flex flex-col">
                    <h3 className="font-bold text-foreground mb-4">Kategori Dağılımı</h3>
                    {categoriesLoading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-primary opacity-20" />
                        </div>
                    ) : categories && categories.length > 0 ? (
                        <div className="space-y-4 flex-1">
                            {categories.map((cat, idx) => (
                                <div key={cat.name} className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold">
                                        <span className="text-slate-500 uppercase tracking-widest">{cat.name}</span>
                                        <span className="text-foreground">%{cat.share.toFixed(0)}</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${cat.share}%` }}
                                            transition={{ delay: idx * 0.1, duration: 1 }}
                                            className={`h-full rounded-full ${idx % 3 === 0 ? 'bg-blue-500' : idx % 3 === 1 ? 'bg-purple-500' : 'bg-emerald-500'}`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
                            Veri bulunamadı
                        </div>
                    )}

                    <div className="mt-8 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                        <div className="flex items-center gap-3 mb-2">
                            <Zap size={16} className="text-primary fill-primary" />
                            <span className="text-xs font-black text-primary uppercase tracking-widest">AI İçgörü</span>
                        </div>
                        <p className="text-[10px] leading-relaxed text-slate-600 dark:text-slate-400 font-medium">
                            {categories?.[0]?.name || 'Teknoloji'} kategorisindeki ürünleriniz son 7 günde ortalamanın %12 üzerinde performans gösteriyor.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
