'use client';

import React from 'react';
import Link from 'next/link';
import { RefreshCw, AlertCircle, CheckCircle2, Globe, ArrowUpRight } from 'lucide-react';

export type SyncQueueItem = {
  id: string;
  platform: string;
  isActive: boolean;
  lastSync: string;
  status: string;
};

interface SyncQueuePanelProps {
  items: SyncQueueItem[];
  loading?: boolean;
  onRetry?: (id: string) => void;
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Az önce';
  if (mins < 60) return `${mins} dk önce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} sa önce`;
  return `${Math.floor(hours / 24)} gün önce`;
}

export function SyncQueuePanel({ items, loading, onRetry }: SyncQueuePanelProps) {
  return (
    <div className="dash-card p-5 lg:p-6 rounded-xl border border-border/70 bg-card shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-muted/60 text-muted-foreground border border-border/40 flex items-center justify-center shrink-0">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground tracking-tight">Senkron Kuyruğu</h3>
            <p className="text-[11px] text-muted-foreground">Pazaryeri bağlantı durumları</p>
          </div>
        </div>
        <Link
          href="/dashboard/settings/integrations"
          className="text-xs font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
        >
          <span>Yönet</span>
          <ArrowUpRight size={13} />
        </Link>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-muted-foreground">
          <RefreshCw className="w-3.5 h-3.5 animate-spin inline mr-2 text-muted-foreground" />
          Yükleniyor...
        </div>
      ) : items.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-xs font-medium text-foreground mb-1">Bağlı entegrasyon yok</p>
          <p className="text-[11px] text-muted-foreground mb-3">Pazaryeri bağlantısı ekleyerek otomatik senkronizasyonu başlatın.</p>
          <Link
            href="/dashboard/settings/integrations"
            className="inline-flex px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-500 transition-colors shadow-xs"
          >
            Entegrasyon Ekle
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const healthy = item.isActive && item.status === 'connected';
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 border border-border/60 hover:bg-muted/50 transition-colors"
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${healthy ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground">{item.platform}</p>
                  <p className="text-[11px] text-muted-foreground">Son senkron: {formatRelative(item.lastSync)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {healthy ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  )}
                  {onRetry && (
                    <button
                      type="button"
                      onClick={() => onRetry(item.id)}
                      className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Yeniden dene"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
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
