'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, CheckCircle, Truck, Package, XCircle, RefreshCw, ArrowUpRight } from 'lucide-react';
import type { Order } from '@/lib/hooks';

const COLUMNS = [
  { key: 'PENDING', label: 'Bekleyen', icon: Clock, badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20', iconColor: 'text-amber-500' },
  { key: 'CONFIRMED', label: 'Onaylı', icon: CheckCircle, badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20', iconColor: 'text-blue-500' },
  { key: 'SHIPPED', label: 'Kargoda', icon: Truck, badge: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20', iconColor: 'text-indigo-500' },
  { key: 'DELIVERED', label: 'Teslim Edildi', icon: Package, badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20', iconColor: 'text-emerald-500' },
  { key: 'CANCELLED', label: 'İptal / İade', icon: XCircle, badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20', iconColor: 'text-rose-500' },
] as const;

interface OrderPipelineProps {
  orders: Order[];
  counts?: Record<string, number>;
  onStatusChange?: (orderId: string, status: string) => void;
  loading?: boolean;
}

export function OrderPipeline({ orders = [], counts, onStatusChange, loading }: OrderPipelineProps) {
  const safeOrders = Array.isArray(orders) ? orders : [];
  const byStatus = COLUMNS.map((col) => ({
    ...col,
    count: counts?.[col.key] ?? safeOrders.filter((o) => o.status === col.key).length,
    items: safeOrders.filter((o) => o.status === col.key).slice(0, 5),
  }));

  return (
    <div className="dash-card p-5 lg:p-6 rounded-xl border border-border/70 bg-card shadow-xs">
      <div className="flex items-center justify-between mb-4 gap-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground tracking-tight">Sipariş Akış Takibi</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">Aşama bazlı güncel sipariş durumu</p>
        </div>
        <Link
          href="/dashboard/orders"
          className="text-xs font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors shrink-0"
        >
          <span>Tüm siparişler</span>
          <ArrowUpRight size={13} />
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-8 justify-center">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Yükleniyor...
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {byStatus.map((col) => {
            const Icon = col.icon;
            return (
              <div key={col.key} className="rounded-lg border border-border/60 bg-muted/20 p-3 flex flex-col justify-between min-w-0">
                <div className="flex items-center justify-between gap-1.5 mb-2.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${col.iconColor}`} />
                    <span className="text-xs font-medium text-foreground truncate">{col.label}</span>
                  </div>
                  <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded tabular-nums shrink-0 ${col.badge}`}>
                    {col.count}
                  </span>
                </div>

                <div className="space-y-1.5 min-h-[44px]">
                  {col.items.map((order) => (
                    <button
                      key={order.id}
                      type="button"
                      onClick={() => {
                        const idx = COLUMNS.findIndex((c) => c.key === col.key);
                        const next = COLUMNS[idx + 1];
                        if (next && onStatusChange) onStatusChange(String(order.id), next.key);
                      }}
                      className="w-full text-left p-2 rounded-lg bg-card border border-border/70 hover:border-border transition-colors shadow-xs"
                      title="Sonraki aşamaya taşı"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-[11px] font-medium text-foreground truncate font-mono">#{order.marketplaceOrderId || order.id}</p>
                        <p className="text-[10px] font-semibold text-foreground shrink-0 tabular-nums">₺{Number(order.totalAmount || 0).toLocaleString('tr-TR')}</p>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">{order.customerName || order.platform}</p>
                    </button>
                  ))}
                  {col.items.length === 0 && (
                    <div className="flex items-center justify-center h-full py-2 text-[11px] text-muted-foreground font-medium">
                      Sipariş yok
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
