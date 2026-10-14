"use client";

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Eye,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Mail,
  RefreshCw,
} from 'lucide-react';
import { useInvoices } from '@/lib/hooks';
import { REALISTIC_INVOICES } from '@/lib/marketplace-seed-data';
import { PLATFORM_COLORS } from '@/components/dashboard/dashboard-ui';

interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  status: 'PAID' | 'PENDING' | 'DRAFT' | 'CANCELLED';
  order?: {
    customerName?: string;
    marketplaceOrderId?: string;
    platform?: string;
    totalAmount?: number | string;
  };
}

export default function InvoicesPage() {
  const { getInvoices, loading } = useInvoices();
  const [invoices, setInvoices] = useState<Invoice[]>(REALISTIC_INVOICES as Invoice[]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadInvoices = async () => {
    const response = (await getInvoices()) as Invoice[] | null;
    if (response && response.length > 0) {
      setInvoices(response);
    } else {
      setInvoices(REALISTIC_INVOICES as Invoice[]);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.order?.totalAmount || 0), 0);
  const paidAmount = invoices.filter((inv) => inv.status === 'PAID').reduce((sum, inv) => sum + Number(inv.order?.totalAmount || 0), 0);
  const pendingAmount = invoices.filter((inv) => inv.status === 'PENDING' || inv.status === 'DRAFT').reduce((sum, inv) => sum + Number(inv.order?.totalAmount || 0), 0);
  const cancelledAmount = invoices.filter((inv) => inv.status === 'CANCELLED').reduce((sum, inv) => sum + Number(inv.order?.totalAmount || 0), 0);

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.order?.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.order?.marketplaceOrderId || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 size={11} /> Ödendi
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock size={11} /> Beklemede
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            Taslak
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <XCircle size={11} /> İptal
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground border border-border">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <h1 className="text-xl lg:text-2xl font-semibold text-foreground tracking-tight">
              Faturalar & E-Arşiv
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            GİB ve pazaryeri e-fatura / e-arşiv dökümanlarınızın takibi ve yönetimi.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-card hover:bg-muted border border-border/70 rounded-lg text-xs font-medium text-foreground transition-colors shadow-2xs"
          >
            <Download size={13} />
            <span>Toplu İndir</span>
          </button>
          <button
            type="button"
            onClick={loadInvoices}
            className="p-1.5 bg-card hover:bg-muted border border-border/70 rounded-lg text-muted-foreground hover:text-foreground transition-colors shadow-2xs"
            title="Yenile"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <div className="dash-card p-3.5 sm:p-4 rounded-xl border border-border/70 bg-card shadow-2xs">
          <p className="text-[11px] font-medium text-muted-foreground mb-1">Toplam Düzenlenen</p>
          <p className="text-lg sm:text-xl font-semibold text-foreground tracking-tight tabular-nums">
            ₺{totalInvoiced.toLocaleString('tr-TR')}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">{invoices.length} adet fatura</p>
        </div>

        <div className="dash-card p-3.5 sm:p-4 rounded-xl border border-border/70 bg-card shadow-2xs">
          <p className="text-[11px] font-medium text-muted-foreground mb-1">Tahsil Edilen</p>
          <p className="text-lg sm:text-xl font-semibold text-emerald-600 dark:text-emerald-400 tracking-tight tabular-nums">
            ₺{paidAmount.toLocaleString('tr-TR')}
          </p>
          <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-1">
            {invoices.filter((i) => i.status === 'PAID').length} ödendi
          </p>
        </div>

        <div className="dash-card p-3.5 sm:p-4 rounded-xl border border-border/70 bg-card shadow-2xs">
          <p className="text-[11px] font-medium text-muted-foreground mb-1">Bekleyen</p>
          <p className="text-lg sm:text-xl font-semibold text-amber-600 dark:text-amber-400 tracking-tight tabular-nums">
            ₺{pendingAmount.toLocaleString('tr-TR')}
          </p>
          <p className="text-[10px] text-amber-600/80 dark:text-amber-400/80 mt-1">
            {invoices.filter((i) => i.status === 'PENDING' || i.status === 'DRAFT').length} işlemde
          </p>
        </div>

        <div className="dash-card p-3.5 sm:p-4 rounded-xl border border-border/70 bg-card shadow-2xs">
          <p className="text-[11px] font-medium text-muted-foreground mb-1">İptal Edilen</p>
          <p className="text-lg sm:text-xl font-semibold text-rose-600 dark:text-rose-400 tracking-tight tabular-nums">
            ₺{cancelledAmount.toLocaleString('tr-TR')}
          </p>
          <p className="text-[10px] text-rose-600/80 dark:text-rose-400/80 mt-1">
            {invoices.filter((i) => i.status === 'CANCELLED').length} iptal
          </p>
        </div>
      </div>

      {/* Filter and Invoices List */}
      <div className="rounded-xl border border-border/70 bg-card shadow-2xs overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-border/60 bg-muted/20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Fatura No, müşteri veya sipariş ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-background border border-border/70 rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['all', 'PAID', 'PENDING', 'DRAFT'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  statusFilter === st
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {st === 'all'
                  ? 'Tümü'
                  : st === 'PAID'
                    ? 'Ödenenler'
                    : st === 'PENDING'
                      ? 'Bekleyenler'
                      : 'Taslak'}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile View: Cards */}
        <div className="block lg:hidden divide-y divide-border/60">
          {filteredInvoices.map((inv) => (
            <div key={inv.id} className="p-3.5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-semibold text-amber-600 dark:text-amber-400">
                  {inv.invoiceNumber}
                </span>
                {getStatusBadge(inv.status)}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">{inv.order?.customerName || 'Müşteri'}</span>
                <span className="font-semibold text-foreground tabular-nums">
                  ₺{Number(inv.order?.totalAmount || 0).toLocaleString('tr-TR')}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                <span className="inline-flex items-center gap-1">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      PLATFORM_COLORS[inv.order?.platform || ''] || 'bg-slate-400'
                    }`}
                  />
                  <span>{inv.order?.platform || 'Pazaryeri'}</span>
                  <span>(#{inv.order?.marketplaceOrderId})</span>
                </span>
                <span>{new Date(inv.invoiceDate).toLocaleDateString('tr-TR')}</span>
              </div>
              <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-border/40">
                <button
                  type="button"
                  className="px-2 py-1 rounded-md border border-border/60 text-[11px] font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  <Eye size={12} /> Görüntüle
                </button>
                <button
                  type="button"
                  className="px-2 py-1 rounded-md border border-border/60 text-[11px] font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  <Download size={12} /> PDF
                </button>
              </div>
            </div>
          ))}
          {filteredInvoices.length === 0 && (
            <div className="p-8 text-center text-xs text-muted-foreground">Kayıtlı fatura bulunamadı.</div>
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/40 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/70">
                <th className="text-left py-2.5 px-3.5">Fatura No</th>
                <th className="text-left py-2.5 px-3.5">Müşteri & Sipariş</th>
                <th className="text-left py-2.5 px-3.5">Pazaryeri</th>
                <th className="text-left py-2.5 px-3.5">Tarih</th>
                <th className="text-right py-2.5 px-3.5">Tutar</th>
                <th className="text-center py-2.5 px-3.5">Durum</th>
                <th className="text-right py-2.5 px-3.5">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="transition-colors hover:bg-muted/25">
                  <td className="py-2.5 px-3.5 font-medium font-mono text-amber-600 dark:text-amber-400">
                    {invoice.invoiceNumber}
                  </td>
                  <td className="py-2.5 px-3.5">
                    <div className="font-medium text-foreground">{invoice.order?.customerName || 'Müşteri'}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">
                      #{invoice.order?.marketplaceOrderId}
                    </div>
                  </td>
                  <td className="py-2.5 px-3.5">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          PLATFORM_COLORS[invoice.order?.platform || ''] || 'bg-slate-400'
                        }`}
                      />
                      <span className="font-medium text-foreground">{invoice.order?.platform || '—'}</span>
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 text-muted-foreground tabular-nums">
                    {new Date(invoice.invoiceDate).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-medium tabular-nums text-foreground">
                    ₺{Number(invoice.order?.totalAmount || 0).toLocaleString('tr-TR')}
                  </td>
                  <td className="py-2.5 px-3.5 text-center">{getStatusBadge(invoice.status)}</td>
                  <td className="py-2.5 px-3.5 text-right">
                    <div className="flex items-center justify-end gap-1 text-muted-foreground">
                      <button
                        type="button"
                        className="p-1 rounded-md hover:bg-muted hover:text-foreground transition-colors"
                        title="Görüntüle"
                      >
                        <Eye size={13} />
                      </button>
                      <button
                        type="button"
                        className="p-1 rounded-md hover:bg-muted hover:text-foreground transition-colors"
                        title="İndir"
                      >
                        <Download size={13} />
                      </button>
                      <button
                        type="button"
                        className="p-1 rounded-md hover:bg-muted hover:text-foreground transition-colors"
                        title="E-posta Gönder"
                      >
                        <Mail size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-muted-foreground">
                    Filtreye uygun fatura bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
