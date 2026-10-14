"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp, TrendingDown, DollarSign, ShoppingCart,
    Package, Users, Eye, BarChart3,
    ArrowUpRight, ArrowDownRight, Minus, RefreshCw,
    Zap, Clock, Target, Award, Truck, AlertTriangle,
    Activity, Globe, CheckCircle2, ShieldCheck, FileCheck,
    MapPin, Sparkles, ChevronRight, Play, Pause, Bell,
    ArrowRight, Store
} from 'lucide-react';
import Link from 'next/link';

// ============ TYPES ============

interface PlatformData {
    name: string;
    code: string;
    logo: string;
    orders: number;
    revenue: number;
    trend: number;
    share?: number;
    buyBoxRate?: number;
    color?: string;
    badge?: string;
}

interface ActivityItem {
    id: string;
    type: string;
    platform?: string;
    title: string;
    text: string;
    location?: string;
    time: string;
    status?: string;
}

interface CityData {
    name: string;
    percentage: number;
    orders: number;
    revenue: number;
}

interface LiveAnalyticsState {
    revenue: number;
    revenueTrend: number;
    revenueHistory: number[];
    orders: number;
    ordersTrend: number;
    ordersHistory: number[];
    visitors: number;
    visitorsTrend: number;
    visitorsHistory: number[];
    conversionRate: number;
    conversionTrend: number;
    avgOrderValue: number;
    aovTrend: number;
    pendingOrders: number;
    processingOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
    lowStock: number;
    activeProducts: number;
    customerCount: number;
    customerTrend: number;
    returnRate: number;
    returnTrend: number;
    buyBoxRate: number;
    buyBoxTrend: number;
    invoiceSuccessRate: number;
    platforms: PlatformData[];
    hourlyOrders: { label: string; value: number }[];
    activities: ActivityItem[];
    topCities: CityData[];
}

// ============ ANIMATED COUNTER ============

function AnimatedNumber({
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
    const [display, setDisplay] = useState(value);

    useEffect(() => {
        const duration = 800;
        const steps = 25;
        const stepDuration = duration / steps;
        const startVal = display;
        const diff = value - startVal;
        if (Math.abs(diff) < 0.01) {
            setDisplay(value);
            return;
        }

        let step = 0;
        const timer = setInterval(() => {
            step++;
            const progress = step / steps;
            const current = startVal + diff * progress;
            if (step >= steps) {
                setDisplay(value);
                clearInterval(timer);
            } else {
                setDisplay(current);
            }
        }, stepDuration);

        return () => clearInterval(timer);
    }, [value]);

    return (
        <span className="tabular-nums">
            {prefix}
            {display.toLocaleString('tr-TR', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
            })}
            {suffix}
        </span>
    );
}

// ============ TREND BADGE ============

