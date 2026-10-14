"use client";

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import {
    Search,
    Download,
    Plus,
    AlertTriangle,
    TrendingUp,
    Edit,
    Trash2,
    RefreshCw,
    BarChart3,
    Box,
    ArrowUpDown,
    History,
} from 'lucide-react';
import { useInventory, useInventoryStats } from '@/lib/hooks';

interface InventoryItem {
    id: string;
    name: string;
    sku: string;
    stock: number;
    category?: string;
    basePrice: number | string;
    cost?: number | string;
    images?: Array<{ url: string }>;
    marketplaceProducts?: Array<{
        id: string;
        platform: string;
    }>;
}

interface InventoryStats {
    totalProducts: number;
    criticalStockCount: number;
    lowStockCount: number;
    totalValue: number;
}

interface InventoryApiResponse {
    items?: InventoryItem[];
    pagination?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

const categories = ["Tümü", "Aksesuar", "Kulaklık", "Laptop", "Tablet", "Akıllı Saat"];

export default function InventoryPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Tümü');
    const [selectedStatus] = useState('Tümü');
    const [sortBy, setSortBy] = useState<'stock' | 'name' | 'trend'>('stock');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);

    const filters = useMemo(() => ({
        page: currentPage,
        limit: 50,
        search: searchTerm || undefined,
        category: selectedCategory !== 'Tümü' ? selectedCategory : undefined,
        status: selectedStatus !== 'Tümü' ? selectedStatus.toLowerCase() : undefined,
        sortBy,
        sortOrder,
    }), [currentPage, searchTerm, selectedCategory, selectedStatus, sortBy, sortOrder]);

    const { data: inventoryData, loading: inventoryLoading, refetch: loadData } = useInventory(filters);
    const { data: statsData, loading: statsLoading } = useInventoryStats();

    const inventoryPayload = (inventoryData as InventoryApiResponse | undefined) || undefined;
    const items = useMemo(() => inventoryPayload?.items || [], [inventoryPayload]);
    const stats = statsData as InventoryStats | undefined;
    const loading = inventoryLoading || statsLoading;
    const pagination = inventoryPayload?.pagination || { total: 0, page: 1, limit: 50, totalPages: 1 };

    const toggleSelectAll = () => {
        if (selectedItems.length === items.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(items.map((i: InventoryItem) => i.id));
        }
    };

    const toggleSelectItem = (id: string) => {
        setSelectedItems(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSort = (field: 'stock' | 'name' | 'trend') => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    const getStatusBadge = (status: string | number) => {
        const s = typeof status === 'number' ? (status < 5 ? 'critical' : status < 20 ? 'low' : 'ok') : status;
        switch (s) {
            case 'critical':
                return <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20">KRİTİK</span>;
            case 'low':
                return <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-orange-500/10 text-orange-500 border border-orange-500/20">DÜŞÜK</span>;
            default:
                return <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-green-500/10 text-green-500 border border-green-500/20">NORMAL</span>;
        }
    };

    return (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300 pb-16">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-lg sm:text-xl font-semibold text-foreground tracking-tight">Stok Yönetimi</h1>
                    <p className="text-xs text-muted-foreground">Tüm pazaryerlerinizdeki envanterinizi tek panelden yönetin</p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border/70 rounded-lg text-xs font-medium text-foreground hover:bg-muted transition-all shadow-2xs">
                        <Download size={13} /> Dışa Aktar
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-all shadow-xs">
                        <Plus size={13} /> Yeni Ürün
                    </button>
                    <button onClick={() => loadData()} className="p-1.5 bg-card border border-border/70 rounded-lg text-muted-foreground hover:text-foreground">
                        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-card p-3 sm:p-3.5 rounded-xl border border-border/70 shadow-2xs">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center"><Box size={16} /></div>
                    </div>
                    <div className="text-base sm:text-lg font-semibold text-foreground tracking-tight tabular-nums">{stats?.totalProducts || 0}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 font-normal">Toplam SKU</div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card p-3 sm:p-3.5 rounded-xl border border-border/70 shadow-2xs">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center"><AlertTriangle size={16} /></div>
                    </div>
                    <div className="text-base sm:text-lg font-semibold text-foreground tracking-tight tabular-nums">{stats?.criticalStockCount || 0}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 font-normal">Kritik Stok</div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card p-3 sm:p-3.5 rounded-xl border border-border/70 shadow-2xs">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center"><BarChart3 size={16} /></div>
                    </div>
                    <div className="text-base sm:text-lg font-semibold text-foreground tracking-tight tabular-nums">{stats?.lowStockCount || 0}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 font-normal">Düşük Stok</div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card p-3 sm:p-3.5 rounded-xl border border-border/70 shadow-2xs">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center"><TrendingUp size={16} /></div>
                    </div>
                    <div className="text-base sm:text-lg font-semibold text-foreground tracking-tight tabular-nums">₺{stats?.totalValue?.toLocaleString('tr-TR') || 0}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 font-normal">Envanter Değeri</div>
                </motion.div>
            </div>

            {/* Filters */}
            <div className="bg-card p-3 rounded-xl border border-border/70 flex flex-wrap items-center gap-2.5 shadow-2xs">
                <div className="flex-1 min-w-[240px] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Ürün adı, SKU veya barkod ara..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="w-full pl-9 pr-3 py-1.5 bg-background border border-border/70 rounded-lg text-xs sm:text-sm focus:outline-none focus:border-indigo-500/50"
                    />
                </div>
                <div className="h-6 w-px bg-border/60 hidden sm:block" />
                <div className="flex items-center gap-1.5 flex-wrap">
                    {categories.map(c => (
                        <button
                            key={c}
                            onClick={() => setSelectedCategory(c)}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${selectedCategory === c ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-muted/50 text-muted-foreground hover:text-foreground'}`}
                        >
                            {c}
                        </button>
                    ))}
                </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-card rounded-xl border border-border/70 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm">
                        <thead className="bg-muted/40 border-b border-border/70">
                            <tr>
                                <th className="px-4 py-3 text-left w-10">
                                    <input
                                        type="checkbox"
                                        checked={selectedItems.length === items.length && items.length > 0}
                                        onChange={toggleSelectAll}
                                        className="w-4 h-4 rounded border-border text-indigo-600 focus:ring-indigo-500"
                                    />
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground uppercase tracking-wider text-[11px] cursor-pointer" onClick={() => toggleSort('name')}>
                                    <div className="flex items-center gap-1.5">Ürün Bilgisi <ArrowUpDown size={11} /></div>
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground uppercase tracking-wider text-[11px]">Kategori</th>
                                <th className="px-4 py-3 text-center font-medium text-muted-foreground uppercase tracking-wider text-[11px] cursor-pointer" onClick={() => toggleSort('stock')}>
                                    <div className="flex items-center justify-center gap-1.5">Stok Durumu <ArrowUpDown size={11} /></div>
                                </th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground uppercase tracking-wider text-[11px]">Satış Fiyatı</th>
                                <th className="px-4 py-3 text-center font-medium text-muted-foreground uppercase tracking-wider text-[11px]">Pazaryerleri</th>
                                <th className="px-4 py-3 text-center font-medium text-muted-foreground uppercase tracking-wider text-[11px]">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {items.map((item: InventoryItem) => (
                                <tr key={item.id} className="hover:bg-background/50 transition-colors group">
                                    <td className="p-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedItems.includes(item.id)}
                                            onChange={() => toggleSelectItem(item.id)}
                                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                                        />
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center overflow-hidden relative">
                                                {item.images?.[0] ? (
                                                    <Image src={item.images[0].url} alt={item.name} fill className="object-cover" />
                                                ) : (
                                                    <Box size={20} className="text-slate-300" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-bold text-foreground line-clamp-1">{item.name}</div>
                                                <div className="text-[10px] font-black text-slate-400 tabular-nums uppercase">{item.sku}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                            {item.category || 'Genel'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col items-center gap-1.5">
                                            <div className="flex items-center gap-2">
                                                <span className="font-black text-foreground tabular-nums text-base">{item.stock}</span>
                                                {getStatusBadge(item.stock)}
                                            </div>
                                            <div className="w-24 h-1 bg-background rounded-full overflow-hidden border border-border">
                                                <div
                                                    className={`h-full rounded-full ${item.stock < 5 ? 'bg-red-500' : item.stock < 20 ? 'bg-orange-500' : 'bg-green-500'}`}
                                                    style={{ width: `${Math.min((item.stock / 50) * 100, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="font-black text-foreground tabular-nums">₺{Number(item.basePrice).toLocaleString()}</div>
                                        <div className="text-[10px] text-slate-400 font-bold">Maliyet: ₺{Number(item.cost || 0).toLocaleString()}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-center gap-1">
                                            {item.marketplaceProducts?.map((mp) => (
                                                <div key={mp.id} className="w-6 h-6 rounded-lg bg-background border border-border flex items-center justify-center" title={mp.platform}>
                                                    <span className="text-[8px] font-black">{mp.platform[0]}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"><Edit size={16} /></button>
                                            <button className="p-2 text-slate-400 hover:text-foreground hover:bg-background rounded-xl transition-all"><History size={16} /></button>
                                            <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="p-4 border-t border-border flex items-center justify-between bg-background/30 text-xs font-bold text-slate-500">
                        <div>Toplam {pagination.total} üründen {(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} gösteriliyor</div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 border border-border rounded-xl hover:bg-background transition-all disabled:opacity-30">Önceki</button>
                            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p: number) => (
                                <button key={p} onClick={() => setCurrentPage(p)} className={`w-10 h-10 rounded-xl transition-all ${p === currentPage ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-background text-slate-500 border border-border'}`}>{p}</button>
                            ))}
                            <button onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))} disabled={currentPage === pagination.totalPages} className="px-4 py-2 border border-border rounded-xl hover:bg-background transition-all disabled:opacity-30">Sonraki</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
