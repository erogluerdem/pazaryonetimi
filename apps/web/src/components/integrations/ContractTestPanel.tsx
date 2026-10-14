'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Play,
  RotateCw,
  Zap,
  Package,
  ShoppingCart,
  Layers,
  Clock,
  Lock,
  Unlock,
} from 'lucide-react';

interface CheckItem {
  passed: boolean;
  durationMs: number;
  message: string;
  sampleCount?: number;
}

interface ContractResult {
  providerId: string;
  platform: string;
  isCoreProvider: boolean;
  overallPassed: boolean;
  timestamp: string;
  totalDurationMs: number;
  checks: {
    authHandshake: CheckItem;
    productSchema: CheckItem;
    orderSchema: CheckItem;
    stockProbe: CheckItem;
  };
  gateStatus?: {
    canActivateTier2Providers: boolean;
    failingCoreProviders: string[];
    message: string;
  };
}

interface GateStatus {
  canActivateTier2Providers: boolean;
  failingCoreProviders: string[];
  message: string;
}

export function ContractTestPanel({ activeIntegrations }: { activeIntegrations: any[] }) {
  const [gate, setGate] = useState<GateStatus | null>(null);
  const [results, setResults] = useState<Record<string, ContractResult>>({});
  const [runningProviders, setRunningProviders] = useState<Set<string>>(new Set());
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGate = async () => {
    try {
      const res = await fetch('/api/integrations-hub/contract-test/gate');
      if (res.ok) {
        const data = await res.json();
        setGate(data);
      }
    } catch {
      // Non-blocking
    }
  };

  useEffect(() => {
    fetchGate();
    // Load cached test results from integration metadata
    const cached: Record<string, ContractResult> = {};
    for (const item of activeIntegrations) {
      const extra = (item.apiExtra as Record<string, any>) || {};
      if (extra.lastContractTest) {
        cached[item.platform.toLowerCase()] = extra.lastContractTest;
      }
    }
    setResults(cached);
  }, [activeIntegrations]);

  const runTestForProvider = async (providerId: string, integrationId?: string) => {
    setRunningProviders((prev) => new Set(prev).add(providerId.toLowerCase()));
    setError(null);
    try {
      const res = await fetch('/api/integrations-hub/contract-test/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId: providerId.toLowerCase(), integrationId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Test çalıştırılamadı');

      setResults((prev) => ({
        ...prev,
        [providerId.toLowerCase()]: data,
      }));
      await fetchGate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sözleşme testi hatası');
    } finally {
      setRunningProviders((prev) => {
        const next = new Set(prev);
        next.delete(providerId.toLowerCase());
        return next;
      });
    }
  };

  const runAllTests = async () => {
    setIsRunningAll(true);
    setError(null);
    try {
      const res = await fetch('/api/integrations-hub/contract-test/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Toplu test çalıştırılamadı');

      const mapped: Record<string, ContractResult> = {};
      if (Array.isArray(data.results)) {
        for (const r of data.results) {
          mapped[r.providerId.toLowerCase()] = r;
        }
      }
      setResults(mapped);
      if (data.gateStatus) setGate(data.gateStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Toplu sözleşme testi hatası');
    } finally {
      setIsRunningAll(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Gatekeeper Banner */}
      <div
        className={`p-5 rounded-2xl border ${
          gate?.canActivateTier2Providers
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
        } space-y-2`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {gate?.canActivateTier2Providers ? (
              <Unlock className="text-emerald-400" size={22} />
            ) : (
              <Lock className="text-amber-400" size={22} />
            )}
            <h3 className="font-bold text-base text-white">
              {gate?.canActivateTier2Providers
                ? 'Temel Pazaryeri Kapısı Açık (Core Verified)'
                : 'Temel Pazaryeri Doğrulaması Gerekiyor (Core Gate)'}
            </h3>
          </div>
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full border ${
              gate?.canActivateTier2Providers
                ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                : 'border-amber-500/40 bg-amber-500/20 text-amber-300'
            }`}
          >
            {gate?.canActivateTier2Providers ? 'Tier 2 Sağlayıcılar Aktif Edilebilir' : 'Kademeli Aktivasyon Kilitli'}
          </span>
        </div>
        <p className="text-xs text-slate-300">
          {gate?.message ||
            'Temel pazaryerlerinin (Trendyol, Hepsiburada, Amazon, N11) ürün, sipariş ve stok akışları tam doğrulanmadan yeni sağlayıcılar açılmaz.'}
        </p>
      </div>

      {/* Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="text-primary" size={20} />
            Sağlayıcı Sözleşme & Sağlık Testleri
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Her sağlayıcının API sözleşmesi (Auth, Ürün Şeması, Sipariş Şeması, Stok Probu) canlıda test edilir.
          </p>
        </div>

        <button
          onClick={runAllTests}
          disabled={isRunningAll || !activeIntegrations.length}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
        >
          <Play size={14} className={isRunningAll ? 'animate-spin' : ''} />
          {isRunningAll ? 'Testler Çalıştırılıyor...' : 'Tüm Aktif Sağlayıcıları Test Et'}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Providers Test Cards */}
      {!activeIntegrations.length ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card/40 space-y-3">
          <Zap className="mx-auto text-slate-600" size={32} />
          <p className="text-sm font-semibold text-foreground">Henüz aktif mağaza bağlantısı yok</p>
          <p className="text-xs text-slate-500">
            Sözleşme testlerini çalıştırmak için önce &quot;Pazaryerleri&quot; sekmesinden mağaza bilgilerinizi bağlayın.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeIntegrations.map((item) => {
            const pid = item.platform.toLowerCase();
            const result = results[pid];
            const isRunning = runningProviders.has(pid);
            const isCore = ['trendyol', 'hepsiburada', 'amazon', 'amazon-tr', 'n11'].includes(pid);

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-sm"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-sm text-foreground">{item.platform}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isCore
                          ? 'border-blue-500/30 bg-blue-500/10 text-blue-400'
                          : 'border-purple-500/30 bg-purple-500/10 text-purple-400'
                      }`}
                    >
                      {isCore ? 'Core Tier' : 'Expanded Tier'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {result && (
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                          result.overallPassed
                            ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                            : 'border-red-500/30 text-red-400 bg-red-500/10'
                        }`}
                      >
                        {result.overallPassed ? (
                          <>
                            <CheckCircle2 size={12} /> Sözleşme Doğrulandı
                          </>
                        ) : (
                          <>
                            <XCircle size={12} /> Hata Mevcut
                          </>
                        )}
                      </span>
                    )}

                    <button
                      onClick={() => runTestForProvider(item.platform, item.id)}
                      disabled={isRunning || isRunningAll}
                      className="p-1.5 rounded-lg border border-border hover:bg-muted text-slate-400 hover:text-foreground transition-all disabled:opacity-50"
                      title="Testi Çalıştır"
                    >
                      <RotateCw size={14} className={isRunning ? 'animate-spin text-primary' : ''} />
                    </button>
                  </div>
                </div>

                {/* 4 Contract Step Checks */}
                {result ? (
                  <div className="space-y-2 text-xs">
                    {/* Check 1: Auth Handshake */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/50">
                      <div className="flex items-center gap-2">
                        {result.checks.authHandshake.passed ? (
                          <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle size={14} className="text-red-400 shrink-0" />
                        )}
                        <div>
                          <p className="font-semibold text-foreground">1. API Auth Handshake</p>
                          <p className="text-[11px] text-slate-400">{result.checks.authHandshake.message}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        {result.checks.authHandshake.durationMs}ms
                      </span>
                    </div>

                    {/* Check 2: Product Schema */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/50">
                      <div className="flex items-center gap-2">
                        {result.checks.productSchema.passed ? (
                          <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle size={14} className="text-red-400 shrink-0" />
                        )}
                        <div>
                          <p className="font-semibold text-foreground">2. Ürün Akışı Şeması</p>
                          <p className="text-[11px] text-slate-400">{result.checks.productSchema.message}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        {result.checks.productSchema.durationMs}ms
                      </span>
                    </div>

                    {/* Check 3: Order Schema */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/50">
                      <div className="flex items-center gap-2">
                        {result.checks.orderSchema.passed ? (
                          <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle size={14} className="text-red-400 shrink-0" />
                        )}
                        <div>
                          <p className="font-semibold text-foreground">3. Sipariş Akışı Şeması</p>
                          <p className="text-[11px] text-slate-400">{result.checks.orderSchema.message}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        {result.checks.orderSchema.durationMs}ms
                      </span>
                    </div>

                    {/* Check 4: Stock Probe */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/50">
                      <div className="flex items-center gap-2">
                        {result.checks.stockProbe.passed ? (
                          <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle size={14} className="text-red-400 shrink-0" />
                        )}
                        <div>
                          <p className="font-semibold text-foreground">4. Stok Senkronizasyon Probu</p>
                          <p className="text-[11px] text-slate-400">{result.checks.stockProbe.message}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        {result.checks.stockProbe.durationMs}ms
                      </span>
                    </div>

                    <div className="pt-2 flex items-center justify-between text-[10px] text-slate-500 border-t border-border/40">
                      <span>Son Test: {new Date(result.timestamp).toLocaleTimeString('tr-TR')}</span>
                      <span>Toplam Yanıt: {result.totalDurationMs}ms</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-border rounded-xl">
                    Bu sağlayıcı için henüz sözleşme testi çalıştırılmadı. Sağ üstteki yenile butonuna basarak testi başlatabilirsiniz.
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
