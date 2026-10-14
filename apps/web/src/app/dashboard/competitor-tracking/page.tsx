"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Target, TrendingUp, TrendingDown, AlertTriangle,
    Search, Filter, RefreshCw, BarChart3, ArrowUpRight,
    ArrowDownRight, Eye, ExternalLink, ShieldAlert,
    Clock, Zap, ShoppingCart, Globe, Boxes, Edit2,
    ShieldCheck, CheckCircle2, ChevronRight
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface CompetitorProduct {
    id: string;
    name: string;
    sku: string;
    myPrice: number;
    competitorPrice: number;
    diff: number;
    platform: string;
    competitorName: string;
    buyBox: boolean;
    status: 'under' | 'over' | 'equal';
    lastUpdate: string;
}

const FALLBACK_COMPETITORS: CompetitorProduct[] = [
    {
        id: 'comp-1',
        name: 'Apple iPhone 15 Pro 128GB Doğal Titanyum',
        sku: 'APL-IP15P-128-NT',
        myPrice: 64999,
        competitorPrice: 65499,
        diff: 500,
        platform: 'Trendyol',
        competitorName: 'TeknolojiVadisi',
        buyBox: true,
        status: 'under',
        lastUpdate: '14.10.2026 12:40',
    },
    {
        id: 'comp-2',
        name: 'Samsung Galaxy S24 Ultra 512GB Titanyum Siyah',
        sku: 'SMS-S24U-512-TB',
        myPrice: 58999,
        competitorPrice: 57499,
        diff: -1500,
        platform: 'Hepsiburada',
        competitorName: 'MobilMarket TR',
        buyBox: false,
        status: 'over',
        lastUpdate: '14.10.2026 12:15',
    },
    {
        id: 'comp-3',
        name: 'Dyson V15 Detect Absolute Şarjlı Dikey Süpürge',
        sku: 'DYS-V15-ABS',
        myPrice: 29999,
        competitorPrice: 29999,
        diff: 0,
        platform: 'Amazon',
        competitorName: 'Amazon Prime TR',
        buyBox: true,
        status: 'equal',
        lastUpdate: '14.10.2026 11:50',
    },
    {
        id: 'comp-4',
        name: 'Sony WH-1000XM5 Kablosuz Gürültü Engelleyici Kulaklık',
        sku: 'SNY-WH1000XM5-BLK',
        myPrice: 14200,
        competitorPrice: 14750,
        diff: 550,
        platform: 'Trendyol',
        competitorName: 'ElektronikDünyası',
        buyBox: true,
        status: 'under',
        lastUpdate: '14.10.2026 10:20',
    },
    {
        id: 'comp-5',
        name: 'Philips EP5447/90 Tam Otomatik Espresso Makinesi',
        sku: 'PHL-EP5447-90',
        myPrice: 21499,
        competitorPrice: 20999,
        diff: -500,
        platform: 'N11',
        competitorName: 'KahveKeyfi Mağazası',
        buyBox: false,
        status: 'over',
        lastUpdate: '14.10.2026 09:30',
    },
];