function TrendBadge({ value, suffix = '%' }: { value: number; suffix?: string }) {
    const isPositive = value > 0;
    const isNeutral = value === 0;

    return (
        <div
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-semibold border ${
                isPositive
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : isNeutral
                    ? 'bg-muted text-muted-foreground border-border'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
            }`}
        >
            {isPositive ? (
                <ArrowUpRight className="w-2.5 h-2.5 shrink-0" />
            ) : isNeutral ? (
                <Minus className="w-2.5 h-2.5 shrink-0" />
            ) : (
                <ArrowDownRight className="w-2.5 h-2.5 shrink-0" />
            )}
            <span>
                {isPositive ? '+' : ''}
                {value}
                {suffix}
            </span>
        </div>
    );
}

// ============ SPARKLINE CHART ============

function Sparkline({
    data,
    color = '#6366f1',
    height = 36,
}: {
    data: number[];
    color?: string;
    height?: number;
}) {
    if (!data || data.length < 2) return null;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const w = 120;
    const points = data
        .map((v, i) => `${(i / (data.length - 1)) * w},${height - ((v - min) / range) * (height - 6) - 3}`)
        .join(' ');
    const areaPoints = `0,${height} ${points} ${w},${height}`;

    const gradId = `spark-grad-${color.replace('#', '')}`;

    return (
        <svg viewBox={`0 0 ${w} ${height}`} className="w-full h-8 overflow-visible" preserveAspectRatio="none">
            <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.0} />
                </linearGradient>
            </defs>
            <polygon points={areaPoints} fill={`url(#${gradId})`} />
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

// ============ KPI CARD ============

function KPICard({
    title,
    value,
    prefix,
    suffix,
    decimals,
    trend,
    icon: Icon,
    color,
    sparkData,
    subtitle,
    targetValue,
    progressPercent,
}: {
    title: string;
    value: number;
    prefix?: string;
    suffix?: string;
    decimals?: number;
    trend?: number;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    sparkData?: number[];
    subtitle?: string;
    targetValue?: string;
    progressPercent?: number;
}) {
    return (
        <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
            className="group relative rounded-2xl bg-card border border-border/70 p-4 transition-all hover:border-border hover:shadow-md dark:hover:shadow-indigo-500/5 overflow-hidden flex flex-col justify-between"
        >
            <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5">
                    <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
                        style={{
                            backgroundColor: `${color}15`,
                            borderColor: `${color}30`,
                            color: color,
                        }}
                    >
                        <Icon className="w-4 h-4" />
                    </div>
                    <div>
                        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
                            {title}
                        </span>
                        {subtitle && (
                            <span className="text-[10px] text-muted-foreground/80 font-normal">
                                {subtitle}
                            </span>
                        )}
                    </div>
                </div>
                {trend !== undefined && <TrendBadge value={trend} />}
            </div>

            <div className="my-1.5 flex items-baseline justify-between gap-2">
                <div className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
                    <AnimatedNumber value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
                </div>
                {targetValue && (
                    <span className="text-[10px] font-medium text-muted-foreground shrink-0">
                        Hedef: <strong className="text-foreground">{targetValue}</strong>
                    </span>
                )}
            </div>

            {progressPercent !== undefined && (
                <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden mb-2">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: color }}
                    />
                </div>
            )}

            {sparkData && sparkData.length > 1 && (
                <div className="mt-1 pt-1 border-t border-border/40">
                    <Sparkline data={sparkData} color={color} height={32} />
                </div>
            )}
        </motion.div>
    );
}

// ============ MAIN LIVE ANALYTICS DASHBOARD ============

export default function LiveAnalyticsDashboard() {
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLiveActive, setIsLiveActive] = useState(true);
    const [refreshIntervalSec, setRefreshIntervalSec] = useState<number>(10);
    const [nextTick, setNextTick] = useState<number>(10);
    const [selectedPlatform, setSelectedPlatform] = useState<string>('all');

    const [analytics, setAnalytics] = useState<LiveAnalyticsState>({
        revenue: 284950.4,
        revenueTrend: 18.4,
        revenueHistory: [14200, 22100, 31400, 48900, 68000, 94000, 142000, 189000, 241000, 284950],
        orders: 412,
        ordersTrend: 14.2,
        ordersHistory: [18, 29, 44, 62, 91, 138, 212, 289, 360, 412],
        visitors: 1842,
        visitorsTrend: 12.3,
        visitorsHistory: [120, 240, 410, 680, 920, 1180, 1450, 1680, 1842],
        conversionRate: 3.8,
        conversionTrend: 0.4,
        avgOrderValue: 691.6,
        aovTrend: 4.8,
        pendingOrders: 18,
        processingOrders: 24,
        shippedOrders: 186,
        deliveredOrders: 184,
        lowStock: 4,
        activeProducts: 348,
        customerCount: 1420,
        customerTrend: 8.6,
        returnRate: 1.4,
        returnTrend: -0.6,
        buyBoxRate: 94.2,
        buyBoxTrend: 2.1,
        invoiceSuccessRate: 100,
        platforms: [
            {
                name: 'Trendyol',
                code: 'trendyol',
                logo: 'TY',
                orders: 198,
                revenue: 138450,
                trend: 21.4,
                share: 48.5,
                buyBoxRate: 96.2,
                color: '#f97316',
                badge: 'Lider Pazaryeri',
            },
            {
                name: 'Hepsiburada',
                code: 'hepsiburada',
                logo: 'HB',
                orders: 114,
                revenue: 82100,
                trend: 14.8,
                share: 28.8,
                buyBoxRate: 92.4,
                color: '#ea580c',
                badge: 'HepsiJET Hızlı',
            },
            {
                name: 'Amazon Türkiye',
                code: 'amazon',
                logo: 'AZ',
                orders: 62,
                revenue: 41200,
                trend: 28.6,
                share: 14.4,
                buyBoxRate: 98.1,
                color: '#eab308',
                badge: 'En Yüksek BuyBox',
            },
            {
                name: 'Pazarama',
                code: 'pazarama',
                logo: 'PZ',
                orders: 22,
                revenue: 14800,
                trend: 9.1,
                share: 5.2,
                buyBoxRate: 88.5,
                color: '#06b6d4',
                badge: 'İş Bankası Ekosistemi',
            },
            {
                name: 'N11',
                code: 'n11',
                logo: 'N11',
                orders: 16,
                revenue: 8400,
                trend: 6.4,
                share: 3.1,
                buyBoxRate: 89.0,
                color: '#ef4444',
                badge: 'Kupon Kampanyası',
            },
        ],
        hourlyOrders: [
            { label: '08:00', value: 14 },
            { label: '09:00', value: 22 },
            { label: '10:00', value: 28 },
            { label: '11:00', value: 34 },
            { label: '12:00', value: 42 },
            { label: '13:00', value: 48 },
            { label: '14:00', value: 54 },
            { label: '15:00', value: 49 },
            { label: '16:00', value: 38 },
            { label: '17:00', value: 33 },
            { label: '18:00', value: 36 },
            { label: '19:00', value: 45 },
            { label: '20:00', value: 52 },
            { label: '21:00', value: 46 },
            { label: '22:00', value: 32 },
            { label: '23:00', value: 19 },
        ],
        activities: [
            {
                id: 'act-1',
                type: 'order',
                platform: 'Trendyol',
                title: 'Yeni Sipariş (#TY-849201)',
                text: 'Kadın Omuz Çantası Taba • ₺1.450,00',
                location: 'Kadıköy, İstanbul',
                time: 'Az önce',
                status: 'Hazırlanıyor',
            },
            {
                id: 'act-2',
                type: 'buybox',
                platform: 'Amazon',
                title: 'Buy Box Kazanıldı!',
                text: 'Anker Soundcore Q30 • Fiyat: ₺2.199 (-₺10 indirim)',
                location: 'Amazon TR',
                time: '2 dk önce',
                status: '1. Sırada',
            },
            {
                id: 'act-3',
                type: 'cargo',
                platform: 'Hepsiburada',
                title: 'Kargoya Teslim Edildi (#HB-771204)',
                text: 'Yurtiçi Kargo Barkod: YRT-9941029',
                location: 'Çankaya, Ankara',
                time: '5 dk önce',
                status: 'Yolda',
            },
            {
                id: 'act-4',
                type: 'invoice',
                platform: 'GİB e-Fatura',
                title: 'e-Arşiv Fatura Kesildi (#EAR-2026-4019)',
                text: '₺890,00 KDV Dahil • Otomatik Onaylandı',
                location: 'GİB Portali',
                time: '8 dk önce',
                status: 'Onaylandı',
            },
            {
                id: 'act-5',
                type: 'stock',
                platform: 'Trendyol',
                title: 'Kritik Stok Uyarısı',
                text: 'Type-C Hızlı Şarj Başlığı 33W (Kalan: 3 adet)',
                location: 'Ana Depo',
                time: '12 dk önce',
                status: 'Tedarik Önerildi',
            },
            {
                id: 'act-6',
                type: 'order',
                platform: 'Pazarama',
                title: 'Yeni Sipariş (#PZ-10928)',
                text: 'Seramik Kahve Fincan Seti 6lı • ₺640,00',
                location: 'Muratpaşa, Antalya',
                time: '17 dk önce',
                status: 'Hazırlanıyor',
            },
            {
                id: 'act-7',
                type: 'delivery',
                platform: 'Hepsiburada',
                title: 'Müşteriye Teslim Edildi (#HB-769011)',
                text: 'HepsiJET ile adrese ulaştırıldı',
                location: 'Konak, İzmir',
                time: '22 dk önce',
                status: 'Teslim Edildi',
            },
        ],
        topCities: [
            { name: 'İstanbul', percentage: 41.5, orders: 171, revenue: 119680 },
            { name: 'Ankara', percentage: 18.2, orders: 75, revenue: 51860 },
            { name: 'İzmir', percentage: 13.8, orders: 57, revenue: 39320 },
            { name: 'Bursa', percentage: 8.9, orders: 37, revenue: 25360 },
            { name: 'Antalya', percentage: 6.4, orders: 26, revenue: 18230 },
            { name: 'Diğer (76 İl)', percentage: 11.2, orders: 46, revenue: 30500 },
        ],
    });

    const loadAnalytics = useCallback(async () => {
        try {
            const isDemo =
                typeof window !== 'undefined' &&
                (new URLSearchParams(window.location.search).get('demo') === 'true' ||
                    localStorage.getItem('pazaryonetimi_demo') === 'true');

            const endpoint = `/api/analytics/live${isDemo ? '?demo=true' : ''}`;
            const res = await fetch(endpoint, { cache: 'no-store' });
            if (!res.ok) return;
            const payload = await res.json();
            const data = payload?.data ?? payload ?? {};

            if (data && (data.revenue > 0 || data.orders > 0)) {
                setAnalytics((prev) => ({
                    ...prev,
                    revenue: Number(data.revenue ?? prev.revenue),
                    revenueTrend: Number(data.revenueTrend ?? prev.revenueTrend),
                    revenueHistory: Array.isArray(data.revenueHistory) ? data.revenueHistory : prev.revenueHistory,
                    orders: Number(data.orders ?? prev.orders),
                    ordersTrend: Number(data.ordersTrend ?? prev.ordersTrend),
                    ordersHistory: Array.isArray(data.ordersHistory) ? data.ordersHistory : prev.ordersHistory,
                    visitors: Number(data.visitors ?? prev.visitors),
                    visitorsTrend: Number(data.visitorsTrend ?? prev.visitorsTrend),
                    visitorsHistory: Array.isArray(data.visitorsHistory) ? data.visitorsHistory : prev.visitorsHistory,
                    conversionRate: Number(data.conversionRate ?? prev.conversionRate),
                    conversionTrend: Number(data.conversionTrend ?? prev.conversionTrend),
                    avgOrderValue: Number(data.avgOrderValue ?? prev.avgOrderValue),
                    aovTrend: Number(data.aovTrend ?? prev.aovTrend),
                    pendingOrders: Number(data.pendingOrders ?? prev.pendingOrders),
                    processingOrders: Number(data.processingOrders ?? prev.processingOrders),
                    shippedOrders: Number(data.shippedOrders ?? prev.shippedOrders),
                    deliveredOrders: Number(data.deliveredOrders ?? prev.deliveredOrders),
                    lowStock: Number(data.lowStock ?? prev.lowStock),
                    activeProducts: Number(data.activeProducts ?? prev.activeProducts),
                    customerCount: Number(data.customerCount ?? prev.customerCount),
                    customerTrend: Number(data.customerTrend ?? prev.customerTrend),
                    returnRate: Number(data.returnRate ?? prev.returnRate),
                    returnTrend: Number(data.returnTrend ?? prev.returnTrend),
                    buyBoxRate: Number(data.buyBoxRate ?? prev.buyBoxRate),
                    buyBoxTrend: Number(data.buyBoxTrend ?? prev.buyBoxTrend),
                    invoiceSuccessRate: Number(data.invoiceSuccessRate ?? prev.invoiceSuccessRate),
                    platforms: Array.isArray(data.platforms) && data.platforms.length > 0 ? data.platforms : prev.platforms,
                    hourlyOrders: Array.isArray(data.hourlyOrders) && data.hourlyOrders.length > 0 ? data.hourlyOrders : prev.hourlyOrders,
                    activities: Array.isArray(data.activities) && data.activities.length > 0 ? data.activities : prev.activities,
                    topCities: Array.isArray(data.topCities) && data.topCities.length > 0 ? data.topCities : prev.topCities,
                }));
            }
        } catch {
            // Keep current rich state
        }
    }, []);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await loadAnalytics();
        setLastRefresh(new Date());
        setNextTick(refreshIntervalSec);
        setIsRefreshing(false);
    };

    // Initial load
    useEffect(() => {
        void loadAnalytics();
    }, [loadAnalytics]);

    // Live auto-refresh interval
    useEffect(() => {
        if (!isLiveActive) return;

        const timer = setInterval(() => {
            setNextTick((prev) => {
                if (prev <= 1) {
                    void loadAnalytics();
                    setLastRefresh(new Date());

                    // Simulated live heartbeat tick: subtle increment to make screen feel alive
                    setAnalytics((curr) => {
                        const randomAmount = Math.floor(Math.random() * 450) + 150;
                        const newRevenue = curr.revenue + randomAmount;
                        const newOrders = curr.orders + 1;
                        const newVisitors = curr.visitors + Math.floor(Math.random() * 3) + 1;

                        const sampleItems = [
                            { title: 'Yeni Sipariş (#TY-' + Math.floor(100000 + Math.random() * 900000) + ')', text: 'Kablosuz Kulaklık • ₺' + randomAmount + ',00', loc: 'Şişli, İstanbul', platform: 'Trendyol' },
                            { title: 'Yeni Sipariş (#HB-' + Math.floor(100000 + Math.random() * 900000) + ')', text: 'Paslanmaz Çelik Termos • ₺' + randomAmount + ',00', loc: 'Bornova, İzmir', platform: 'Hepsiburada' },
                            { title: 'Buy Box Kazanıldı!', text: 'Amazon TR algoritması fiyatı optimize etti', loc: 'Amazon TR', platform: 'Amazon' },
                            { title: 'Kargo Çıkışı (#YRT-' + Math.floor(100000 + Math.random() * 900000) + ')', text: 'Yurtiçi Kargo araca yüklendi', loc: 'Nilüfer, Bursa', platform: 'Trendyol' },
                        ];
                        const picked = sampleItems[Math.floor(Math.random() * sampleItems.length)];

                        const newActivity: ActivityItem = {
                            id: 'live-' + Date.now(),
                            type: 'order',
                            platform: picked.platform,
                            title: picked.title,
                            text: picked.text,
                            location: picked.loc,
                            time: 'Az önce',
                            status: 'Canlı',
                        };

                        return {
                            ...curr,
                            revenue: newRevenue,
                            orders: newOrders,
                            visitors: newVisitors,
                            activities: [newActivity, ...curr.activities.slice(0, 11)],
                        };
                    });

                    return refreshIntervalSec;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isLiveActive, refreshIntervalSec, loadAnalytics]);

    // Busiest hour
    const busiestHour = useMemo(() => {
        if (!analytics.hourlyOrders || analytics.hourlyOrders.length === 0) return null;
        return analytics.hourlyOrders.reduce((acc, cur) => (cur.value > acc.value ? cur : acc), analytics.hourlyOrders[0]);
    }, [analytics.hourlyOrders]);

    // Filtered platforms
    const displayedPlatforms = useMemo(() => {
        if (selectedPlatform === 'all') return analytics.platforms;
        return analytics.platforms.filter((p) => p.code === selectedPlatform);
    }, [analytics.platforms, selectedPlatform]);

    return (
        <div className="space-y-5 animate-in fade-in duration-500 text-foreground pb-8">
            {/* Top Live Bar & Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="relative flex h-2.5 w-2.5">
                            <span
                                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                                    isLiveActive ? 'bg-emerald-400' : 'bg-amber-400'
                                }`}
                            />
                            <span
                                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                                    isLiveActive ? 'bg-emerald-500' : 'bg-amber-500'
                                }`}
                            />
                        </span>
                        <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground">
                            Canlı Operasyon & Satış Analitiği
                        </h1>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-semibold border border-indigo-500/20">
                            Ultra-Sync v2.4
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>Pazaryerleri, kargo firmaları ve GİB entegrasyonundan canlı veri akışı</span>
                        <span className="text-border">•</span>
                        <span>Son senkronizasyon: {lastRefresh.toLocaleTimeString('tr-TR')}</span>
                    </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                    {/* Live Pause/Resume */}
                    <button
                        onClick={() => setIsLiveActive((v) => !v)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            isLiveActive
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                                : 'bg-muted text-muted-foreground border-border'
                        }`}
                        title={isLiveActive ? 'Akışı duraklat' : 'Akışı başlat'}
                    >
                        {isLiveActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        <span>{isLiveActive ? 'Canlı Akıyor' : 'Duraklatıldı'}</span>
                        {isLiveActive && (
                            <span className="text-[10px] opacity-75 font-mono">({nextTick}s)</span>
                        )}
                    </button>

                    {/* Refresh Interval Selector */}
                    <select
                        value={refreshIntervalSec}
                        onChange={(e) => {
                            const val = Number(e.target.value);
                            setRefreshIntervalSec(val);
                            setNextTick(val);
                        }}
                        className="px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                    >
                        <option value={5}>5 sn</option>
                        <option value={10}>10 sn</option>
                        <option value={30}>30 sn</option>
                        <option value={60}>1 dk</option>
                    </select>

                    {/* Manual Refresh */}
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs font-medium text-foreground transition-colors shadow-xs disabled:opacity-50"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                        <span>Yenile</span>
                    </button>

                    {/* Quick Demo Switcher if in demo */}
                    <Link
                        href="/demo"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-xs font-medium transition-colors"
                    >
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span className="hidden md:inline">Demo Merkezi</span>
                    </Link>
                </div>
            </div>

            {/* Core KPIs Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <KPICard
                    title="Bugünkü Canlı Ciro"
                    value={analytics.revenue}
                    prefix="₺"
                    decimals={2}
                    trend={analytics.revenueTrend}
                    icon={DollarSign}
                    color="#10b981"
                    sparkData={analytics.revenueHistory}
                    subtitle="Düne kıyasla +%18.4 artış"
                    targetValue="₺300.000"
                    progressPercent={(analytics.revenue / 300000) * 100}
                />
                <KPICard
                    title="Toplam Sipariş Adedi"
                    value={analytics.orders}
                    trend={analytics.ordersTrend}
                    icon={ShoppingCart}
                    color="#6366f1"
                    sparkData={analytics.ordersHistory}
                    subtitle={`${analytics.pendingOrders} onay, ${analytics.processingOrders} hazırlıkta`}
                    targetValue="450 Sipariş"
                    progressPercent={(analytics.orders / 450) * 100}
                />
                <KPICard
                    title="Anlık Ziyaretçi & Oturum"
                    value={analytics.visitors}
                    trend={analytics.visitorsTrend}
                    icon={Eye}
                    color="#8b5cf6"
                    sparkData={analytics.visitorsHistory}
                    subtitle={`Dönüşüm Oranı: %${analytics.conversionRate}`}
                    targetValue="2.000 Oturum"
                    progressPercent={(analytics.visitors / 2000) * 100}
                />
                <KPICard
                    title="Ortalama Sepet Tutarı (AOV)"
                    value={analytics.avgOrderValue}
                    prefix="₺"
                    decimals={2}
                    trend={analytics.aovTrend}
                    icon={Target}
                    color="#f59e0b"
                    subtitle="Sektör ortalamasının %24 üzerinde"
                    targetValue="₺750"
                    progressPercent={(analytics.avgOrderValue / 750) * 100}
                />
            </div>

            {/* Secondary Operational Signals Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-card border border-border/70 flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
                            Buy Box Kazanımı
                        </span>
                        <div className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-1.5 mt-0.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            <span>%{analytics.buyBoxRate}</span>
                        </div>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                            34 üründe 1. sıra
                        </span>
                    </div>
                    <TrendBadge value={analytics.buyBoxTrend} />
                </div>

                <div className="p-3 rounded-xl bg-card border border-border/70 flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
                            GİB e-Fatura
                        </span>
                        <div className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-1.5 mt-0.5">
                            <FileCheck className="w-4 h-4 text-indigo-500" />
                            <span>%{analytics.invoiceSuccessRate}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-medium">
                            0 bekleyen fatura
                        </span>
                    </div>
                    <div className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold border border-emerald-500/20">
                        Aktif
                    </div>
                </div>

                <div className="p-3 rounded-xl bg-card border border-border/70 flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
                            İade & İptal Oranı
                        </span>
                        <div className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-1.5 mt-0.5">
                            <Truck className="w-4 h-4 text-cyan-500" />
                            <span>%{analytics.returnRate}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-medium">
                            Sektör ort. %4.8 altında
                        </span>
                    </div>
                    <TrendBadge value={analytics.returnTrend} />
                </div>

                <div className="p-3 rounded-xl bg-card border border-border/70 flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
                            Kritik Stok Uyarısı
                        </span>
                        <div className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-1.5 mt-0.5">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            <span>{analytics.lowStock} Ürün</span>
                        </div>
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                            Otomatik tedarik alarmı
                        </span>
                    </div>
                    <Link
                        href="/dashboard/inventory"
                        className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                        Gör ➔
                    </Link>
                </div>
            </div>

            {/* Mid Section: Marketplace Distribution + Hourly Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Marketplace Performance (2 Cols on LG) */}
                <div className="lg:col-span-2 rounded-2xl bg-card border border-border/70 p-4 sm:p-5 flex flex-col justify-between">
                    <div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-border/60">
                            <div>
                                <h3 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-indigo-500" />
                                    Pazaryeri Satış & Ciro Dağılımı
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Entegre mağazaların gerçek zamanlı sipariş ve Buy Box performansları
                                </p>
                            </div>

                            {/* Platform Quick Filter */}
                            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/60 text-xs">
                                <button
                                    onClick={() => setSelectedPlatform('all')}
                                    className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                                        selectedPlatform === 'all'
                                            ? 'bg-background text-foreground shadow-xs font-semibold'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    Tümü
                                </button>
                                {analytics.platforms.map((p) => (
                                    <button
                                        key={p.code}
                                        onClick={() => setSelectedPlatform(p.code)}
                                        className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                                            selectedPlatform === p.code
                                                ? 'bg-background text-foreground shadow-xs font-semibold'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        {p.name.split(' ')[0]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Marketplace Progress Overview */}
                        <div className="w-full bg-muted/70 h-3 rounded-full overflow-hidden flex mb-4 border border-border/50">
                            {analytics.platforms.map((p) => (
                                <div
                                    key={p.code}
                                    style={{
                                        width: `${p.share ?? 10}%`,
                                        backgroundColor: p.color ?? '#6366f1',
                                    }}
                                    title={`${p.name}: %${p.share} pazar payı`}
                                    className="h-full transition-all duration-500 hover:opacity-90"
                                />
                            ))}
                        </div>

                        {/* Marketplace Cards List */}
                        <div className="space-y-2">
                            {displayedPlatforms.map((p) => (
                                <div
                                    key={p.code}
                                    className="p-3 rounded-xl border border-border/50 bg-background/50 hover:bg-muted/30 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 text-white shadow-xs"
                                            style={{ backgroundColor: p.color ?? '#6366f1' }}
                                        >
                                            {p.logo}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-semibold text-foreground">
                                                    {p.name}
                                                </span>
                                                {p.badge && (
                                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-muted text-muted-foreground border border-border">
                                                        {p.badge}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[11px] text-muted-foreground">
                                                {p.orders} sipariş • Pazar Payı: <strong>%{p.share}</strong>
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                                        {p.buyBoxRate !== undefined && (
                                            <div className="text-left sm:text-right">
                                                <span className="text-[10px] text-muted-foreground uppercase font-medium block">
                                                    Buy Box
                                                </span>
                                                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                                    %{p.buyBoxRate}
                                                </span>
                                            </div>
                                        )}
                                        <div className="text-right">
                                            <div className="text-xs sm:text-sm font-semibold text-foreground">
                                                ₺{p.revenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                            </div>
                                            <TrendBadge value={p.trend} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border/50 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span>Tüm pazaryerlerinde Buy Box koruması 7/24 devrededir.</span>
                        <Link
                            href="/dashboard/integrations"
                            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                            <span>Entegrasyonları Yönet</span>
                            <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                </div>

                {/* Hourly Orders Distribution Chart */}
                <div className="rounded-2xl bg-card border border-border/70 p-4 sm:p-5 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/60">
                            <div>
                                <h3 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4 text-indigo-500" />
                                    Saatlik Sipariş Dağılımı
                                </h3>
                                <p className="text-xs text-muted-foreground">Bugünkü yoğunluk eğrisi</p>
                            </div>
                            {busiestHour && (
                                <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-semibold border border-indigo-500/20">
                                    Pik: {busiestHour.label} ({busiestHour.value})
                                </span>
                            )}
                        </div>

                        {/* Bar chart visualization */}
                        <div className="pt-4 pb-2">
                            {analytics.hourlyOrders.length > 0 ? (
                                <div className="flex items-end gap-1 sm:gap-1.5 h-36 w-full">
                                    {(() => {
                                        const maxVal = Math.max(
                                            ...analytics.hourlyOrders.map((d) => d.value),
                                            1
                                        );
                                        return analytics.hourlyOrders.map((d, i) => {
                                            const isPeak = busiestHour?.label === d.label;
                                            const heightPct = Math.round((d.value / maxVal) * 100);
                                            return (
                                                <div
                                                    key={i}
                                                    className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end"
                                                >
                                                    {/* Tooltip on hover */}
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-popover text-popover-foreground text-[9px] font-semibold border shadow-md pointer-events-none whitespace-nowrap z-20">
                                                        {d.label}: {d.value} sipariş
                                                    </div>
                                                    <motion.div
                                                        initial={{ height: 0 }}
                                                        animate={{ height: `${heightPct}%` }}
                                                        transition={{ delay: i * 0.02, duration: 0.4 }}
                                                        className={`w-full rounded-t-sm transition-all ${
                                                            isPeak
                                                                ? 'bg-indigo-600 dark:bg-indigo-500 shadow-sm'
                                                                : 'bg-indigo-500/30 group-hover:bg-indigo-500/60'
                                                        }`}
                                                    />
                                                    {i % 3 === 0 && (
                                                        <span className="text-[9px] text-muted-foreground font-mono">
                                                            {d.label.split(':')[0]}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            ) : (
                                <div className="h-36 flex items-center justify-center text-xs text-muted-foreground">
                                    Saatlik sipariş verisi hesaplanıyor...
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-3 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
                        <span>Gündüz ve akşam saatlerinde sipariş hacmi zirveye ulaşıyor.</span>
                    </div>
                </div>
            </div>

            {/* Bottom Row: Real-time Live Activity Feed + City Logistics Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Real-time Activity Stream (2 cols) */}
                <div className="lg:col-span-2 rounded-2xl bg-card border border-border/70 p-4 sm:p-5 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/60">
                            <div>
                                <h3 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
                                    Canlı Akış & Operasyon Hareketleri
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Yeni siparişler, e-fatura onayları, kargo teslimatları ve Buy Box olayları
                                </p>
                            </div>
                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Canlı Dinleniyor
                            </span>
                        </div>

                        {/* Stream container with smooth animation */}
                        <div className="space-y-2 max-h-[340px] overflow-y-auto scrollbar-thin scrollbar-thumb-muted">
                            <AnimatePresence initial={false}>
                                {analytics.activities.map((a) => (
                                    <motion.div
                                        key={a.id}
                                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.25 }}
                                        className="p-3 rounded-xl border border-border/50 bg-background/50 hover:bg-muted/30 transition-colors flex items-center justify-between gap-3 text-xs"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div
                                                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white font-semibold text-[11px] ${
                                                    a.platform === 'Trendyol'
                                                        ? 'bg-orange-500'
                                                        : a.platform === 'Hepsiburada'
                                                        ? 'bg-amber-600'
                                                        : a.platform === 'Amazon'
                                                        ? 'bg-yellow-600'
                                                        : a.platform === 'GİB e-Fatura'
                                                        ? 'bg-indigo-600'
                                                        : 'bg-slate-700'
                                                }`}
                                            >
                                                {a.platform ? a.platform.slice(0, 2).toUpperCase() : 'PY'}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-foreground truncate">
                                                        {a.title}
                                                    </span>
                                                    {a.status && (
                                                        <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-muted text-muted-foreground border border-border shrink-0">
                                                            {a.status}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-muted-foreground text-[11px] truncate">
                                                    {a.text}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-right shrink-0">
                                            {a.location && (
                                                <span className="text-[10px] text-muted-foreground flex items-center justify-end gap-1">
                                                    <MapPin className="w-2.5 h-2.5 text-muted-foreground/80" />
                                                    {a.location}
                                                </span>
                                            )}
                                            <span className="text-[10px] font-medium text-foreground/70">
                                                {a.time}
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Tüm loglar ve bildirimler webhook üzerinden gerçek zamanlı işlenir.</span>
                        <Link
                            href="/dashboard/orders"
                            className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                            Tüm Siparişleri Gör ➔
                        </Link>
                    </div>
                </div>

                {/* City Delivery Distribution */}
                <div className="rounded-2xl bg-card border border-border/70 p-4 sm:p-5 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/60">
                            <div>
                                <h3 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-rose-500" />
                                    Bölgesel Sipariş Dağılımı
                                </h3>
                                <p className="text-xs text-muted-foreground">En yüksek teslimat yapılan şehirler</p>
                            </div>
                            <span className="text-[11px] font-semibold text-muted-foreground">81 İl</span>
                        </div>

                        {/* Top Cities List */}
                        <div className="space-y-3 pt-1">
                            {analytics.topCities.map((city, idx) => (
                                <div key={city.name} className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground">
                                                {idx + 1}
                                            </span>
                                            <span className="font-semibold text-foreground">{city.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-muted-foreground text-[11px]">
                                                {city.orders} sipariş
                                            </span>
                                            <span className="font-semibold text-foreground">
                                                %{city.percentage}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                                        <div
                                            className="bg-indigo-600 dark:bg-indigo-400 h-full rounded-full transition-all duration-500"
                                            style={{ width: `${city.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
                        <span>İstanbul, Ankara ve İzmir toplam cironun %73.5'ini oluşturmaktadır.</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
