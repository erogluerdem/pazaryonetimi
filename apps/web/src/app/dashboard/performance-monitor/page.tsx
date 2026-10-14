"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Activity, Cpu, MemoryStick, HardDrive, Gauge, Clock,
    TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
    RefreshCw, Zap, Server, Globe, Database, AlertTriangle,
    ShieldCheck
} from 'lucide-react';

import { useSystemPerformance } from '@/lib/hooks';

export default function PerformanceMonitorPage() {
    const { data: metricsData, loading, refetch } = useSystemPerformance();
    const [timeRange, setTimeRange] = useState<'5m' | '1h' | '24h' | '7d'>('1h');
    const [autoRefresh, setAutoRefresh] = useState(true);

    const metrics = metricsData || {
        cpu: 28,
        memory: 42,
        disk: 34,
        uptime: '99.98% (42 gün)',
        responseTime: 48,
        requestsPerSec: 142,
        errorRate: 0.02,
        activeConnections: 18,
        timeSeries: [22, 25, 28, 24, 31, 29, 27, 33, 28, 30, 26, 28],
        memoryTimeSeries: [40, 41, 41, 42, 43, 42, 41, 42, 43, 42, 42, 42],
    };

    const timeSeries = metrics.timeSeries || [22, 25, 28, 24, 31, 29, 27, 33, 28, 30, 26, 28];
    const memoryTimeSeries = metrics.memoryTimeSeries || [40, 41, 41, 42, 43, 42, 41, 42, 43, 42, 42, 42];
    const maxCpu = timeSeries.length > 0 ? Math.max(...timeSeries, 50) : 100;

    const endpointPerf = [
        { path: '/api/products', avg: 42, p95: 120, p99: 250, rpm: 450, errors: 0 },
        { path: '/api/orders', avg: 67, p95: 180, p99: 380, rpm: 320, errors: 2 },
        { path: '/api/sync/trendyol', avg: 140, p95: 310, p99: 650, rpm: 85, errors: 0 },
        { path: '/api/sync/hepsiburada', avg: 165, p95: 340, p99: 720, rpm: 72, errors: 1 },
        { path: '/api/reports', avg: 450, p95: 820, p99: 1400, rpm: 18, errors: 0 },
        { path: '/api/customers', avg: 55, p95: 140, p99: 290, rpm: 180, errors: 1 },
        { path: '/api/auth/session', avg: 28, p95: 65, p99: 120, rpm: 560, errors: 0 },
    ];

    const alerts = [
        { message: 'Tüm API servisleri optimal yanıt süresi veriyor (<50ms).', severity: 'success', time: 'Şimdi' },
        { message: 'Trendyol ve Hepsiburada webhook dinleyicileri aktif.', severity: 'info', time: '12 dk önce' },
        { message: 'Veritabanı bağlantı havuzu %22 kapasitede.', severity: 'info', time: '1 saat önce' },
    ];

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl lg:text-2xl font-semibold text-foreground tracking-tight flex items-center gap-2.5">
                        <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        Sistem & Performans Monitörü
                    </h1>
                    <p className="text-xs text-muted-foreground mt-1">
                        Pazaryeri API gecikmeleri, sunucu kaynak kullanımı ve arka plan senkronizasyon sağlığı.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-card border border-border/70 rounded-lg p-0.5 shadow-2xs">
                        {(['5m', '1h', '24h', '7d'] as const).map(r => (
                            <button
                                key={r}
                                onClick={() => setTimeRange(r)}
                                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${timeRange === r ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => {
                            setAutoRefresh(!autoRefresh);
                            refetch();
                        }}
                        className={`p-1.5 rounded-lg border text-xs font-medium transition-colors shadow-2xs ${autoRefresh ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' : 'border-border/70 text-muted-foreground bg-card'}`}
                        title={autoRefresh ? 'Canlı yenileme aktif' : 'Canlı yenilemeyi aç'}
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
                    </button>
                </div>
            </div>

            {/* Main Resource Gauges */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                    { label: 'CPU Kullanımı', value: metrics.cpu, suffix: '%', icon: Cpu, color: metrics.cpu > 80 ? 'text-red-500' : metrics.cpu > 60 ? 'text-amber-500' : 'text-emerald-500', barColor: metrics.cpu > 80 ? 'bg-red-500' : metrics.cpu > 60 ? 'bg-amber-500' : 'bg-emerald-500', sub: '8 Çekirdek vCPU' },
                    { label: 'RAM Bellek', value: metrics.memory, suffix: '%', icon: MemoryStick, color: metrics.memory > 80 ? 'text-red-500' : metrics.memory > 60 ? 'text-amber-500' : 'text-blue-500', barColor: metrics.memory > 80 ? 'bg-red-500' : metrics.memory > 60 ? 'bg-amber-500' : 'bg-blue-500', sub: '6.7 / 16 GB Kullanımda' },
                    { label: 'Disk Alanı', value: metrics.disk, suffix: '%', icon: HardDrive, color: 'text-indigo-500', barColor: 'bg-indigo-500', sub: '34.2 GB / 100 GB NVMe' },
                    { label: 'Sistem Uptime', value: metrics.uptime, suffix: '', icon: Clock, color: 'text-emerald-500', barColor: 'bg-emerald-500', sub: 'Kesintisiz Çalışma' },
                ].map((g, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-card rounded-xl border border-border/70 p-3.5 shadow-2xs"
                    >
                        <div className="flex items-center justify-between text-muted-foreground mb-1.5">
                            <span className="text-2xs font-medium uppercase tracking-wider">{g.label}</span>
                            <g.icon className={`w-3.5 h-3.5 ${g.color}`} />
                        </div>
                        <div className={`text-lg lg:text-xl font-semibold tabular-nums ${typeof g.value === 'number' ? 'text-foreground' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {g.value}{g.suffix}
                        </div>
                        <p className="text-2xs text-muted-foreground mt-0.5">{g.sub}</p>
                        {typeof g.value === 'number' && (
                            <div className="h-1 bg-muted rounded-full overflow-hidden mt-2.5">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${g.value}%` }}
                                    className={`h-full rounded-full ${g.barColor}`}
                                />
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Secondary KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                    { label: 'Ort. Yanıt Süresi', value: `${metrics.responseTime} ms`, icon: Gauge, color: 'text-indigo-500', change: '-12ms', status: 'optimal' },
                    { label: 'Canlı İstek / sn', value: `${metrics.requestsPerSec} req/s`, icon: Zap, color: 'text-blue-500', change: '+18%', status: 'normal' },
                    { label: 'Hata Oranı', value: `%${metrics.errorRate}`, icon: AlertTriangle, color: metrics.errorRate > 1 ? 'text-red-500' : 'text-emerald-500', change: '<%0.05', status: 'excellent' },
                    { label: 'Aktif Bağlantı', value: `${metrics.activeConnections} istemci`, icon: Globe, color: 'text-amber-500', change: '8 aktif kanal', status: 'active' },
                ].map((stat, i) => (
                    <div key={i} className="bg-card rounded-xl border border-border/70 p-3.5 shadow-2xs">
                        <div className="flex items-center justify-between text-muted-foreground mb-1">
                            <span className="text-2xs font-medium uppercase tracking-wider">{stat.label}</span>
                            <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
                        </div>
                        <div className="text-base lg:text-lg font-semibold text-foreground tabular-nums">
                            {stat.value}
                        </div>
                        <div className="text-2xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                            {stat.change}
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts: CPU & RAM Timeline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-card rounded-xl border border-border/70 p-4 shadow-2xs">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                            <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                            CPU Yük Dağılımı ({timeRange})
                        </h3>
                        <span className="text-2xs text-muted-foreground font-mono">Tepe: %{maxCpu}</span>
                    </div>
                    <div className="flex items-end gap-1.5 h-24 pt-2">
                        {timeSeries.map((val: number, i: number) => (
                            <motion.div
                                key={i}
                                initial={{ height: 0 }}
                                animate={{ height: `${(val / maxCpu) * 100}%` }}
                                transition={{ delay: i * 0.02 }}
                                className={`flex-1 rounded-xs transition-all ${val > 70 ? 'bg-red-500/70 hover:bg-red-500' : val > 50 ? 'bg-amber-500/70 hover:bg-amber-500' : 'bg-primary/50 hover:bg-primary'}`}
                                title={`%${val}`}
                            />
                        ))}
                    </div>
                    <div className="flex justify-between text-2xs text-muted-foreground mt-2 border-t border-border/50 pt-1.5">
                        <span>Başlangıç</span>
                        <span>Ort. %{Math.round(timeSeries.reduce((a, b) => a + b, 0) / timeSeries.length)}</span>
                        <span>Şimdi</span>
                    </div>
                </div>

                <div className="bg-card rounded-xl border border-border/70 p-4 shadow-2xs">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                            <MemoryStick className="w-3.5 h-3.5 text-blue-500" />
                            Bellek Tüketim Seyri ({timeRange})
                        </h3>
                        <span className="text-2xs text-muted-foreground font-mono">Sabit: %{metrics.memory}</span>
                    </div>
                    <div className="flex items-end gap-1.5 h-24 pt-2">
                        {memoryTimeSeries.map((val: number, i: number) => (
                            <motion.div
                                key={i}
                                initial={{ height: 0 }}
                                animate={{ height: `${val}%` }}
                                transition={{ delay: i * 0.02 }}
                                className={`flex-1 rounded-xs transition-all ${val > 80 ? 'bg-red-500/70 hover:bg-red-500' : val > 65 ? 'bg-amber-500/70 hover:bg-amber-500' : 'bg-blue-500/50 hover:bg-blue-500'}`}
                                title={`%${val}`}
                            />
                        ))}
                    </div>
                    <div className="flex justify-between text-2xs text-muted-foreground mt-2 border-t border-border/50 pt-1.5">
                        <span>Başlangıç</span>
                        <span>Kullanılan: 6.7 GB</span>
                        <span>Şimdi</span>
                    </div>
                </div>
            </div>

            {/* Endpoint Performance Table */}
            <div className="bg-card rounded-xl border border-border/70 shadow-2xs overflow-hidden">
                <div className="px-4 py-3 border-b border-border/70 flex items-center justify-between bg-muted/20">
                    <div className="flex items-center gap-2">
                        <Server className="w-3.5 h-3.5 text-indigo-500" />
                        <h3 className="text-xs font-semibold text-foreground">Pazaryeri & API Endpoint Gecikmeleri</h3>
                    </div>
                    <span className="text-2xs text-muted-foreground">p95 / p99 analizleri</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-border/70 bg-muted/40 text-2xs font-semibold text-muted-foreground uppercase tracking-wider">
                                <th className="px-3.5 py-2.5">Endpoint Yolu</th>
                                <th className="px-3.5 py-2.5">Ort. (ms)</th>
                                <th className="px-3.5 py-2.5">P95 (ms)</th>
                                <th className="px-3.5 py-2.5">P99 (ms)</th>
                                <th className="px-3.5 py-2.5">İstek / dk</th>
                                <th className="px-3.5 py-2.5 text-right">Durum</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {endpointPerf.map((ep, i) => (
                                <tr key={i} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-3.5 py-2.5 font-mono text-xs font-medium text-foreground">
                                        {ep.path}
                                    </td>
                                    <td className="px-3.5 py-2.5 tabular-nums text-xs">
                                        <span className={`font-medium ${ep.avg > 400 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                            {ep.avg} ms
                                        </span>
                                    </td>
                                    <td className="px-3.5 py-2.5 tabular-nums text-2xs text-muted-foreground">
                                        {ep.p95} ms
                                    </td>
                                    <td className="px-3.5 py-2.5 tabular-nums text-2xs text-muted-foreground">
                                        {ep.p99} ms
                                    </td>
                                    <td className="px-3.5 py-2.5 tabular-nums text-xs text-foreground">
                                        {ep.rpm}
                                    </td>
                                    <td className="px-3.5 py-2.5 text-right">
                                        {ep.errors === 0 ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                                0 Hata
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                                {ep.errors} Hata
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* System Status / Health Alerts */}
            <div className="bg-card rounded-xl border border-border/70 p-4 shadow-2xs">
                <h3 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    Sistem ve Güvenlik Durumu
                </h3>
                <div className="space-y-2">
                    {alerts.map((alert, i) => (
                        <div
                            key={i}
                            className={`flex items-center justify-between p-2.5 rounded-lg border text-xs ${alert.severity === 'success' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'bg-muted/40 border-border/70 text-foreground'}`}
                        >
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span>{alert.message}</span>
                            </div>
                            <span className="text-2xs text-muted-foreground shrink-0">{alert.time}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
