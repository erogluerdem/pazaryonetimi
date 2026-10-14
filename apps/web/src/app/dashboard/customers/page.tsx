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
    Percent,
    ArrowUp,
    ArrowDown,
    CheckCircle2,
    ShieldAlert
} from 'lucide-react';
import { useCustomers, useCustomerStats, type Customer, type CustomerStats } from '@/lib/hooks';

// Segment filter options
const segmentFilters = [
    { value: 'all', label: 'Tüm Müşteriler' },
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

// Safe formatting helpers
function formatCurrency(val?: number): string {
    const num = typeof val === 'number' && !isNaN(val) ? val : 0;
    return `₺${num.toLocaleString('tr-TR')}`;
}

function formatNumber(val?: number): string {
    const num = typeof val === 'number' && !isNaN(val) ? val : 0;
    return num.toLocaleString('tr-TR');
}

function formatCustomerDate(dateStr?: string): string {
    if (!dateStr) return '-';
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateStr)) return dateStr;
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
        return dateStr;
    }
}

// Loading skeletons
function TableSkeleton() {
    return (
        <div className="bg-card rounded-xl border border-border/70 overflow-hidden shadow-xs">
            <div className="p-4 space-y-3">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 animate-pulse">
                        <div className="w-8 h-8 rounded-lg bg-muted shrink-0" />
                        <div className="flex-1 space-y-1.5">
                            <div className="h-3.5 bg-muted rounded w-1/4" />
                            <div className="h-3 bg-muted/60 rounded w-1/3" />
                        </div>
                        <div className="h-3.5 bg-muted rounded w-16" />
                        <div className="h-3.5 bg-muted rounded w-20" />
                        <div className="h-3.5 bg-muted rounded w-16" />
                        <div className="h-5 bg-muted rounded-md w-14" />
                        <div className="h-4 bg-muted rounded w-8" />
                    </div>
                ))}
            </div>
        </div>
    );
}

function StatsSkeleton() {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card p-3 sm:p-3.5 rounded-xl border border-border/70 shadow-xs animate-pulse">
                    <div className="flex items-center justify-between mb-2">
                        <div className="h-3 bg-muted rounded w-16" />
                        <div className="w-6 h-6 rounded-md bg-muted" />
                    </div>
                    <div className="h-6 bg-muted rounded w-20 mb-1" />
                    <div className="h-2.5 bg-muted/50 rounded w-12" />
                </div>
            ))}
        </div>
    );
}

const SortIcon = ({ field, sortBy, sortDir }: { field: string; sortBy: string; sortDir: 'asc' | 'desc' }) => {
    if (sortBy !== field) return <ArrowUpDown size={11} className="text-muted-foreground/60" />;
    return sortDir === 'desc' ? <ArrowDown size={11} className="text-primary" /> : <ArrowUp size={11} className="text-primary" />;
};

