"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Search,
    Download,
    Star,
    ShoppingBag,
    TrendingUp,
    Mail,
    Phone,
    MapPin,
    Calendar,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Eye,
    MessageSquare,
    Award,
    UserCheck,
    UserX,
    UserPlus,
    RefreshCw,
    MoreVertical,
    ArrowUpDown,
    X,
    Trash2,
    StickyNote,
    Heart,
    Percent,
    ArrowUp,
    ArrowDown
} from 'lucide-react';
import { useCustomers, useCustomerStats, type Customer, type CustomerStats } from '@/lib/hooks';

// Segment filter options
const segmentFilters = [
    { value: 'all', label: 'Tümü' },
    { value: 'vip', label: 'VIP' },
    { value: 'regular', label: 'Düzenli' },
    { value: 'new', label: 'Yeni' },
    { value: 'at-risk', label: 'Risk Altında' },
    { value: 'churned', label: 'Kaybedilen' },
] as const;

// Sort options
const sortOptions = [
    { value: 'totalSpent', label: 'Toplam Harcama' },
    { value: 'totalOrders', label: 'Sipariş Sayısı' },
    { value: 'avgOrderValue', label: 'Ort. Sipariş Değeri' },
    { value: 'lastOrderDate', label: 'Son Sipariş Tarihi' },
    { value: 'loyaltyScore', label: 'Sadakat Puanı' },
    { value: 'name', label: 'İsim' },
] as const;

const ITEMS_PER_PAGE = 10;


// Loading skeleton component
function TableSkeleton() {
    return (
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
            <div className="p-4 space-y-4">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 animate-pulse">
                        <div className="w-10 h-10 rounded-xl bg-border/50" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-border/50 rounded w-1/4" />
                            <div className="h-3 bg-border/30 rounded w-1/3" />
                        </div>
                        <div className="h-4 bg-border/40 rounded w-16" />
                        <div className="h-4 bg-border/40 rounded w-20" />
                        <div className="h-4 bg-border/40 rounded w-16" />
                        <div className="h-6 bg-border/30 rounded-lg w-14" />
                        <div className="h-4 bg-border/40 rounded w-12" />
                    </div>
                ))}
            </div>
        </div>
    );
}

function StatsSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-surface p-5 rounded-2xl border border-border animate-pulse">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-9 h-9 rounded-xl bg-border/40" />
                    </div>
                    <div className="h-6 bg-border/50 rounded w-16 mb-1" />
                    <div className="h-3 bg-border/30 rounded w-24" />
                </div>
            ))}
        </div>
    );
}

const SortIcon = ({ field, sortBy, sortDir }: { field: string; sortBy: string; sortDir: 'asc' | 'desc' }) => {
    if (sortBy !== field) return <ArrowUpDown size={12} className="text-slate-400" />;
    return sortDir === 'desc' ? <ArrowDown size={12} className="text-primary" /> : <ArrowUp size={12} className="text-primary" />;
};

