'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, TrendingUp, ShoppingBag } from 'lucide-react';
import { useTenantId } from '@/lib/tenant';

interface BriefingData {
  message: string;
  stats: {
    revenue: number;
    orders: number;
    stockAlerts: number;
  };
}

export const MorningBriefing = ({ onClose }: { onClose: () => void }) => {
  const tenantId = useTenantId();
  const [data, setData] = useState<BriefingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBriefing = async () => {
      try {
        const res = await fetch('/api/ai/briefing', {
          headers: tenantId ? { 'x-tenant-id': tenantId } : {},
        });
        if (!res.ok) {
          setData({
            message: 'Pazar Yönetimi kontrol merkeziniz aktif. Siparişleriniz ve envanteriniz anlık olarak takip ediliyor.',
            stats: { revenue: 0, orders: 0, stockAlerts: 0 },
          });
          return;
        }
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          setData({
            message: 'Pazar Yönetimi kontrol merkeziniz aktif.',
            stats: { revenue: 0, orders: 0, stockAlerts: 0 },
          });
          return;
        }
        const briefing = await res.json();
        setData(briefing);
      } catch {
        setData({
          message: 'Pazar Yönetimi kontrol merkeziniz aktif.',
          stats: { revenue: 0, orders: 0, stockAlerts: 0 },
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBriefing();
  }, [tenantId]);

  if (loading || !data) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="fixed top-20 right-4 sm:right-8 z-50 w-[calc(100%-2rem)] sm:w-auto sm:max-w-md"
    >
      <div className="bg-card/95 backdrop-blur-xl border border-border/80 rounded-xl shadow-lg overflow-hidden p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-foreground tracking-tight">Günlük Durum Özeti</h4>
              <p className="text-[10px] text-muted-foreground">Mağazanızın son 24 saatlik performansı</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Kapat"
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40">
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground mb-0.5">
              <TrendingUp className="w-3 h-3 text-emerald-500" />
              <span>Dünkü Ciro</span>
            </div>
            <div className="text-sm font-semibold text-foreground tabular-nums">
              ₺{(data?.stats?.revenue ?? 0).toLocaleString('tr-TR')}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40">
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground mb-0.5">
              <ShoppingBag className="w-3 h-3 text-blue-500" />
              <span>Sipariş</span>
            </div>
            <div className="text-sm font-semibold text-foreground tabular-nums">
              {data?.stats?.orders ?? 0} adet
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed pl-2 border-l-2 border-indigo-500/40">
          {data?.message}
        </p>

        <div className="flex items-center justify-end pt-1">
          <button
            onClick={onClose}
            className="px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
          >
            Anladım
          </button>
        </div>
      </div>
    </motion.div>
  );
};
