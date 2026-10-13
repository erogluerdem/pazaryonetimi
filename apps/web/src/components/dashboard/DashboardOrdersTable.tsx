'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingCart, ExternalLink } from 'lucide-react';
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
        <Link href="/dashboard/orders" className="text-[10px] font-black text-orange-600 hover:text-orange-500 flex items-center gap-1">
          Tümü <ExternalLink size={10} />
        </Link>
      }
      className="lg:col-span-2"
    >
      <div className="overflow-x-auto rounded-xl border border-border/80 bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/80">
              <th className="text-left py-2.5 px-3">Sipariş</th>
              <th className="text-left py-2.5 px-3">Platform</th>
              <th className="text-left py-2.5 px-3 hidden sm:table-cell">Müşteri</th>
              <th className="text-right py-2.5 px-3">Tutar</th>
              <th className="text-left py-2.5 px-3">Durum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {rows.map((order, i) => (
              <tr key={`${order.id}-${i}`} className="transition-colors hover:bg-muted/40">
                <td className="py-3 px-3 font-semibold text-foreground text-xs">#{order.id}</td>
                <td className="py-3 px-3">
                  <span className="inline-flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${PLATFORM_COLORS[order.platform] || 'bg-slate-400'}`} />
                    <span className="font-medium text-xs text-foreground">{order.platform}</span>
                  </span>
                </td>
                <td className="py-3 px-3 text-muted-foreground text-xs hidden sm:table-cell truncate max-w-[140px]">
                  {order.customer || order.product || '—'}
                </td>
                <td className="py-3 px-3 text-right font-semibold tabular-nums text-foreground text-xs">
                  ₺{(order.price ?? 0).toLocaleString('tr-TR')}
                </td>
                <td className="py-3 px-3">
                  <StatusPill status={order.status} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-muted-foreground text-xs">
                  Henüz sipariş bulunmuyor
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardCard>
  );
}