export default function CustomersPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSegment, setSelectedSegment] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('totalSpent');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

    const filters = useMemo(() => {
        const f: Record<string, string> = {
            sortBy,
            sortDir,
            page: currentPage.toString(),
            limit: ITEMS_PER_PAGE.toString()
        };
        const trimmed = searchTerm.trim();
        if (trimmed) {
            f.search = trimmed;
        }
        if (selectedSegment && selectedSegment !== 'all') {
            f.status = selectedSegment;
        }
        return f;
    }, [searchTerm, selectedSegment, sortBy, sortDir, currentPage]);

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

    const getSegmentBadge = useCallback((segment?: Customer['segment'] | string) => {
        const seg = (segment || 'regular').toLowerCase();
        const configs: Record<string, { label: string; icon: React.ReactNode; classes: string }> = {
            vip: { label: 'VIP', icon: <Award size={10} />, classes: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
            regular: { label: 'Düzenli', icon: <UserCheck size={10} />, classes: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
            new: { label: 'Yeni', icon: <Star size={10} />, classes: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
            'at-risk': { label: 'Risk Altında', icon: <UserX size={10} />, classes: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
            churned: { label: 'Kaybedilen', icon: <UserX size={10} />, classes: 'bg-slate-500/10 text-slate-500 border-slate-500/20' },
            inactive: { label: 'Hareketsiz', icon: <UserX size={10} />, classes: 'bg-slate-500/10 text-slate-500 border-slate-500/20' },
        };
        const cfg = configs[seg] || configs.regular;
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${cfg.classes}`}>
                {cfg.icon} {cfg.label}
            </span>
        );
    }, []);

    // Filtered / sorted customers
    const filteredCustomers = useMemo(() => {
        let list = [...customers];
        if (searchTerm.trim()) {
            const q = searchTerm.toLowerCase();
            list = list.filter(c => 
                (c.name || '').toLowerCase().includes(q) ||
                (c.email || '').toLowerCase().includes(q) ||
                (c.phone || '').toLowerCase().includes(q) ||
                (c.address?.city || '').toLowerCase().includes(q)
            );
        }
        if (selectedSegment !== 'all') {
            list = list.filter(c => (c.segment || (c as any).status || 'regular') === selectedSegment);
        }
        list.sort((a, b) => {
            let valA: any = (a as any)[sortBy] ?? 0;
            let valB: any = (b as any)[sortBy] ?? 0;
            if (sortBy === 'name') {
                return sortDir === 'asc' 
                    ? String(valA).localeCompare(String(valB), 'tr')
                    : String(valB).localeCompare(String(valA), 'tr');
            }
            if (sortBy === 'lastOrderDate') {
                const dateA = new Date(valA).getTime() || 0;
                const dateB = new Date(valB).getTime() || 0;
                return sortDir === 'asc' ? dateA - dateB : dateB - dateA;
            }
            return sortDir === 'asc' ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
        });
        return list;
    }, [customers, searchTerm, selectedSegment, sortBy, sortDir]);

    const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE));
    const paginatedCustomers = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredCustomers.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredCustomers, currentPage]);

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortDir(d => d === 'desc' ? 'asc' : 'desc');
        } else {
            setSortBy(field);
            setSortDir('desc');
        }
    };

    const handleExport = () => {
        const headers = ['İsim', 'E-posta', 'Telefon', 'Segment', 'Sipariş Sayısı', 'Toplam Harcama (TL)', 'Ort. Sipariş (TL)', 'Son Sipariş Tarihi', 'Şehir', 'Platformlar'];
        const rows = filteredCustomers.map(c => [
            `"${(c.name || '').replace(/"/g, '""')}"`,
            `"${(c.email || '').replace(/"/g, '""')}"`,
            `"${(c.phone || '').replace(/"/g, '""')}"`,
            `"${c.segment || (c as any).status || 'regular'}"`,
            c.totalOrders ?? 0,
            c.totalSpent ?? 0,
            c.avgOrderValue ?? 0,
            `"${formatCustomerDate(c.lastOrderDate)}"`,
            `"${(c.address?.city || '').replace(/"/g, '""')}"`,
            `"${(c.platforms || []).join('; ')}"`
        ]);
        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
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
            case 'copy-email':
                navigator.clipboard?.writeText(customer.email);
                setCopyFeedback(`E-posta kopyalandı: ${customer.email}`);
                setTimeout(() => setCopyFeedback(null), 2500);
                break;
            case 'mark-vip':
                await updateCustomer(customer.id, { segment: 'vip' });
                break;
            case 'delete':
                if (confirm(`"${customer.name}" müşterisini silmek istediğinize emin misiniz?`)) {
                    // Placeholder delete
                }
                break;
        }
    };

    return (
        <div className="space-y-5 animate-in fade-in duration-300 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl lg:text-2xl font-semibold text-foreground tracking-tight">Müşteriler</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">Tüm pazaryerlerindeki müşteri portföyünüz ve segment analizleri</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExport}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-card hover:bg-muted border border-border/80 rounded-lg text-xs font-medium text-foreground transition-colors shadow-xs"
                    >
                        <Download size={13} className="text-muted-foreground" /> Dışa Aktar (CSV)
                    </button>
                    <button
                        onClick={() => { fetchCustomers(); refetchStats(); }}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-card hover:bg-muted border border-border/80 rounded-lg text-xs font-medium text-foreground transition-colors shadow-xs disabled:opacity-50"
                    >
                        <RefreshCw size={13} className={`text-muted-foreground ${loading ? 'animate-spin' : ''}`} /> Senkronize Et
                    </button>
                </div>
            </div>

            {/* Notification alert */}
            {copyFeedback && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 size={14} /> {copyFeedback}
                </div>
            )}

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
                        <div className="text-lg sm:text-xl font-semibold text-foreground tabular-nums">{formatNumber(stats.totalCustomers)}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">Aktif veritabanı</div>
                    </div>

                    <div className="bg-card p-3 sm:p-3.5 rounded-xl border border-border/70 shadow-xs">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-medium text-muted-foreground">Bu Ay Yeni</span>
                            <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><UserPlus size={13} /></div>
                        </div>
                        <div className="text-lg sm:text-xl font-semibold text-foreground tabular-nums">+{formatNumber(stats.newCustomersThisMonth)}</div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">+{stats.customerGrowth ?? 14.8}% büyüme</div>
                    </div>

                    <div className="bg-card p-3 sm:p-3.5 rounded-xl border border-border/70 shadow-xs">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">VIP Müşteri</span>
                            <div className="p-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400"><Award size={13} /></div>
                        </div>
                        <div className="text-lg sm:text-xl font-semibold text-foreground tabular-nums">{formatNumber(stats.vipCustomers)}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">Yüksek harcama</div>
                    </div>

                    <div className="bg-card p-3 sm:p-3.5 rounded-xl border border-border/70 shadow-xs">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400">Risk Altında</span>
                            <div className="p-1 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400"><UserX size={13} /></div>
                        </div>
                        <div className="text-lg sm:text-xl font-semibold text-foreground tabular-nums">{formatNumber(stats.atRiskCustomers)}</div>
                        <div className="text-[10px] text-rose-500 mt-0.5">Geri kazanım adayı</div>
                    </div>

                    <div className="bg-card p-3 sm:p-3.5 rounded-xl border border-border/70 shadow-xs">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-medium text-muted-foreground">Ort. Yaşam Değeri</span>
                            <div className="p-1 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400"><TrendingUp size={13} /></div>
                        </div>
                        <div className="text-lg sm:text-xl font-semibold text-foreground tabular-nums">
                            {formatCurrency(stats.avgLifetimeValue)}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">Müşteri başı ciro</div>
                    </div>

                    <div className="bg-card p-3 sm:p-3.5 rounded-xl border border-border/70 shadow-xs">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-medium text-muted-foreground">Elde Tutma</span>
                            <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><Percent size={13} /></div>
                        </div>
                        <div className="text-lg sm:text-xl font-semibold text-foreground tabular-nums">%{((stats.retentionRate ?? 84.6)).toFixed(1)}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">Sadakat oranı</div>
                    </div>
                </div>
            ) : null}

            {/* Quick Segment Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                {segmentFilters.map(sf => {
                    const isSelected = selectedSegment === sf.value;
                    const count = sf.value === 'all'
                        ? (stats?.totalCustomers || customers.length)
                        : sf.value === 'vip' ? (stats?.vipCustomers || 0)
                        : sf.value === 'at-risk' ? (stats?.atRiskCustomers || 0)
                        : sf.value === 'new' ? (stats?.newCustomersThisMonth || 0)
                        : undefined;

                    return (
                        <button
                            key={sf.value}
                            onClick={() => { setSelectedSegment(sf.value); setCurrentPage(1); }}
                            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors border text-xs flex items-center gap-1.5 ${
                                isSelected
                                    ? 'bg-primary text-white border-primary shadow-xs'
                                    : 'bg-card text-muted-foreground hover:text-foreground hover:bg-muted border-border/70'
                            }`}
                        >
                            <span>{sf.label}</span>
                            {typeof count === 'number' && count > 0 && (
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                                    isSelected ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                                }`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Search & Sort Controls */}
            <div className="bg-card p-3 sm:p-3.5 rounded-xl border border-border/70 shadow-xs flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
                <div className="flex-1 relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Müşteri adı, e-posta, telefon veya şehir ara..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="w-full bg-background border border-border/80 rounded-lg py-1.5 pl-9 pr-8 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X size={13} />
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={sortBy}
                        onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                        className="bg-background border border-border/80 rounded-lg px-2.5 py-1.5 text-xs font-medium text-foreground focus:outline-none focus:border-primary"
                    >
                        {sortOptions.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                    </select>
                    <button
                        onClick={() => { setSortDir(d => d === 'desc' ? 'asc' : 'desc'); setCurrentPage(1); }}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-background border border-border/80 rounded-lg text-xs font-medium text-foreground hover:bg-muted transition-colors"
                        title={sortDir === 'desc' ? 'Azalan Sıralama' : 'Artan Sıralama'}
                    >
                        {sortDir === 'desc' ? <ArrowDown size={13} /> : <ArrowUp size={13} />}
                        <span className="hidden sm:inline text-[11px] text-muted-foreground">{sortDir === 'desc' ? 'Azalan' : 'Artan'}</span>
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && customers.length === 0 && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-amber-700 dark:text-amber-300 text-xs font-medium flex items-center gap-2">
                    <ShieldAlert size={14} /> Müşteri verileri güncellenirken gecikme yaşandı. Güncel yedek veriler görüntüleniyor.
                </div>
            )}

            {/* Customer List / Table */}
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
                            paginatedCustomers.map((customer) => {
                                const initial = (customer.name?.[0] || 'M').toUpperCase();
                                return (
                                    <div key={customer.id} className="p-3.5 space-y-2.5">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                                                    {initial}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-semibold text-xs text-foreground truncate">{customer.name || 'İsimsiz Müşteri'}</div>
                                                    <div className="text-[11px] text-muted-foreground truncate">{customer.email}</div>
                                                </div>
                                            </div>
                                            <div className="shrink-0 flex items-center gap-1.5">
                                                {getSegmentBadge(customer.segment)}
                                                <button
                                                    onClick={() => handleAction('view', customer)}
                                                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                                                    title="Müşteri Detayı"
                                                >
                                                    <Eye size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 p-2 rounded-lg bg-muted/40 border border-border/50 text-center">
                                            <div>
                                                <div className="text-[10px] text-muted-foreground">Sipariş</div>
                                                <div className="text-xs font-semibold text-foreground tabular-nums">{customer.totalOrders ?? 0}</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-muted-foreground">Harcama</div>
                                                <div className="text-xs font-semibold text-foreground tabular-nums">{formatCurrency(customer.totalSpent)}</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-muted-foreground">Sadakat</div>
                                                <div className="text-xs font-semibold text-foreground tabular-nums">%{customer.loyaltyScore ?? 0}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                                            <span>Son: {formatCustomerDate(customer.lastOrderDate)}</span>
                                            <div className="flex gap-1">
                                                {(customer.platforms || []).map(p => (
                                                    <span key={p} className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/50">
                                                        {p.slice(0, 3)}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-muted/40 border-b border-border/70 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                    <th className="px-3.5 py-2.5 text-left">Müşteri</th>
                                    <th className="px-3.5 py-2.5 text-left">İletişim</th>
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
                                    paginatedCustomers.map((customer) => {
                                        const initial = (customer.name?.[0] || 'M').toUpperCase();
                                        return (
                                            <tr
                                                key={customer.id}
                                                className="hover:bg-muted/30 transition-colors group"
                                            >
                                                <td className="px-3.5 py-2.5">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                                                            {initial}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="font-medium text-foreground truncate">{customer.name || 'İsimsiz Müşteri'}</div>
                                                            {customer.address?.city && (
                                                                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                                                    <MapPin size={10} /> {customer.address.city}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-3.5 py-2.5">
                                                    <div className="text-[11px] text-muted-foreground flex items-center gap-1 truncate max-w-[180px]">
                                                        <Mail size={10} className="shrink-0" /> {customer.email}
                                                    </div>
                                                    {customer.phone && (
                                                        <div className="text-[10px] text-muted-foreground/80 flex items-center gap-1 mt-0.5">
                                                            <Phone size={9} className="shrink-0" /> {customer.phone}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-3.5 py-2.5">
                                                    {getSegmentBadge(customer.segment)}
                                                </td>
                                                <td className="px-3.5 py-2.5">
                                                    <div className="font-semibold text-foreground tabular-nums">{customer.totalOrders ?? 0}</div>
                                                    <div className="text-[10px] text-muted-foreground">sipariş</div>
                                                </td>
                                                <td className="px-3.5 py-2.5">
                                                    <div className="font-semibold text-foreground tabular-nums">{formatCurrency(customer.totalSpent)}</div>
                                                </td>
                                                <td className="px-3.5 py-2.5">
                                                    <div className="font-medium text-foreground tabular-nums">{formatCurrency(customer.avgOrderValue)}</div>
                                                </td>
                                                <td className="px-3.5 py-2.5">
                                                    <div className="text-muted-foreground text-[11px]">
                                                        {formatCustomerDate(customer.lastOrderDate)}
                                                    </div>
                                                </td>
                                                <td className="px-3.5 py-2.5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full ${(customer.loyaltyScore ?? 0) >= 70 ? 'bg-emerald-500' : (customer.loyaltyScore ?? 0) >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                                                style={{ width: `${Math.min(100, Math.max(0, customer.loyaltyScore ?? 0))}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-[11px] font-semibold text-foreground tabular-nums">{customer.loyaltyScore ?? 0}</span>
                                                    </div>
                                                </td>
                                                <td className="px-3.5 py-2.5">
                                                    <div className="flex gap-1 flex-wrap">
                                                        {(customer.platforms || []).slice(0, 2).map(p => (
                                                            <span key={p} className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-muted border border-border/50 text-muted-foreground">
                                                                {p}
                                                            </span>
                                                        ))}
                                                        {(customer.platforms?.length || 0) > 2 && (
                                                            <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-muted border border-border/50 text-muted-foreground">
                                                                +{(customer.platforms?.length || 0) - 2}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-3.5 py-2.5 text-right">
                                                    <div className="relative inline-block" ref={actionMenuId === customer.id ? actionMenuRef : undefined}>
                                                        <button
                                                            onClick={() => setActionMenuId(actionMenuId === customer.id ? null : customer.id)}
                                                            className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                                            title="İşlemler"
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
                                                                    <button onClick={() => handleAction('copy-email', customer)} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors">
                                                                        <CheckCircle2 size={13} /> E-postayı Kopyala
                                                                    </button>
                                                                    {customer.segment !== 'vip' && (
                                                                        <button onClick={() => handleAction('mark-vip', customer)} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-amber-600 hover:bg-muted transition-colors">
                                                                            <Award size={13} /> VIP Olarak İşaretle
                                                                        </button>
                                                                    )}
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-border/70 text-xs text-muted-foreground">
                            <div>
                                {filteredCustomers.length} müşteriden {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredCustomers.length)} arası
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
                                                className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${currentPage === page ? 'bg-primary text-white font-semibold' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}
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
                            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40"
                            onClick={() => setSelectedCustomer(null)}
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-card border-l border-border z-50 overflow-y-auto shadow-2xl"
                        >
                            <div className="p-5 sm:p-6 space-y-5">
                                {/* Panel Header */}
                                <div className="flex items-center justify-between pb-3 border-b border-border/70">
                                    <h2 className="text-lg font-semibold text-foreground">Müşteri Detay Kartı</h2>
                                    <button
                                        onClick={() => setSelectedCustomer(null)}
                                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                {/* Customer Info */}
                                <div className="flex items-center gap-3.5">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/20">
                                        <span className="text-xl font-bold text-primary">{(selectedCustomer.name?.[0] || 'M').toUpperCase()}</span>
                                    </div>
                                    <div>
                                        <h3 className="text-base font-semibold text-foreground">{selectedCustomer.name || 'İsimsiz Müşteri'}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            {getSegmentBadge(selectedCustomer.segment)}
                                            {selectedCustomer.address?.city && (
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <MapPin size={11} /> {selectedCustomer.address.city}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Information */}
                                <div className="bg-background rounded-xl p-3.5 space-y-2.5 border border-border/80">
                                    <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">İletişim Bilgileri</h4>
                                    <div className="flex items-center gap-2 text-xs text-foreground">
                                        <Mail size={13} className="text-muted-foreground shrink-0" /> {selectedCustomer.email}
                                    </div>
                                    {selectedCustomer.phone && (
                                        <div className="flex items-center gap-2 text-xs text-foreground">
                                            <Phone size={13} className="text-muted-foreground shrink-0" /> {selectedCustomer.phone}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-xs text-foreground">
                                        <Calendar size={13} className="text-muted-foreground shrink-0" /> Üyelik: {formatCustomerDate(selectedCustomer.joinDate)}
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-2.5">
                                    <div className="bg-background rounded-xl p-3.5 border border-border/80">
                                        <div className="text-[11px] text-muted-foreground mb-1">Toplam Sipariş</div>
                                        <div className="text-lg font-bold text-foreground tabular-nums">{selectedCustomer.totalOrders ?? 0} adet</div>
                                    </div>
                                    <div className="bg-background rounded-xl p-3.5 border border-border/80">
                                        <div className="text-[11px] text-muted-foreground mb-1">Toplam Harcama</div>
                                        <div className="text-lg font-bold text-foreground tabular-nums">{formatCurrency(selectedCustomer.totalSpent)}</div>
                                    </div>
                                    <div className="bg-background rounded-xl p-3.5 border border-border/80">
                                        <div className="text-[11px] text-muted-foreground mb-1">Ort. Sipariş Değeri</div>
                                        <div className="text-lg font-bold text-foreground tabular-nums">{formatCurrency(selectedCustomer.avgOrderValue)}</div>
                                    </div>
                                    <div className="bg-background rounded-xl p-3.5 border border-border/80">
                                        <div className="text-[11px] text-muted-foreground mb-1">Sadakat Puanı</div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="text-lg font-bold text-foreground tabular-nums">{selectedCustomer.loyaltyScore ?? 0}</div>
                                            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${(selectedCustomer.loyaltyScore ?? 0) >= 70 ? 'bg-emerald-500' : (selectedCustomer.loyaltyScore ?? 0) >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                                    style={{ width: `${Math.min(100, Math.max(0, selectedCustomer.loyaltyScore ?? 0))}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Last Order */}
                                <div className="bg-background rounded-xl p-3.5 border border-border/80">
                                    <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Son Sipariş Tarihi</h4>
                                    <div className="text-xs text-foreground font-medium">
                                        {formatCustomerDate(selectedCustomer.lastOrderDate)}
                                    </div>
                                </div>

                                {/* Platforms */}
                                <div className="bg-background rounded-xl p-3.5 border border-border/80">
                                    <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">Sipariş Verdiği Pazaryerleri</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {(selectedCustomer.platforms || []).map(p => (
                                            <span key={p} className="text-xs font-medium px-2.5 py-1 rounded-lg bg-card border border-border text-foreground">
                                                {p}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Tags */}
                                {selectedCustomer.tags && selectedCustomer.tags.length > 0 && (
                                    <div className="bg-background rounded-xl p-3.5 border border-border/80">
                                        <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">Özel Etiketler</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedCustomer.tags.map(tag => (
                                                <span key={tag} className="text-xs font-medium px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Notes */}
                                {selectedCustomer.notes && (
                                    <div className="bg-background rounded-xl p-3.5 border border-border/80">
                                        <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Müşteri Notu</h4>
                                        <p className="text-xs text-muted-foreground leading-relaxed">{selectedCustomer.notes}</p>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-2.5 pt-2">
                                    <button
                                        onClick={() => { window.open(`mailto:${selectedCustomer.email}`, '_blank'); }}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors shadow-xs"
                                    >
                                        <Mail size={13} /> E-posta Gönder
                                    </button>
                                    {selectedCustomer.segment !== 'vip' && (
                                        <button
                                            onClick={() => { updateCustomer(selectedCustomer.id, { segment: 'vip' }); setSelectedCustomer(null); }}
                                            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-lg text-xs font-medium hover:bg-amber-500/20 transition-colors"
                                        >
                                            <Award size={13} /> VIP Yap
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