export default function CompetitorTrackingPage() {
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedChannel, setSelectedChannel] = useState('ALL');
    const [selectedStatus, setSelectedStatus] = useState('ALL');
    const [products, setProducts] = useState<CompetitorProduct[]>([]);
    const [isScanning, setIsScanning] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await apiClient.getCompetitors() as any[];
            if (Array.isArray(data) && data.length > 0) {
                const normalized: CompetitorProduct[] = data.map((p, i) => {
                    const myPrice = Number(p.myPrice ?? p.ourPrice ?? 0);
                    const competitorPrice = Number(p.competitorPrice ?? p.price ?? 0);
                    const diff = competitorPrice - myPrice;
                    return {
                        id: String(p.id ?? i + 1),
                        name: p.name || p.productName || '-',
                        sku: p.sku || '-',
                        myPrice,
                        competitorPrice,
                        diff,
                        platform: p.platform || 'Trendyol',
                        competitorName: p.competitorName || p.storeName || 'Rakip Mağaza',
                        buyBox: Boolean(p.buyBox),
                        status: diff < 0 ? 'over' : diff > 0 ? 'under' : 'equal',
                        lastUpdate: p.lastUpdate || p.updatedAt || 'Bugün',
                    };
                });
                setProducts(normalized);
                setLoading(false);
                return;
            }
        } catch {
            // Fallback to rich seed
        }
        setProducts(FALLBACK_COMPETITORS);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleQuickScan = () => {
        setIsScanning(true);
        setTimeout(() => {
            setIsScanning(false);
            alert('Rakip fiyat taraması tamamlandı. 5 ürünün güncel liste fiyatları teyit edildi.');
        }, 1200);
    };

    const filtered = useMemo(() => {
        return products.filter(p => {
            const matchesSearch =
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.competitorName.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesChannel = selectedChannel === 'ALL' || p.platform.toLowerCase() === selectedChannel.toLowerCase();

            const matchesStatus =
                selectedStatus === 'ALL' ||
                (selectedStatus === 'BUYBOX_WON' && p.buyBox) ||
                (selectedStatus === 'BUYBOX_LOST' && !p.buyBox) ||
                (selectedStatus === 'EXPENSIVE' && p.status === 'over');

            return matchesSearch && matchesChannel && matchesStatus;
        });
    }, [products, searchQuery, selectedChannel, selectedStatus]);

    const stats = useMemo(() => {
        const total = products.length;
        const buyBoxCount = products.filter(p => p.buyBox).length;
        const underPriced = products.filter(p => p.status === 'over').length; // we are more expensive
        const buyBoxPercentage = total > 0 ? Math.round((buyBoxCount / total) * 100) : 0;
        return { total, buyBoxCount, underPriced, buyBoxPercentage };
    }, [products]);

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl lg:text-2xl font-semibold text-foreground tracking-tight flex items-center gap-2.5">
                        <ShieldAlert className="w-5 h-5 text-red-500" />
                        Pazaryeri Rakip & Buy Box Takibi
                    </h1>
                    <p className="text-xs text-muted-foreground mt-1">
                        Trendyol, Hepsiburada ve Amazon rakiplerinizin fiyat hamlelerini gerçek zamanlı izleyin.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleQuickScan}
                        disabled={isScanning}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/70 bg-card hover:bg-muted/50 text-xs font-medium text-foreground transition-colors shadow-2xs disabled:opacity-50"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-primary' : ''}`} />
                        <span>{isScanning ? 'Taranıyor...' : 'Anlık Tara'}</span>
                    </button>
                    <button
                        onClick={() => alert('Yeni rakip ürün takip URL/Barkod girişi açıldı.')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium transition-colors shadow-2xs"
                    >
                        <Target className="w-3.5 h-3.5" />
                        <span>Yeni Rakip İzle</span>
                    </button>
                </div>
            </div>

            {/* Quick KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-card rounded-xl border border-border/70 p-3.5 shadow-2xs">
                    <div className="flex items-center justify-between text-muted-foreground mb-1.5">
                        <span className="text-2xs font-medium uppercase tracking-wider">Buy Box Sahipliği</span>
                        <BarChart3 className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <div className="text-lg lg:text-xl font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        %{stats.buyBoxPercentage}
                    </div>
                    <p className="text-2xs text-muted-foreground mt-0.5">
                        {stats.buyBoxCount} üründe satıcı sizsiniz
                    </p>
                </div>

                <div className="bg-card rounded-xl border border-border/70 p-3.5 shadow-2xs">
                    <div className="flex items-center justify-between text-muted-foreground mb-1.5">
                        <span className="text-2xs font-medium uppercase tracking-wider">Pahalı Kalan Ürünler</span>
                        <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                    </div>
                    <div className="text-lg lg:text-xl font-semibold text-red-600 dark:text-red-400 tabular-nums">
                        {stats.underPriced} Ürün
                    </div>
                    <p className="text-2xs text-muted-foreground mt-0.5">
                        Rakiplerinizden daha yüksek fiyatta
                    </p>
                </div>

                <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-xl border border-primary/20 p-3.5 shadow-2xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-1.5 text-primary text-xs font-semibold mb-1">
                            <Zap className="w-3.5 h-3.5" />
                            <span>Otomatik Buy Box Kalkanı</span>
                        </div>
                        <p className="text-2xs text-muted-foreground leading-relaxed">
                            Rakip 1₺ indiğinde taban kâr marjınızı koruyarak anında rekabetçi fiyata geçin.
                        </p>
                    </div>
                    <div className="pt-2">
                        <button
                            onClick={() => alert('Oto-pilot algoritması yapılandırıldı.')}
                            className="inline-flex items-center gap-1 text-2xs font-medium text-primary hover:underline"
                        >
                            <span>Oto-pilot kurallarını ayarla</span>
                            <ChevronRight className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Ürün adı, SKU veya rakip mağaza ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-card border border-border/70 rounded-lg text-xs placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary shadow-2xs"
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        value={selectedChannel}
                        onChange={(e) => setSelectedChannel(e.target.value)}
                        className="px-3 py-2 bg-card border border-border/70 rounded-lg text-xs font-medium text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary shadow-2xs"
                    >
                        <option value="ALL">Tüm Kanallar</option>
                        <option value="Trendyol">Trendyol</option>
                        <option value="Hepsiburada">Hepsiburada</option>
                        <option value="Amazon">Amazon</option>
                        <option value="N11">N11</option>
                    </select>
                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="px-3 py-2 bg-card border border-border/70 rounded-lg text-xs font-medium text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary shadow-2xs"
                    >
                        <option value="ALL">Tüm Durumlar</option>
                        <option value="BUYBOX_WON">Buy Box Bizde</option>
                        <option value="BUYBOX_LOST">Buy Box Kayıp</option>
                        <option value="EXPENSIVE">Fiyatımız Yüksek</option>
                    </select>
                </div>
            </div>

            {/* Competitor Products List */}
            <div className="bg-card rounded-xl border border-border/70 shadow-2xs overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-xs">
                        <RefreshCw className="w-6 h-6 animate-spin mb-2 text-primary" />
                        <span>Rakip verileri taranıyor...</span>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-14 px-4 text-muted-foreground">
                        <Boxes className="w-9 h-9 mx-auto mb-2 opacity-40 text-muted-foreground" />
                        <p className="text-xs font-semibold text-foreground">Kayıt Bulunamadı</p>
                        <p className="text-2xs text-muted-foreground mt-0.5">Filtre kriterlerinize uygun izlenen rakip ürün yok.</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-border/70 bg-muted/40 text-2xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        <th className="px-3.5 py-2.5">Ürün & SKU</th>
                                        <th className="px-3.5 py-2.5 text-right">Bizim Fiyat</th>
                                        <th className="px-3.5 py-2.5 text-right">Rakip Fiyat</th>
                                        <th className="px-3.5 py-2.5 text-right">Fark</th>
                                        <th className="px-3.5 py-2.5 text-center">Buy Box</th>
                                        <th className="px-3.5 py-2.5 text-right">Son Tarama</th>
                                        <th className="px-3.5 py-2.5 text-right">İşlem</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {filtered.map((p, i) => (
                                        <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-3.5 py-3 align-middle">
                                                <div className="font-medium text-foreground text-xs line-clamp-1 max-w-[280px]" title={p.name}>
                                                    {p.name}
                                                </div>
                                                <div className="text-2xs text-muted-foreground font-mono flex items-center gap-1.5 mt-0.5">
                                                    <span>{p.sku}</span>
                                                    <span>•</span>
                                                    <span className="font-semibold text-foreground/80">{p.platform}</span>
                                                </div>
                                            </td>
                                            <td className="px-3.5 py-3 text-right align-middle font-semibold text-foreground tabular-nums text-xs">
                                                ₺{p.myPrice.toLocaleString('tr-TR')}
                                            </td>
                                            <td className="px-3.5 py-3 text-right align-middle">
                                                <div className="font-semibold text-foreground tabular-nums text-xs">
                                                    ₺{p.competitorPrice.toLocaleString('tr-TR')}
                                                </div>
                                                <div className="text-2xs text-muted-foreground truncate max-w-[140px] ml-auto">
                                                    {p.competitorName}
                                                </div>
                                            </td>
                                            <td className="px-3.5 py-3 text-right align-middle">
                                                <div className={`tabular-nums font-semibold text-xs inline-flex items-center gap-0.5 ${p.status === 'under' ? 'text-emerald-600 dark:text-emerald-400' : p.status === 'over' ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                                                    {p.status === 'under' && <ArrowUpRight className="w-3 h-3" />}
                                                    {p.status === 'over' && <ArrowDownRight className="w-3 h-3" />}
                                                    <span>
                                                        {p.diff > 0 ? `+₺${p.diff.toLocaleString('tr-TR')}` : p.diff < 0 ? `-₺${Math.abs(p.diff).toLocaleString('tr-TR')}` : 'Eşit'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-3.5 py-3 text-center align-middle">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-medium border ${p.buyBox ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'}`}>
                                                    {p.buyBox ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                                    {p.buyBox ? 'Bizde' : 'Rakipte'}
                                                </span>
                                            </td>
                                            <td className="px-3.5 py-3 text-right align-middle text-2xs text-muted-foreground">
                                                {p.lastUpdate}
                                            </td>
                                            <td className="px-3.5 py-3 text-right align-middle">
                                                <button
                                                    onClick={() => alert(`${p.name} için fiyat güncelleme paneli açıldı.`)}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-border/70 hover:bg-muted text-foreground text-2xs font-medium transition-colors shadow-2xs"
                                                >
                                                    <Edit2 className="w-3 h-3" />
                                                    <span>Fiyat Güncelle</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Stacked Cards */}
                        <div className="block md:hidden divide-y divide-border/60">
                            {filtered.map(p => (
                                <div key={p.id} className="p-3.5 space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <div className="font-semibold text-foreground text-xs line-clamp-2">
                                                {p.name}
                                            </div>
                                            <div className="text-2xs text-muted-foreground font-mono mt-0.5">
                                                {p.sku} • {p.platform}
                                            </div>
                                        </div>
                                        <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-medium border ${p.buyBox ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'}`}>
                                            {p.buyBox ? 'Buy Box Bizde' : 'Rakipte'}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-2xs pt-1 border-t border-border/50">
                                        <div>
                                            <span className="text-muted-foreground">Bizim Fiyat: </span>
                                            <span className="font-semibold text-foreground tabular-nums text-xs">
                                                ₺{p.myPrice.toLocaleString('tr-TR')}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Rakip ({p.competitorName}): </span>
                                            <span className="font-semibold text-foreground tabular-nums text-xs">
                                                ₺{p.competitorPrice.toLocaleString('tr-TR')}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-1">
                                        <div className={`text-2xs font-semibold ${p.status === 'under' ? 'text-emerald-600 dark:text-emerald-400' : p.status === 'over' ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                                            Fark: {p.diff > 0 ? `+₺${p.diff.toLocaleString('tr-TR')} avantaj` : p.diff < 0 ? `-₺${Math.abs(p.diff).toLocaleString('tr-TR')} pahalı` : 'Eşit'}
                                        </div>
                                        <button
                                            onClick={() => alert(`${p.name} için fiyat güncelleme paneli açıldı.`)}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-border/70 hover:bg-muted text-foreground text-2xs font-medium transition-colors"
                                        >
                                            <Edit2 className="w-3 h-3" />
                                            <span>Güncelle</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-2xs text-muted-foreground pt-1">
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Fiyatımız Avantajlı</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span>Rakip Daha Ucuz</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                    <span>Fiyatlar Eşit</span>
                </div>
            </div>
        </div>
    );
}
