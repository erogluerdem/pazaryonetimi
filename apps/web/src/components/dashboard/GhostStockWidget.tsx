'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Package, AlertTriangle, TrendingUp, Calendar, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useStockAlerts } from '@/lib/hooks';

interface GhostStock {
  id: string;
  product: string;
  stock: number;
  daysLeft: number;
  predictionDate: string;
  velocity: number;
}

export const GhostStockWidget = () => {
  const { data: stockAlerts } = useStockAlerts();

  const predictions: GhostStock[] = React.useMemo(() => {
    if (!stockAlerts || !Array.isArray(stockAlerts)) return [];

    return stockAlerts
      .filter((alert: any) => alert.daysUntilStockout && alert.daysUntilStockout <= 7)
      .slice(0, 2)
      .map((alert: any, idx: number) => {
        const daysLeft = alert.daysUntilStockout || 1;
        const predictionDate = new Date();
        predictionDate.setDate(predictionDate.getDate() + daysLeft);

        return {
          id: alert.id || `${idx}`,
          product: alert.productName || alert.product || 'Bilinmeyen Ürün',
          stock: alert.currentStock || 0,
          daysLeft,
          predictionDate: predictionDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
          velocity: alert.velocity || Math.round((alert.currentStock || 0) / Math.max(daysLeft, 1)),
        };
      });
  }, [stockAlerts]);

  return (
    <div className="dash-card rounded-xl border border-border/70 bg-card p-5 lg:p-6 relative overflow-hidden h-full flex flex-col shadow-xs">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-muted/60 text-muted-foreground border border-border/40 flex items-center justify-center shrink-0">
            <Package className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground tracking-tight truncate">Tükenme Riski Olan Stoklar</h3>
            <p className="text-[11px] text-muted-foreground truncate">Tahmini tükenme hızı</p>
          </div>
        </div>
        {predictions.length > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            {predictions.length} Ürün Kritik
          </span>
        )}
      </div>

      <div className="space-y-3 relative z-10 flex-1">
        {predictions.length > 0 ? (
          predictions.map((p) => (
            <div
              key={p.id}
              className="p-3.5 bg-muted/30 border border-border/60 rounded-lg hover:border-border transition-colors group/item"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="min-w-0 flex-1 pr-2">
                  <div className="text-xs font-semibold text-foreground group-hover/item:text-indigo-600 dark:group-hover/item:text-indigo-400 transition-colors truncate">
                    {p.product}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <TrendingUp size={11} className="text-indigo-500" />
                      <span>{p.velocity} adet/gün</span>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                    {p.daysLeft} gün kaldı
                  </div>
                </div>
              </div>

              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-2.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((p.stock / (p.velocity * 10)) * 100, 100)}%` }}
                  className="h-full bg-indigo-600 rounded-full"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar size={11} />
                  <span>Tahmini: {p.predictionDate}</span>
                </div>
                <span className="font-medium text-foreground">Stok: {p.stock} adet</span>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground">
            <CheckCircle2 className="w-8 h-8 mb-2 text-emerald-500/60" />
            <p className="text-xs font-medium">Kritik stok seviyesinde ürün bulunmuyor</p>
          </div>
        )}
      </div>

      <div className="mt-4 p-3 rounded-lg border border-border/60 bg-muted/20">
        <div className="flex items-center gap-2">
          {predictions.length > 0 ? (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          )}
          <p className="text-xs text-muted-foreground">
            {predictions.length > 0
              ? `${predictions.length} ürün için tedarik siparişi oluşturulması önerilir.`
              : 'Envanter dengesi tüm kanallarda stabil durumda.'}
          </p>
        </div>
      </div>
    </div>
  );
};
