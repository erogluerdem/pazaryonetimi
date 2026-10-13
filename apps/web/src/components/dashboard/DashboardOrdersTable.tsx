'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingCart, ArrowUpRight } from 'lucide-react';
import { DashboardCard, PLATFORM_COLORS, StatusPill } from './dashboard-ui';

type OrderRow = {
  id: string | number;
  platform: string;
  price?: number;
  status: string;
  customer?: string;
  product?: string;
};

export function DashboardOrdersTable({
  orders,
  loading,
}: {
  orders?: OrderRow[];
  loading?: boolean;
}) {
  const rows = orders || [];

  return (
    <DashboardCard
      title="Son Siparişler"
      icon={ShoppingCart}
      loading={loading}
      action={
        <Link
          href="/dashboard/orders"
          className="text-xs font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
        >
          <span>Tüm Siparişler</span>
          <ArrowUpRight size={13} />
        </Link>
      }
      className="lg:col-span-2"
    >
      <div className="overflow-x-auto rounded-lg border border-border/70 bg-card">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/40 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/70">
              <th className="text-left py-2.5 px-3.5">Sipariş No</th>
              <th className="text-left py-2.5 px-3.5">Pazaryeri</th>
              <th className="text-left py-2.5 px-3.5 hidden sm:table-cell">Müşteri</th>
              <th className="text-right py-2.5 px-3.5">Tutar</th>
              <th className="text-left py-2.5 px-3.5">Durum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {rows.map((order, i) => (
              <tr key={`${order.id}-${i}`} className="transition-colors hover:bg-muted/30">
                <td className="py-2.5 px-3.5 font-medium text-foreground font-mono">#{order.id}</td>
                <td className="py-2.5 px-3.5">
                  <span className="inline-flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${PLATFORM_COLORS[order.platform] || 'bg-slate-400'}`} />
                    <span className="font-medium text-foreground">{order.platform}</span>
                  </span>
                </td>
                <td className="py-2.5 px-3.5 text-muted-foreground hidden sm:table-cell truncate max-w-[140px]">
                  {order.customer || order.product || '—'}
                </td>
                <td className="py-2.5 px-3.5 text-right font-medium tabular-nums text-foreground">
                  ₺{(order.price ?? 0).toLocaleString('tr-TR')}
                </td>
                <td className="py-2.5 px-3.5">
                  <StatusPill status={order.status} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted-foreground text-xs">
                  Henüz gelen sipariş bulunmuyor
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardCard>
  );
}
