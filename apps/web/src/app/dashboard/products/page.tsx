"use client";

import React, { useState, useMemo } from 'react';
import {
    Plus, Search, Filter, MoreVertical, Image as ImageIcon, Sparkles,
    ArrowUpDown, ExternalLink, CheckCircle2, AlertCircle, Download,
    Eye, Edit3, Trash2, Copy, TrendingUp, TrendingDown,
    Package, BarChart3, RefreshCw, ChevronLeft, ChevronRight, X, Loader2,
    Star, Layers
} from 'lucide-react';
import Image from 'next/image';
import { useProducts, useProductStats, Product } from '@/lib/hooks';
import { useQuickActions } from '@/providers/quick-actions-provider';
import { apiClient } from '@/lib/api-client';




const STATUS_LABELS: Record<string, { label: string; className: string }> = {
    'active': { label: 'Aktif', className: 'bg-green-500/10 text-green-600 dark:text-green-400' },
    'inactive': { label: 'Pasif', className: 'bg-slate-500/10 text-slate-600 dark:text-slate-400' },
    'draft': { label: 'Taslak', className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' },
    'out-of-stock': { label: 'Stok Yok', className: 'bg-red-500/10 text-red-600 dark:text-red-400' },
};

const PLATFORM_COLORS: Record<string, string> = {
    'TRENDYOL': 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    'AMAZON': 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
    'HEPSIBURADA': 'bg-red-500/10 text-red-600 dark:text-red-400',
    'N11': 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    'CICEKSEPETI': 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
};

export default function ProductList() {
    const [currentPage, setCurrentPage] = useState(1);
    const { data: statsData, loading: statsLoading } = useProductStats();
    const { data: productsData, loading: productsLoading, refetch: fetchProducts } = useProducts(currentPage, 20);
    const { openAddProduct } = useQuickActions();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [platformFilter, setPlatformFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [sortBy, setSortBy] = useState('name');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
    const [actionMenu, setActionMenu] = useState<string | null>(null);
    const [optimizing, setOptimizing] = useState<string | null>(null);
    const [bulkOptimizing, setBulkOptimizing] = useState(false);

    const products = useMemo(() => {
        const rawItems = (productsData as any)?.data || [];
        return rawItems.map((p: any): Product => ({
            ...p,
            name: p.title || p.name,
            images: Array.isArray(p.images) && typeof p.images[0] === 'object' 
                ? p.images.map((img: any) => img.url) 
                : p.images || [],
            platform: Array.isArray(p.marketplaceLinks) 
                ? [...new Set(p.marketplaceLinks.map((l: any) => l.platform))] 
                : p.platform || [],
            sales: p.sales || 0,
            revenue: Number(p.revenue || 0),
            rating: p.rating || 0,
            reviewCount: p.reviewCount || 0
        }));
    }, [productsData]);

    const loading = statsLoading || productsLoading;
    const pagination = (productsData as any) || { page: 1, limit: 20, total: 0, totalPages: 1 };
    const categories = useMemo(() => Array.from(new Set(products.map((p: Product) => p.category))) as string[], [products]);
    const platforms = useMemo(() => Array.from(new Set(products.flatMap((p: Product) => p.platform))) as string[], [products]);

    const filteredProducts = useMemo(() => {
        let filtered = products.filter((p: Product) => {
            const nameMatch = !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase());
            const skuMatch = !searchTerm || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
            const matchSearch = nameMatch || skuMatch;
            const matchStatus = statusFilter === 'all' || p.status === statusFilter;
            const matchPlatform = platformFilter === 'all' || p.platform.includes(platformFilter);
            const matchCategory = categoryFilter === 'all' || p.category === categoryFilter;
            return matchSearch && matchStatus && matchPlatform && matchCategory;
        });
        filtered.sort((a: Product, b: Product) => {
            let cmp = 0;
            switch (sortBy) { 
                case 'name': cmp = a.name.localeCompare(b.name); break; 
                case 'price': cmp = a.price - b.price; break; 
                case 'stock': cmp = a.stock - b.stock; break; 
                case 'sales': cmp = a.sales - b.sales; break; 
                case 'revenue': cmp = a.revenue - b.revenue; break; 
                case 'rating': cmp = a.rating - b.rating; break; 
                case 'seoScore': cmp = (a.seoScore || 0) - (b.seoScore || 0); break; 
            }
            return sortDir === 'asc' ? cmp : -cmp;
        });
        return filtered;
    }, [products, searchTerm, statusFilter, platformFilter, categoryFilter, sortBy, sortDir]);

    const PAGE_SIZE = 10;
    const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE);
    const paginatedProducts = filteredProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const stats = useMemo(() => {
        const s = statsData as any;
        return {
            total: s?.total || 0,
            active: s?.active || 0,
            outOfStock: s?.outOfStock || 0,
            totalRevenue: s?.totalRevenue || 0,
            avgRating: s?.avgRating || 0,
            lowStock: s?.lowStock || 0,
        };
    }, [statsData]);

    const toggleSelect = (id: string) => setSelectedProducts(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    const toggleSelectAll = () => setSelectedProducts(prev => prev.length === products.length ? [] : products.map((p: Product) => p.id));
    const handleOptimize = async (productId: string) => { 
        setOptimizing(productId); 
        try { 
            const tenantId = (productsData as any)?.tenantId || '';
            await apiClient.optimizeProduct(tenantId, productId); 
        } catch { } finally { setOptimizing(null); } 
    };
    const handleBulkOptimize = async () => { 
        setBulkOptimizing(true); 
        try { 
            await apiClient.bulkAnalyze(); 
        } catch { } finally { setBulkOptimizing(false); } 
    };
    const handleSort = (field: string) => { if (sortBy === field) setSortDir(prev => prev === 'asc' ? 'desc' : 'asc'); else { setSortBy(field); setSortDir('asc'); } };
    const formatCurrency = (n: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n);

    return (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300 pb-16">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
                {[
                    { label: 'Toplam Ürün', value: stats.total, icon: Package, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: 'Aktif', value: stats.active, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { label: 'Stok Yok', value: stats.outOfStock, icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-500/10' },
                    { label: 'Düşük Stok', value: stats.lowStock, icon: TrendingDown, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                    { label: 'Toplam Ciro', value: formatCurrency(stats.totalRevenue), icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { label: 'Ort. Puan', value: stats.avgRating.toFixed(1), icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
                ].map((stat, i) => (
                    <div key={i} className="bg-card rounded-xl border border-border/70 p-3 sm:p-3.5 hover:border-border transition-all shadow-2xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center shrink-0`}>
                                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-[11px] font-medium text-muted-foreground truncate">{stat.label}</div>
                                <div className="text-sm sm:text-base font-semibold text-foreground tracking-tight tabular-nums truncate">{stat.value}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Header & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-lg sm:text-xl font-semibold text-foreground tracking-tight">Ürün Yönetimi</h1>
                    <p className="text-xs text-muted-foreground font-normal">{filteredProducts.length} ürün listeleniyor</p>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                    <button
                        onClick={() => fetchProducts()}
                        title="Yenile"
                        className="p-2 bg-card hover:bg-muted border border-border/70 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={handleBulkOptimize}
                        disabled={bulkOptimizing}
                        className="flex items-center gap-1.5 px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/20 rounded-lg text-xs font-medium text-indigo-600 dark:text-indigo-400 transition-colors shrink-0 whitespace-nowrap disabled:opacity-50"
                    >
                        {bulkOptimizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        AI Toplu Optimizasyon
                    </button>
                    <button
                        className="flex items-center gap-1.5 px-3 py-2 bg-card hover:bg-muted border border-border/70 rounded-lg text-xs font-medium text-foreground transition-colors shrink-0 whitespace-nowrap"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Dışa Aktar
                    </button>
                    <button
                        onClick={openAddProduct}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs sm:text-sm font-medium text-white shadow-xs transition-colors shrink-0 whitespace-nowrap"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Yeni Ürün
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-card p-3 rounded-xl border border-border/70 space-y-3 shadow-2xs">
                <div className="flex flex-col sm:flex-row gap-2.5 items-center">
                    <div className="relative flex-1 w-full group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="Ürün adı, SKU veya barkod ile ara..."
                            className="w-full bg-background border border-border/70 rounded-lg py-1.5 pl-9 pr-8 text-xs sm:text-sm text-foreground focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-muted-foreground"
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                showFilters ? 'bg-indigo-600 text-white' : 'bg-card border border-border/70 text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <Filter className="w-3.5 h-3.5" />
                            Filtrele
                        </button>
                        <div className="flex bg-muted/50 border border-border/70 rounded-lg p-0.5">
                            <button
                                onClick={() => setViewMode('table')}
                                className={`px-2 py-1 rounded-md text-xs transition-colors ${viewMode === 'table' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground'}`}
                                title="Tablo Görünümü"
                            >
                                <Layers className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`px-2 py-1 rounded-md text-xs transition-colors ${viewMode === 'grid' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground'}`}
                                title="Kart Görünümü"
                            >
                                <BarChart3 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </div>
                {showFilters && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-2 border-t border-border/60">
                        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="bg-background border border-border/70 rounded-lg py-1.5 px-2.5 text-xs text-foreground focus:outline-none focus:border-indigo-500/50"><option value="all">Tüm Durumlar</option><option value="active">Aktif</option><option value="inactive">Pasif</option><option value="draft">Taslak</option><option value="out-of-stock">Stok Yok</option></select>
                        <select value={platformFilter} onChange={e => { setPlatformFilter(e.target.value); setCurrentPage(1); }} className="bg-background border border-border/70 rounded-lg py-1.5 px-2.5 text-xs text-foreground focus:outline-none focus:border-indigo-500/50"><option value="all">Tüm Platformlar</option>{platforms.map((p: string) => <option key={p} value={p}>{p}</option>)}</select>
                        <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1); }} className="bg-background border border-border/70 rounded-lg py-1.5 px-2.5 text-xs text-foreground focus:outline-none focus:border-indigo-500/50"><option value="all">Tüm Kategoriler</option>{categories.map((c: string) => <option key={c} value={c}>{c}</option>)}</select>
                        <select value={sortBy} onChange={e => handleSort(e.target.value)} className="bg-background border border-border/70 rounded-lg py-1.5 px-2.5 text-xs text-foreground focus:outline-none focus:border-indigo-500/50"><option value="name">Ada Göre</option><option value="price">Fiyata Göre</option><option value="stock">Stoğa Göre</option><option value="sales">Satışa Göre</option><option value="revenue">Ciroya Göre</option><option value="rating">Puana Göre</option><option value="seoScore">SEO Skoruna Göre</option></select>
                    </div>
                )}
            </div>

            {/* Bulk Actions */}
            {selectedProducts.length > 0 && (
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{selectedProducts.length} ürün seçildi</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                        <button className="px-3 py-1.5 bg-card rounded-lg text-xs font-medium text-foreground hover:bg-muted transition-all border border-border/60">Toplu Fiyat Güncelle</button>
                        <button className="px-3 py-1.5 bg-card rounded-lg text-xs font-medium text-foreground hover:bg-muted transition-all border border-border/60">Toplu Stok Güncelle</button>
                        <button className="px-3 py-1.5 bg-rose-500/10 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-500/20 transition-all">Seçilenleri Sil</button>
                        <button onClick={() => setSelectedProducts([])} className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">Temizle</button>
                    </div>
                </div>
            )}

            {loading && (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                    <p className="text-xs text-muted-foreground ml-2.5">Ürünler yükleniyor...</p>
                </div>
            )}

            {/* Table View */}
            {!loading && viewMode === 'table' && (
                <div className="space-y-3">
                    {/* Mobile Product Cards (md:hidden) */}
                    <div className="md:hidden space-y-2.5">
                        <div className="flex items-center justify-between px-3 py-2 bg-card rounded-lg border border-border/60 text-xs">
                            <label className="flex items-center gap-2 cursor-pointer font-medium text-muted-foreground">
                                <input
                                    type="checkbox"
                                    checked={selectedProducts.length === paginatedProducts.length && paginatedProducts.length > 0}
                                    onChange={toggleSelectAll}
                                    className="rounded border-border text-indigo-600 focus:ring-indigo-500"
                                />
                                <span>Tümünü Seç ({paginatedProducts.length})</span>
                            </label>
                            <span className="text-[11px] text-muted-foreground">{pagination.total} ürün</span>
                        </div>
                        {products.map((product: Product) => (
                            <div key={product.id} className="bg-card rounded-xl border border-border/70 p-3 shadow-2xs space-y-2.5">
                                <div className="flex items-start gap-2.5">
                                    <input
                                        type="checkbox"
                                        checked={selectedProducts.includes(product.id)}
                                        onChange={() => toggleSelect(product.id)}
                                        className="mt-1 rounded border-border text-indigo-600"
                                    />
                                    <div className="w-12 h-12 rounded-lg bg-muted/60 border border-border/40 shrink-0 relative overflow-hidden flex items-center justify-center">
                                        {product.images.length > 0 ? (
                                            <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                                        ) : (
                                            <ImageIcon size={18} className="text-muted-foreground" />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-xs font-semibold text-foreground line-clamp-1">{product.name}</div>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="text-[10px] font-mono text-muted-foreground">{product.sku}</span>
                                            {product.category && <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground truncate">{product.category}</span>}
                                        </div>
                                    </div>
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${STATUS_LABELS[product.status]?.className}`}>
                                        {STATUS_LABELS[product.status]?.label}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50 text-center">
                                    <div>
                                        <span className="text-[10px] text-muted-foreground block">Fiyat</span>
                                        <span className="text-xs font-semibold text-foreground tabular-nums">{formatCurrency(product.price)}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-muted-foreground block">Stok</span>
                                        <span className={`text-xs font-semibold tabular-nums ${product.stock === 0 ? 'text-rose-500' : product.stock < 20 ? 'text-amber-500' : 'text-foreground'}`}>{product.stock}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-muted-foreground block">Satış</span>
                                        <span className="text-xs font-semibold text-foreground tabular-nums">{product.sales}</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                                    <div className="flex flex-wrap gap-1">
                                        {product.platform.map((mp: string) => (
                                            <span key={mp} className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${PLATFORM_COLORS[mp] || 'bg-muted text-muted-foreground'}`}>{mp}</span>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleOptimize(product.id)}
                                            className="px-2 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-md text-[11px] font-medium flex items-center gap-1"
                                        >
                                            {optimizing === product.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} AI
                                        </button>
                                        <button onClick={() => setActionMenu(actionMenu === product.id ? null : product.id)} className="p-1 rounded-md text-muted-foreground hover:text-foreground">
                                            <MoreVertical size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop Table (hidden md:block) */}
                    <div className="hidden md:block bg-card rounded-xl border border-border/70 overflow-hidden shadow-2xs">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-muted/40 border-b border-border/70">
                                        <th className="px-4 py-3 w-10"><input type="checkbox" checked={selectedProducts.length === paginatedProducts.length && paginatedProducts.length > 0} onChange={toggleSelectAll} className="rounded border-border text-indigo-600" /></th>
                                        <th onClick={() => handleSort('name')} className="px-4 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider min-w-[260px] cursor-pointer hover:text-foreground">Ürün {sortBy === 'name' && (sortDir === 'asc' ? '↑' : '↓')}</th>
                                        <th className="px-4 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Platform</th>
                                        <th onClick={() => handleSort('seoScore')} className="px-4 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider text-center cursor-pointer hover:text-foreground">AI Skor</th>
                                        <th onClick={() => handleSort('price')} className="px-4 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground">Fiyat</th>
                                        <th onClick={() => handleSort('stock')} className="px-4 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground">Stok</th>
                                        <th onClick={() => handleSort('sales')} className="px-4 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground">Satış</th>
                                        <th onClick={() => handleSort('rating')} className="px-4 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground">Puan</th>
                                        <th className="px-4 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Durum</th>
                                        <th className="px-4 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider text-right">İşlem</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {products.map((product: Product) => (
                                        <tr key={product.id} className="hover:bg-muted/30 transition-colors group">
                                            <td className="px-4 py-3"><input type="checkbox" checked={selectedProducts.includes(product.id)} onChange={() => toggleSelect(product.id)} className="rounded border-border text-indigo-600" /></td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-muted/60 border border-border/40 flex items-center justify-center text-muted-foreground group-hover:border-indigo-500/30 transition-all shrink-0 relative overflow-hidden">
                                                        {product.images.length > 0 ? (
                                                            <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                                                        ) : (
                                                            <ImageIcon size={18} />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-xs sm:text-sm font-semibold text-foreground truncate">{product.name}</div>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[10px] font-mono text-muted-foreground uppercase">{product.sku}</span>
                                                            {product.category && <span className="text-[10px] px-1.5 py-0.2 bg-muted rounded text-muted-foreground">{product.category}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3"><div className="flex flex-wrap gap-1">{product.platform.map((mp: string) => <span key={mp} className={`text-[9px] font-medium px-2 py-0.5 rounded ${PLATFORM_COLORS[mp] || 'bg-muted text-muted-foreground'}`}>{mp}</span>)}</div></td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className={`text-xs font-semibold tabular-nums ${(product.seoScore || 0) > 85 ? 'text-emerald-500' : (product.seoScore || 0) > 65 ? 'text-indigo-600 dark:text-indigo-400' : 'text-amber-500'}`}>{product.seoScore || '-'}</span>
                                                    <div className="w-10 h-1 bg-muted rounded-full overflow-hidden"><div className={`h-full rounded-full ${(product.seoScore || 0) > 85 ? 'bg-emerald-500' : (product.seoScore || 0) > 65 ? 'bg-indigo-600' : 'bg-amber-500'}`} style={{ width: `${product.seoScore || 0}%` }} /></div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3"><div className="text-xs sm:text-sm font-semibold text-foreground tabular-nums">{formatCurrency(product.price)}</div>{product.costPrice && <div className="text-[10px] text-muted-foreground mt-0.5">Maliyet: {formatCurrency(product.costPrice)}</div>}</td>
                                            <td className="px-4 py-3"><span className={`text-xs sm:text-sm font-semibold tabular-nums ${product.stock === 0 ? 'text-rose-500' : product.stock < 20 ? 'text-amber-500' : 'text-foreground'}`}>{product.stock}</span></td>
                                            <td className="px-4 py-3"><div className="text-xs sm:text-sm font-semibold text-foreground tabular-nums">{product.sales.toLocaleString('tr-TR')}</div><div className="text-[10px] text-muted-foreground">{formatCurrency(product.revenue)}</div></td>
                                            <td className="px-4 py-3"><div className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /><span className="text-xs sm:text-sm font-semibold tabular-nums">{product.rating}</span><span className="text-[10px] text-muted-foreground">({product.reviewCount})</span></div></td>
                                            <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_LABELS[product.status]?.className}`}>{product.status === 'active' ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}{STATUS_LABELS[product.status]?.label}</span></td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="relative">
                                                    <button onClick={() => setActionMenu(actionMenu === product.id ? null : product.id)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all"><MoreVertical size={15} /></button>
                                                    {actionMenu === product.id && (
                                                        <div className="absolute right-0 top-full mt-1 w-44 bg-card rounded-xl shadow-lg border border-border py-1.5 z-50">
                                                            <button className="w-full px-3 py-1.5 text-left text-xs text-foreground hover:bg-muted flex items-center gap-2"><Eye className="w-3.5 h-3.5" /> Görüntüle</button>
                                                            <button className="w-full px-3 py-1.5 text-left text-xs text-foreground hover:bg-muted flex items-center gap-2"><Edit3 className="w-3.5 h-3.5" /> Düzenle</button>
                                                            <button onClick={() => { handleOptimize(product.id); setActionMenu(null); }} className="w-full px-3 py-1.5 text-left text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 flex items-center gap-2">{optimizing === product.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} AI Optimize</button>
                                                            <button className="w-full px-3 py-1.5 text-left text-xs text-foreground hover:bg-muted flex items-center gap-2"><Copy className="w-3.5 h-3.5" /> Kopyala</button>
                                                            <button className="w-full px-3 py-1.5 text-left text-xs text-foreground hover:bg-muted flex items-center gap-2"><ExternalLink className="w-3.5 h-3.5" /> Platformda Gör</button>
                                                            <hr className="my-1 border-border" />
                                                            <button className="w-full px-3 py-1.5 text-left text-xs text-rose-600 hover:bg-rose-500/10 flex items-center gap-2"><Trash2 className="w-3.5 h-3.5" /> Sil</button>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-3 py-3 bg-card rounded-xl border border-border/70">
                            <span className="text-xs text-muted-foreground">{pagination.total} üründen {(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} gösteriliyor</span>
                            <div className="flex items-center gap-1.5">
                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                                {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => i + 1).map((p: number) => (
                                    <button key={p} onClick={() => setCurrentPage(p)} className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${p === currentPage ? 'bg-indigo-600 text-white' : 'hover:bg-muted text-muted-foreground'}`}>{p}</button>
                                ))}
                                <button onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))} disabled={currentPage === pagination.totalPages} className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Grid View */}
            {!loading && viewMode === 'grid' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                    {products.map((product: Product) => (
                        <div key={product.id} className="bg-card rounded-xl border border-border/70 p-3.5 sm:p-4 hover:border-border hover:shadow-xs transition-all group">
                            <div className="flex items-start justify-between mb-2.5">
                                <div className="w-14 h-14 rounded-lg bg-muted/60 border border-border/40 flex items-center justify-center relative overflow-hidden">
                                    {product.images.length > 0 ? (
                                        <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                                    ) : (
                                        <ImageIcon className="w-6 h-6 text-muted-foreground" />
                                    )}
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_LABELS[product.status]?.className}`}>{STATUS_LABELS[product.status]?.label}</span>
                            </div>
                            <h3 className="text-xs sm:text-sm font-semibold text-foreground mb-1 line-clamp-2 tracking-tight">{product.name}</h3>
                            <p className="text-[10px] font-mono text-muted-foreground uppercase mb-2">{product.sku}</p>
                            <div className="flex flex-wrap gap-1 mb-2.5">{product.platform.map((mp: string) => <span key={mp} className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${PLATFORM_COLORS[mp] || 'bg-muted text-muted-foreground'}`}>{mp}</span>)}</div>
                            <div className="grid grid-cols-2 gap-1.5 mb-2.5">
                                <div className="bg-muted/40 rounded-lg p-2"><div className="text-[10px] text-muted-foreground">Fiyat</div><div className="text-xs font-semibold text-foreground tabular-nums">{formatCurrency(product.price)}</div></div>
                                <div className="bg-muted/40 rounded-lg p-2"><div className="text-[10px] text-muted-foreground">Stok</div><div className={`text-xs font-semibold tabular-nums ${product.stock === 0 ? 'text-rose-500' : 'text-foreground'}`}>{product.stock}</div></div>
                                <div className="bg-muted/40 rounded-lg p-2"><div className="text-[10px] text-muted-foreground">Satış</div><div className="text-xs font-semibold text-foreground tabular-nums">{product.sales.toLocaleString('tr-TR')}</div></div>
                                <div className="bg-muted/40 rounded-lg p-2"><div className="text-[10px] text-muted-foreground">Puan</div><div className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /><span className="text-xs font-semibold tabular-nums">{product.rating}</span></div></div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="flex-1 px-3 py-1.5 bg-muted/60 hover:bg-muted rounded-lg text-xs font-medium text-foreground transition-all">Düzenle</button>
                                <button onClick={() => handleOptimize(product.id)} className="flex-1 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/15 rounded-lg text-xs font-medium text-indigo-600 dark:text-indigo-400 transition-all flex items-center justify-center gap-1">{optimizing === product.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} AI Optimize</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && filteredProducts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 bg-card rounded-xl border border-border/70 p-6 text-center shadow-2xs">
                    <Package className="w-12 h-12 text-muted-foreground/60 mb-3" />
                    <h3 className="text-sm font-semibold text-foreground mb-1">Ürün bulunamadı</h3>
                    <p className="text-xs text-muted-foreground mb-4">Arama kriterlerinize uygun ürün bulunamadı</p>
                    <button onClick={() => { setSearchTerm(''); setStatusFilter('all'); setPlatformFilter('all'); setCategoryFilter('all'); }} className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors shadow-xs">Filtreleri Temizle</button>
                </div>
            )}
        </div>
    );
}