export default function CustomersPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSegment, setSelectedSegment] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('totalSpent');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

    const filters = useMemo(() => ({
        search: searchTerm,
        status: selectedSegment === 'all' ? undefined : selectedSegment,
        sortBy,
        sortDir,
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString()
    }), [searchTerm, selectedSegment, sortBy, sortDir, currentPage]);

    const { 
        customers, 
        pagination, 
        loading: customersLoading, 
        error: customersError, 
        fetchCustomers, 
        updateCustomer 
    } = useCustomers(filters);
    
    const { 
        data: stats, 
        loading: statsLoading, 
        error: statsError, 
        refetch: refetchStats 
    } = useCustomerStats();

    const loading = customersLoading || statsLoading;
    const error = customersError || statsError;
    const [actionMenuId, setActionMenuId] = useState<string | null>(null);
    const actionMenuRef = useRef<HTMLDivElement>(null);

    // Close action menu on outside click
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) {
                setActionMenuId(null);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Reset page on filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedSegment, sortBy, sortDir]);

    const getSegmentBadge = useCallback((segment: Customer['segment']) => {
        const configs: Record<string, { label: string; icon: React.ReactNode; classes: string }> = {
            vip: { label: 'VIP', icon: <Award size={10} />, classes: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
            regular: { label: 'Düzenli', icon: <UserCheck size={10} />, classes: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
            new: { label: 'Yeni', icon: <Star size={10} />, classes: 'bg-green-500/10 text-green-500 border-green-500/20' },
            'at-risk': { label: 'Risk', icon: <UserX size={10} />, classes: 'bg-red-500/10 text-red-500 border-red-500/20' },
            churned: { label: 'Kayıp', icon: <UserX size={10} />, classes: 'bg-slate-500/10 text-slate-500 border-slate-500/20' },
        };
        const cfg = configs[segment];
        if (!cfg) return null;
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border ${cfg.classes}`}>
                {cfg.icon} {cfg.label}
            </span>
        );
    }, []);

    // Pagination from API
    const totalPages = pagination?.totalPages || 1;
    const paginatedCustomers = customers;

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortDir(d => d === 'desc' ? 'asc' : 'desc');
        } else {
            setSortBy(field);
            setSortDir('desc');
        }
    };

    const handleExport = () => {
        const headers = ['İsim', 'E-posta', 'Segment', 'Sipariş', 'Toplam Harcama', 'Ort. Sipariş', 'Son Sipariş', 'Platformlar'];
        const rows = customers.map(c => [
            c.name, c.email, c.segment, c.totalOrders, c.totalSpent, c.avgOrderValue, c.lastOrderDate, c.platforms.join('; ')
        ]);
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `musteriler_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleAction = async (action: string, customer: Customer) => {
        setActionMenuId(null);
        switch (action) {
            case 'view':
                setSelectedCustomer(customer);
                break;
            case 'email':
                window.open(`mailto:${customer.email}`, '_blank');
                break;
            case 'note':
                // Placeholder for note functionality
                break;
            case 'mark-vip':
                await updateCustomer(customer.id, { segment: 'vip' });
                break;
            case 'delete':
                if (confirm(`"${customer.name}" müşterisini silmek istediğinize emin misiniz?`)) {
                    // Placeholder for delete
                }
                break;
        }
    };


    return (
        <div className="space-y-6 animate-in fade-in duration-300 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl lg:text-2xl font-semibold text-foreground tracking-tight">Müşteriler</h1>
                    <p className="text-xs text-muted-foreground mt-1">Tüm pazaryerlerindeki müşteri tabanınızı analiz edin</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExport}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-card hover:bg-muted border border-border/80 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground transition-colors shadow-xs"
                    >
                        <Download size={13} /> Dışa Aktar
                    </button>
                    <button
                        onClick={() => { fetchCustomers(); refetchStats(); }}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-card hover:bg-muted border border-border/80 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground transition-colors shadow-xs disabled:opacity-50"
                    >
                        <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Senkronize Et
                    </button>
                </div>
            </div>

            {/* Stats */}
            {loading && !stats ? (
                <StatsSkeleton />
            ) : stats ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
                    <div className="bg-card p-3 sm:p-3.5 rounded-xl border border-border/70 shadow-xs">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-medium text-muted-foreground">Toplam Müşteri</span>
                            <div className="p-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400"><Users size={13} /></div>
                        </div>
                        <div className="text-lg sm:text-xl font-semibold text-foreground tabular-nums">{stats.totalCustomers.toLocaleString('tr-TR')}</div>
                    </div>

                    <div className="bg-card p-3 sm:p-3.5 rounded-xl border border-border/70 shadow-xs">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-medium text-muted-foreground">Bu Ay Yeni</span>
                            <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><UserPlus size={13} /></div>
                        </div>
                        <div className="text-lg sm:text-xl font-semibold text-foreground tabular-nums">{stats.newCustomersThisMonth}</div>
                    </div>

                    <div className="bg-card p-3 sm:p-3.5 rounded-xl border border-border/70 shadow-xs">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">VIP Müşteri</span>
                            <div className="p-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400"><Award size={13} /></div>
                        </div>
                        <div className="text-lg sm:text-xl font-semibold text-foreground tabular-nums">{stats.vipCustomers}</div>
                    </div>

                    <div className="bg-card p-3 sm:p-3.5 rounded-xl border border-border/70 shadow-xs">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400">Risk Altında</span>
                            <div className="p-1 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400"><UserX size={13} /></div>
                        </div>
                        <div className="text-lg sm:text-xl font-semibold text-foreground tabular-nums">{stats.atRiskCustomers}</div>
                    </div>

                    <div className="bg-card p-3 sm:p-3.5 rounded-xl border border-border/70 shadow-xs">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-medium text-muted-foreground">Ort. Yaşam Değeri</span>
                            <div className="p-1 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400"><TrendingUp size={13} /></div>
                        </div>
                        <div className="text-lg sm:text-xl font-semibold text-foreground tabular-nums">₺{(stats.avgLifetimeValue / 1000).toFixed(1)}K</div>
                    </div>

                    <div className="bg-card p-3 sm:p-3.5 rounded-xl border border-border/70 shadow-xs">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-medium text-muted-foreground">Elde Tutma</span>
                            <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><Percent size={13} /></div>
                        </div>
                        <div className="text-lg sm:text-xl font-semibold text-foreground tabular-nums">%{stats.retentionRate.toFixed(1)}</div>
                    </div>
                </div>
            ) : null}

            {/* Filters */}
            <div className="bg-card p-3 sm:p-3.5 rounded-xl border border-border/70 shadow-xs flex flex-col sm:flex-row gap-2.5">
                <div className="flex-1 relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Müşteri adı, e-posta veya şehir ara..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="w-full bg-background border border-border/80 rounded-lg py-1.5 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500"
                    />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <select
                        value={selectedSegment}
                        onChange={(e) => { setSelectedSegment(e.target.value); setCurrentPage(1); }}
                        className="bg-background border border-border/80 rounded-lg px-2.5 py-1.5 text-xs font-medium text-foreground focus:outline-none focus:border-indigo-500"
                    >
                        {segmentFilters.map(f => (
                            <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                    </select>
                    <select
                        value={sortBy}
                        onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                        className="bg-background border border-border/80 rounded-lg px-2.5 py-1.5 text-xs font-medium text-foreground focus:outline-none focus:border-indigo-500"
                    >
                        {sortOptions.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                    </select>
                    <button
                        onClick={() => { setSortDir(d => d === 'desc' ? 'asc' : 'desc'); setCurrentPage(1); }}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-background border border-border/80 rounded-lg text-xs font-medium text-foreground hover:bg-muted transition-colors"
                        title={sortDir === 'desc' ? 'Azalan' : 'Artan'}
                    >
                        {sortDir === 'desc' ? <ArrowDown size={13} /> : <ArrowUp size={13} />}
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-500 text-xs font-medium">
                    Müşteri verileri yüklenirken hata oluştu. Yedek veriler gösteriliyor.
                </div>
            )}

            {/* Customer List */}
            {loading && customers.length === 0 ? (
                <TableSkeleton />
            ) : (
                <div className="bg-card rounded-xl border border-border/70 shadow-xs overflow-hidden">
                    {/* Mobile Customer Cards */}
                    <div className="md:hidden divide-y divide-border/60">
                        {paginatedCustomers.length === 0 ? (
                            <div className="px-4 py-12 text-center text-muted-foreground text-xs">
                                Aramanızla eşleşen müşteri bulunamadı.
                            </div>
                        ) : (
                            paginatedCustomers.map((customer) => (
                                <div key={customer.id} className="p-3.5 space-y-2.5">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-semibold text-xs shrink-0">
                                                {customer.name[0]}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-semibold text-xs text-foreground truncate">{customer.name}</div>
                                                <div className="text-[11px] text-muted-foreground truncate">{customer.email}</div>
                                            </div>
                                        </div>
                                        <div className="shrink-0 flex items-center gap-1.5">
                                            {getSegmentBadge(customer.segment)}
                                            <button
                                                onClick={() => handleAction('view', customer)}
                                                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                                            >
                                                <Eye size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 p-2 rounded-lg bg-muted/40 border border-border/50 text-center">
                                        <div>
                                            <div className="text-[10px] text-muted-foreground">Sipariş</div>
                                            <div className="text-xs font-semibold text-foreground tabular-nums">{customer.totalOrders}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-muted-foreground">Harcama</div>
                                            <div className="text-xs font-semibold text-foreground tabular-nums">₺{customer.totalSpent.toLocaleString('tr-TR')}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-muted-foreground">Sadakat</div>
                                            <div className="text-xs font-semibold text-foreground tabular-nums">%{customer.loyaltyScore}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                                        <span>Son Sipariş: {new Date(customer.lastOrderDate).toLocaleDateString('tr-TR')}</span>
                                        <div className="flex gap-1">
                                            {customer.platforms.map(p => (
                                                <span key={p} className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/50">
                                                    {p.slice(0, 2).toUpperCase()}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-muted/40 border-b border-border/70 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                    <th className="px-3.5 py-2.5 text-left">Müşteri</th>
                                    <th className="px-3.5 py-2.5 text-left">E-posta</th>
                                    <th className="px-3.5 py-2.5 text-left">Segment</th>
                                    <th className="px-3.5 py-2.5 text-left cursor-pointer select-none" onClick={() => handleSort('totalOrders')}>
                                        <span className="inline-flex items-center gap-1">Siparişler <SortIcon field="totalOrders" sortBy={sortBy} sortDir={sortDir} /></span>
                                    </th>
                                    <th className="px-3.5 py-2.5 text-left cursor-pointer select-none" onClick={() => handleSort('totalSpent')}>
                                        <span className="inline-flex items-center gap-1">Toplam Harcama <SortIcon field="totalSpent" sortBy={sortBy} sortDir={sortDir} /></span>
                                    </th>
                                    <th className="px-3.5 py-2.5 text-left cursor-pointer select-none" onClick={() => handleSort('avgOrderValue')}>
                                        <span className="inline-flex items-center gap-1">Ort. Sipariş <SortIcon field="avgOrderValue" sortBy={sortBy} sortDir={sortDir} /></span>
                                    </th>
                                    <th className="px-3.5 py-2.5 text-left cursor-pointer select-none" onClick={() => handleSort('lastOrderDate')}>
                                        <span className="inline-flex items-center gap-1">Son Sipariş <SortIcon field="lastOrderDate" sortBy={sortBy} sortDir={sortDir} /></span>
                                    </th>
                                    <th className="px-3.5 py-2.5 text-left cursor-pointer select-none" onClick={() => handleSort('loyaltyScore')}>
                                        <span className="inline-flex items-center gap-1">Sadakat <SortIcon field="loyaltyScore" sortBy={sortBy} sortDir={sortDir} /></span>
                                    </th>
                                    <th className="px-3.5 py-2.5 text-left">Platformlar</th>
                                    <th className="px-3.5 py-2.5 text-right">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {paginatedCustomers.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground text-xs">
                                            Aramanızla eşleşen müşteri bulunamadı.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedCustomers.map((customer, idx) => (
                                        <tr
                                            key={customer.id}
                                            className="hover:bg-muted/30 transition-colors group"
                                        >
                                            <td className="px-3.5 py-2.5">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-semibold text-xs shrink-0">
                                                        {customer.name[0]}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-medium text-foreground truncate">{customer.name}</div>
                                                        {customer.address?.city && (
                                                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                                                <MapPin size={10} /> {customer.address.city}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3.5 py-2.5">
                                                <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                                                    <Mail size={10} /> {customer.email}
                                                </div>
                                            </td>
                                            <td className="px-3.5 py-2.5">
                                                {getSegmentBadge(customer.segment)}
                                            </td>
                                            <td className="px-3.5 py-2.5">
                                                <div className="font-semibold text-foreground tabular-nums">{customer.totalOrders}</div>
                                                <div className="text-[10px] text-muted-foreground">sipariş</div>
                                            </td>
                                            <td className="px-3.5 py-2.5">
                                                <div className="font-semibold text-foreground tabular-nums">₺{customer.totalSpent.toLocaleString('tr-TR')}</div>
                                            </td>
                                            <td className="px-3.5 py-2.5">
                                                <div className="font-medium text-foreground tabular-nums">₺{customer.avgOrderValue.toLocaleString('tr-TR')}</div>
                                            </td>
                                            <td className="px-3.5 py-2.5">
                                                <div className="text-muted-foreground">
                                                    {new Date(customer.lastOrderDate).toLocaleDateString('tr-TR')}
                                                </div>
                                            </td>
                                            <td className="px-3.5 py-2.5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-14 h-1.5 rounded-full bg-muted overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${customer.loyaltyScore >= 70 ? 'bg-emerald-500' : customer.loyaltyScore >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                                            style={{ width: `${customer.loyaltyScore}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[11px] font-semibold text-foreground">{customer.loyaltyScore}</span>
                                                </div>
                                            </td>
                                            <td className="px-3.5 py-2.5">
                                                <div className="flex gap-1">
                                                    {customer.platforms.slice(0, 2).map(p => (
                                                        <span key={p} className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-muted border border-border/50 text-muted-foreground">
                                                            {p.slice(0, 2).toUpperCase()}
                                                        </span>
                                                    ))}
                                                    {customer.platforms.length > 2 && (
                                                        <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-muted border border-border/50 text-muted-foreground">
                                                            +{customer.platforms.length - 2}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-3.5 py-2.5 text-right">
                                                <div className="relative inline-block" ref={actionMenuId === customer.id ? actionMenuRef : undefined}>
                                                    <button
                                                        onClick={() => setActionMenuId(actionMenuId === customer.id ? null : customer.id)}
                                                        className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                                    >
                                                        <MoreVertical size={14} />
                                                    </button>
                                                    <AnimatePresence>
                                                        {actionMenuId === customer.id && (
                                                            <motion.div
                                                                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                                                className="absolute right-0 top-8 z-50 w-44 bg-card border border-border rounded-xl shadow-xl overflow-hidden py-1 text-left"
                                                            >
                                                                <button onClick={() => handleAction('view', customer)} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors">
                                                                    <Eye size={13} /> Detayları Gör
                                                                </button>
                                                                <button onClick={() => handleAction('email', customer)} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors">
                                                                    <Mail size={13} /> E-posta Gönder
                                                                </button>
                                                                <button onClick={() => handleAction('note', customer)} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors">
                                                                    <StickyNote size={13} /> Not Ekle
                                                                </button>
                                                                {customer.segment !== 'vip' && (
                                                                    <button onClick={() => handleAction('mark-vip', customer)} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-amber-600 hover:bg-muted transition-colors">
                                                                        <Award size={13} /> VIP Olarak İşaretle
                                                                    </button>
                                                                )}
                                                                <div className="border-t border-border/60 my-1" />
                                                                <button onClick={() => handleAction('delete', customer)} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-rose-500 hover:bg-rose-500/10 transition-colors">
                                                                    <Trash2 size={13} /> Sil
                                                                </button>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-border/70 text-xs text-muted-foreground">
                            <div>
                                {pagination?.total || 0} müşteriden {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, pagination?.total || 0)} arası
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft size={15} />
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                    .map((page, idx, arr) => (
                                        <React.Fragment key={page}>
                                            {idx > 0 && arr[idx - 1]! < page - 1 && (
                                                <span className="px-1 text-muted-foreground text-xs">…</span>
                                            )}
                                            <button
                                                onClick={() => setCurrentPage(page)}
                                                className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${currentPage === page ? 'bg-indigo-600 text-white font-semibold' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}
                                            >
                                                {page}
                                            </button>
                                        </React.Fragment>
                                    ))
                                }
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight size={15} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Customer Detail Slide-over */}
            <AnimatePresence>
                {selectedCustomer && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 z-40"
                            onClick={() => setSelectedCustomer(null)}
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-surface border-l border-border z-50 overflow-y-auto"
                        >
                            <div className="p-6 space-y-6">
                                {/* Panel Header */}
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-black text-foreground">Müşteri Detayı</h2>
                                    <button
                                        onClick={() => setSelectedCustomer(null)}
                                        className="p-2 rounded-xl hover:bg-background text-slate-400 hover:text-foreground transition-all"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Customer Info */}
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                                        <span className="text-2xl font-black text-primary">{selectedCustomer.name[0]}</span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-foreground">{selectedCustomer.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            {getSegmentBadge(selectedCustomer.segment)}
                                            {selectedCustomer.address?.city && (
                                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                                    <MapPin size={10} /> {selectedCustomer.address.city}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Contact */}
                                <div className="bg-background rounded-2xl p-4 space-y-3 border border-border">
                                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">İletişim Bilgileri</h4>
                                    <div className="flex items-center gap-2 text-sm text-foreground">
                                        <Mail size={14} className="text-slate-400" /> {selectedCustomer.email}
                                    </div>
                                    {selectedCustomer.phone && (
                                        <div className="flex items-center gap-2 text-sm text-foreground">
                                            <Phone size={14} className="text-slate-400" /> {selectedCustomer.phone}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-sm text-foreground">
                                        <Calendar size={14} className="text-slate-400" /> Üyelik: {new Date(selectedCustomer.joinDate).toLocaleDateString('tr-TR')}
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-background rounded-2xl p-4 border border-border">
                                        <div className="text-xs text-slate-500 mb-1">Toplam Sipariş</div>
                                        <div className="text-xl font-black text-foreground">{selectedCustomer.totalOrders}</div>
                                    </div>
                                    <div className="bg-background rounded-2xl p-4 border border-border">
                                        <div className="text-xs text-slate-500 mb-1">Toplam Harcama</div>
                                        <div className="text-xl font-black text-foreground">₺{selectedCustomer.totalSpent.toLocaleString('tr-TR')}</div>
                                    </div>
                                    <div className="bg-background rounded-2xl p-4 border border-border">
                                        <div className="text-xs text-slate-500 mb-1">Ort. Sipariş Değeri</div>
                                        <div className="text-xl font-black text-foreground">₺{selectedCustomer.avgOrderValue.toLocaleString('tr-TR')}</div>
                                    </div>
                                    <div className="bg-background rounded-2xl p-4 border border-border">
                                        <div className="text-xs text-slate-500 mb-1">Sadakat Puanı</div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-xl font-black text-foreground">{selectedCustomer.loyaltyScore}</div>
                                            <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${selectedCustomer.loyaltyScore >= 70 ? 'bg-green-500' : selectedCustomer.loyaltyScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                    style={{ width: `${selectedCustomer.loyaltyScore}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Last Order */}
                                <div className="bg-background rounded-2xl p-4 border border-border">
                                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Son Sipariş</h4>
                                    <div className="text-sm text-foreground">
                                        {new Date(selectedCustomer.lastOrderDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </div>
                                </div>

                                {/* Platforms */}
                                <div className="bg-background rounded-2xl p-4 border border-border">
                                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Platformlar</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedCustomer.platforms.map(p => (
                                            <span key={p} className="text-xs font-bold px-3 py-1.5 rounded-xl bg-surface border border-border text-foreground">
                                                {p}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Tags */}
                                {selectedCustomer.tags && selectedCustomer.tags.length > 0 && (
                                    <div className="bg-background rounded-2xl p-4 border border-border">
                                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Etiketler</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedCustomer.tags.map(tag => (
                                                <span key={tag} className="text-xs font-medium px-3 py-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Notes */}
                                {selectedCustomer.notes && (
                                    <div className="bg-background rounded-2xl p-4 border border-border">
                                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Notlar</h4>
                                        <p className="text-sm text-foreground">{selectedCustomer.notes}</p>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => { window.open(`mailto:${selectedCustomer.email}`, '_blank'); }}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all"
                                    >
                                        <Mail size={14} /> E-posta Gönder
                                    </button>
                                    {selectedCustomer.segment !== 'vip' && (
                                        <button
                                            onClick={() => { updateCustomer(selectedCustomer.id, { segment: 'vip' }); setSelectedCustomer(null); }}
                                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 rounded-xl text-sm font-bold hover:bg-yellow-500/20 transition-all"
                                        >
                                            <Award size={14} /> VIP Yap
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
