"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Download,
    Calendar,
    Filter,
    FileSpreadsheet,
    FileText,
    PieChart,
    LineChart,
    ArrowUpRight,
    ArrowDownRight,
    RefreshCw,
    Mail,
    Clock,
    Target,
    DollarSign,
    Package,
    ShoppingCart,
    Users,
    Percent,
    Eye,
    LucideIcon
} from 'lucide-react';
import { useReports, Report, ScheduledReport as HookScheduledReport } from '@/lib/hooks';

interface FinancialData extends Partial<Report> {
    month: string;
    revenue: number;
    orders: number;
    profit: number;
}

interface ScheduledReport extends HookScheduledReport {
    active: boolean; // Field name difference fix if any
}

interface RecentReport extends Partial<Report> {
    id: string;
    name: string;
    date: string;
    size: string;
    format: string;
}

interface ReportType {
    id: string;
    name: string;
    icon: LucideIcon;
    description: string;
    color: string;
}

// Report type definitions
const reportTypes = [
    { id: 'sales', name: 'Satış Raporu', icon: ShoppingCart, description: 'Satış performansı ve trendler', color: 'emerald' },
    { id: 'revenue', name: 'Gelir Raporu', icon: DollarSign, description: 'Gelir analizi ve kar marjları', color: 'blue' },
    { id: 'products', name: 'Ürün Raporu', icon: Package, description: 'Ürün performansı ve stok analizi', color: 'purple' },
    { id: 'customers', name: 'Müşteri Raporu', icon: Users, description: 'Müşteri segmentasyonu ve davranışları', color: 'orange' },
    { id: 'platforms', name: 'Platform Raporu', icon: BarChart3, description: 'Platform bazlı karşılaştırmalı analiz', color: 'cyan' },
    { id: 'tax', name: 'Vergi Raporu', icon: FileText, description: 'KDV ve vergi hesaplamaları', color: 'red' }
];

export default function ReportsPage() {
    const [selectedPeriod, setSelectedPeriod] = useState('month');
    const [selectedReportType, setSelectedReportType] = useState<string | null>(null);
    const [showExportModal, setShowExportModal] = useState(false);
    const { fetchReports: getReports, fetchScheduled: getScheduled, loading } = useReports();
    const [apiReports, setApiReports] = useState<any[] | null>(null);
    const [apiScheduled, setApiScheduled] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [reportsData, scheduledData] = await Promise.allSettled([
                    getReports(),
                    getScheduled()
                ]);
                if (reportsData.status === 'fulfilled' && reportsData.value) setApiReports(reportsData.value);
                if (scheduledData.status === 'fulfilled' && scheduledData.value) setApiScheduled(scheduledData.value);
            } catch (error) {
                console.error('Raporlar yüklenirken hata:', error);
            }
        };
        fetchData();
    }, []);

    const activeMonthlyData = (Array.isArray(apiReports) ? apiReports : []) as FinancialData[];
    const activeReportTypes = reportTypes;
    const activeScheduledReports = apiScheduled as ScheduledReport[];
    const activeRecentReports = (Array.isArray(apiReports) ? apiReports.slice(0, 4) : []) as RecentReport[];

    const totalRevenue = activeMonthlyData.reduce((sum: number, m: FinancialData) => sum + m.revenue, 0);
    const totalOrders = activeMonthlyData.reduce((sum: number, m: FinancialData) => sum + m.orders, 0);
    const totalProfit = activeMonthlyData.reduce((sum: number, m: FinancialData) => sum + m.profit, 0);
    const avgProfitMargin = ((totalProfit / totalRevenue) * 100).toFixed(1);

    const maxRevenue = Math.max(...activeMonthlyData.map((m: FinancialData) => m.revenue));

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <RefreshCw className="w-8 h-8 text-violet-500 animate-spin" />
                    <p className="text-slate-500">Raporlar yükleniyor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-300 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        <h1 className="text-xl lg:text-2xl font-semibold text-foreground tracking-tight">
                            Finansal Raporlar
                        </h1>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Detaylı finansal analiz ve dışa aktarma raporları
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-card hover:bg-muted border border-border/80 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground transition-colors shadow-xs"
                    >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Dönem Seç</span>
                    </button>
                    <button
                        onClick={() => setShowExportModal(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-medium text-white transition-colors shadow-xs"
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span>Rapor Oluştur</span>
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
                <div className="bg-card rounded-xl p-3.5 sm:p-4 border border-border/70 shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-medium text-muted-foreground">Toplam Gelir (6 Ay)</span>
                        <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <DollarSign className="w-3.5 h-3.5" />
                        </div>
                    </div>
                    <div className="text-lg sm:text-xl font-semibold text-foreground tabular-nums">₺{(totalRevenue / 1000).toFixed(0)}K</div>
                    <div className="flex items-center gap-1 mt-1 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>+18.5% önceki döneme göre</span>
                    </div>
                </div>

                <div className="bg-card rounded-xl p-3.5 sm:p-4 border border-border/70 shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-medium text-muted-foreground">Toplam Sipariş</span>
                        <div className="p-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            <ShoppingCart className="w-3.5 h-3.5" />
                        </div>
                    </div>
                    <div className="text-lg sm:text-xl font-semibold text-foreground tabular-nums">{totalOrders.toLocaleString('tr-TR')}</div>
                    <div className="flex items-center gap-1 mt-1 text-blue-600 dark:text-blue-400 text-[11px] font-medium">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>+12.3% artış</span>
                    </div>
                </div>

                <div className="bg-card rounded-xl p-3.5 sm:p-4 border border-border/70 shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-medium text-muted-foreground">Toplam Kâr</span>
                        <div className="p-1 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
                            <TrendingUp className="w-3.5 h-3.5" />
                        </div>
                    </div>
                    <div className="text-lg sm:text-xl font-semibold text-foreground tabular-nums">₺{(totalProfit / 1000).toFixed(0)}K</div>
                    <div className="flex items-center gap-1 mt-1 text-purple-600 dark:text-purple-400 text-[11px] font-medium">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>+21.7% artış</span>
                    </div>
                </div>

                <div className="bg-card rounded-xl p-3.5 sm:p-4 border border-border/70 shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-medium text-muted-foreground">Kâr Marjı</span>
                        <div className="p-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <Percent className="w-3.5 h-3.5" />
                        </div>
                    </div>
                    <div className="text-lg sm:text-xl font-semibold text-foreground tabular-nums">%{avgProfitMargin}</div>
                    <div className="flex items-center gap-1 mt-1 text-amber-600 dark:text-amber-400 text-[11px] font-medium">
                        <Target className="w-3.5 h-3.5" />
                        <span>Hedef: %40</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Revenue Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lg:col-span-2 bg-surface rounded-2xl p-6 border border-border"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                            <LineChart className="w-5 h-5 text-violet-500" />
                            Aylık Gelir Trendi
                        </h2>
                        <div className="flex items-center gap-2">
                            {['3m', '6m', '1y'].map((period) => (
                                <button
                                    key={period}
                                    onClick={() => setSelectedPeriod(period)}
                                    className={`px-3 py-1 rounded text-sm transition-colors ${selectedPeriod === period
                                        ? 'bg-violet-600 text-white'
                                        : 'text-slate-500 hover:text-foreground'
                                        }`}
                                >
                                    {period}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-4">
                        {activeMonthlyData.map((data: FinancialData, index: number) => (
                            <div key={data.month} className="flex items-center gap-4">
                                <div className="w-16 text-sm text-slate-600 dark:text-slate-400">{data.month}</div>
                                <div className="flex-1 relative">
                                    <div className="h-8 bg-background rounded-xl border border-border overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(data.revenue / maxRevenue) * 100}%` }}
                                            transition={{ delay: index * 0.1, duration: 0.5 }}
                                            className="h-full bg-gradient-to-r from-violet-600 to-violet-400 rounded-lg"
                                        />
                                    </div>
                                </div>
                                <div className="w-24 text-right">
                                    <div className="text-sm font-medium text-foreground">₺{(data.revenue / 1000).toFixed(0)}K</div>
                                    <div className="text-xs text-slate-500">{data.orders} sipariş</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Report Types */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-surface rounded-2xl p-6 border border-border"
                >
                    <h2 className="text-lg font-bold text-foreground mb-4">Hızlı Rapor</h2>
                    <div className="space-y-2">
                        {activeReportTypes.map((report: any) => (
                            <motion.button
                                key={report.id}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => setSelectedReportType(report.id)}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${selectedReportType === report.id
                                    ? 'bg-violet-600/20 border border-violet-500/50'
                                    : 'bg-background rounded-xl border border-border hover:bg-background/80'
                                    }`}
                            >
                                <div className={`p-2 rounded-lg bg-${report.color}-500/20`}>
                                    <report.icon className={`w-4 h-4 text-${report.color}-400`} />
                                </div>
                                <div className="text-left flex-1">
                                    <div className="text-sm font-medium text-foreground">{report.name}</div>
                                    <div className="text-xs text-slate-500">{report.description}</div>
                                </div>
                            </motion.button>
                        ))}
                    </div>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Scheduled Reports */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-surface rounded-2xl border border-border overflow-hidden"
                >
                    <div className="p-4 border-b border-border flex items-center justify-between">
                        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                            <Clock className="w-5 h-5 text-violet-500" />
                            Zamanlanmış Raporlar
                        </h2>
                        <button className="text-sm text-violet-400 hover:text-violet-300">
                            + Yeni Zamanlama
                        </button>
                    </div>
                    <div className="divide-y divide-border">
                        {activeScheduledReports.map((report: ScheduledReport) => (
                            <div key={report.id} className="p-4 hover:bg-background/50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${report.active ? 'bg-green-500' : 'bg-slate-400 dark:bg-slate-600'}`} />
                                        <div>
                                            <h3 className="text-sm font-medium text-white">{report.name}</h3>
                                            <p className="text-xs text-gray-500">
                                                {report.frequency} • Sonraki: {report.nextRun}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                            <Mail className="w-3 h-3" />
                                            {report.recipients}
                                        </span>
                                        <button className={`relative w-10 h-5 rounded-full transition-colors ${report.active ? 'bg-violet-600' : 'bg-slate-300 dark:bg-slate-700'
                                            }`}>
                                            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${report.active ? 'translate-x-5' : 'translate-x-0.5'
                                                }`} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Recent Reports */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-surface rounded-2xl border border-border overflow-hidden"
                >
                    <div className="p-4 border-b border-border">
                        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                            <FileSpreadsheet className="w-5 h-5 text-violet-500" />
                            Son Oluşturulan Raporlar
                        </h2>
                    </div>
                    <div className="divide-y divide-border">
                        {activeRecentReports.map((report: RecentReport) => (
                            <div key={report.id} className="p-4 hover:bg-background/50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${report.format === 'PDF' ? 'bg-red-500/20' : 'bg-green-500/20'
                                            }`}>
                                            <FileText className={`w-4 h-4 ${report.format === 'PDF' ? 'text-red-400' : 'text-green-400'
                                                }`} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-foreground">{report.name}</h3>
                                            <p className="text-xs text-slate-500">
                                                {report.date} • {report.size}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button className="p-1.5 text-slate-500 hover:text-foreground hover:bg-background rounded transition-colors">
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button className="p-1.5 text-slate-500 hover:text-foreground hover:bg-background rounded transition-colors">
                                            <Download className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Export Modal */}
            {showExportModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-surface rounded-2xl p-6 w-full max-w-md border border-border"
                    >
                        <h3 className="text-xl font-bold text-foreground mb-4">Rapor Oluştur</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-slate-600 dark:text-slate-400 block mb-2">Rapor Türü</label>
                                <select className="w-full px-4 py-2 bg-background rounded-xl text-foreground border border-border focus:border-violet-500 focus:outline-none">
                                    {activeReportTypes.map((type: any) => (
                                        <option key={type.id} value={type.id}>{type.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm text-slate-600 dark:text-slate-400 block mb-2">Tarih Aralığı</label>
                                <div className="flex gap-2">
                                    <input
                                        type="date"
                                        className="flex-1 px-4 py-2 bg-background rounded-xl text-foreground border border-border focus:border-violet-500 focus:outline-none"
                                    />
                                    <input
                                        type="date"
                                        className="flex-1 px-4 py-2 bg-background rounded-xl text-foreground border border-border focus:border-violet-500 focus:outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm text-slate-600 dark:text-slate-400 block mb-2">Format</label>
                                <div className="flex gap-2">
                                    <button className="flex-1 py-2 bg-violet-600 text-white rounded-lg">PDF</button>
                                    <button className="flex-1 py-2 bg-background text-slate-500 rounded-lg hover:text-foreground border border-border">Excel</button>
                                    <button className="flex-1 py-2 bg-background text-slate-500 rounded-lg hover:text-foreground border border-border">CSV</button>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 mt-6">
                            <button
                                onClick={() => setShowExportModal(false)}
                                className="flex-1 py-2 bg-background rounded-lg text-slate-600 dark:text-slate-300 hover:text-foreground transition-colors border border-border"
                            >
                                İptal
                            </button>
                            <button className="flex-1 py-2 bg-violet-600 rounded-lg text-white hover:bg-violet-700 transition-colors flex items-center justify-center gap-2">
                                <Download className="w-4 h-4" />
                                Oluştur
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
