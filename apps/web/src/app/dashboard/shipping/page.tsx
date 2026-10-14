"use client";

import React, { useState } from 'react';
import {
  Truck,
  Package,
  MapPin,
  Clock,
  CheckCircle2,
  Settings,
  Plus,
  Edit3,
  Trash2,
  Calculator,
  Star,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useShipping } from '@/lib/hooks';
import { REALISTIC_SHIPPING_PROVIDERS } from '@/lib/marketplace-seed-data';

const shippingZones = [
  { id: 1, name: 'Marmara (İstanbul, Bursa, Kocaeli)', provinces: 11, baseCost: 38.0, deliveryTime: '1 Gün' },
  { id: 2, name: 'Ege & İç Anadolu (İzmir, Ankara, Eskişehir)', provinces: 21, baseCost: 42.0, deliveryTime: '1-2 Gün' },
  { id: 3, name: 'Akdeniz & Karadeniz (Antalya, Adana, Trabzon)', provinces: 26, baseCost: 45.0, deliveryTime: '2 Gün' },
  { id: 4, name: 'Doğu & Güneydoğu Anadolu (Diyarbakır, Erzurum)', provinces: 23, baseCost: 49.0, deliveryTime: '2-3 Gün' },
];

const shippingRules = [
  { id: 1, name: '500 TL Üzeri Ücretsiz Kargo', condition: 'Sepet Tutarı >= ₺500', discount: 'Ücretsiz', active: true },
  { id: 2, name: 'Aynı Gün Hızlı Teslimat (Hepsijet)', condition: '14:00 Öncesi Siparişler', discount: '+₺15.00', active: true },
  { id: 3, name: 'Ağır / Desi 15+ Ürünler Ek Ücreti', condition: 'Desi >= 15 kg', surcharge: '+₺25.00', active: true },
  { id: 4, name: 'Trendyol Express Tercih İndirimi', condition: 'Trendyol siparişlerinde otomatik', discount: 'İndirimli', active: true },
];

export default function ShippingPage() {
  const [activeTab, setActiveTab] = useState<'companies' | 'zones' | 'rules'>('companies');
  const [showAddModal, setShowAddModal] = useState(false);

  const { providers: apiProviders, loading } = useShipping();

  const providersSource =
    Array.isArray(apiProviders) && apiProviders.length > 0 ? apiProviders : REALISTIC_SHIPPING_PROVIDERS;

  const shippingCompanies = (providersSource as any[]).map((p, i) => ({
    id: Number(p.id) || i + 1,
    name: p.name,
    logo: p.logo || '📦',
    status: p.status === 'active' || p.isActive ? 'active' : 'inactive',
    defaultRate: p.defaultRate || p.pricePerKg || 42,
    freeShippingMin: p.freeShippingMin || 500,
    avgDelivery: p.avgDelivery || `${p.avgDeliveryDays || 1.5} gün`,
    rating: p.rating || 4.7,
    integrationStatus:
      p.integrationStatus || (p.status === 'active' || p.isActive ? 'connected' : 'disconnected'),
    todayShipments: p.todayShipments || 0,
    totalShipments: p.totalShipments || 0,
  }));

  const activeCompanies = shippingCompanies.filter((c) => c.status === 'active').length;
  const todayShipments = shippingCompanies.reduce((sum, c) => sum + c.todayShipments, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <h1 className="text-xl lg:text-2xl font-semibold text-foreground tracking-tight">
              Kargo & Lojistik Yönetimi
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Anlaşmalı kargo firmaları, desi tarifeleri, otomatik barkod basımı ve bölge ayarları.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-card hover:bg-muted border border-border/70 rounded-lg text-xs font-medium text-foreground transition-colors shadow-2xs"
          >
            <Calculator size={13} />
            <span>Desi Hesapla</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors shadow-2xs"
          >
            <Plus size={13} />
            <span>Kargo Firması Ekle</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <div className="dash-card p-3.5 sm:p-4 rounded-xl border border-border/70 bg-card shadow-2xs">
          <p className="text-[11px] font-medium text-muted-foreground mb-1">Aktif Kargo Firması</p>
          <p className="text-lg sm:text-xl font-semibold text-foreground tracking-tight tabular-nums">
            {activeCompanies} / {shippingCompanies.length}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">Entegre taşıyıcı</p>
        </div>

        <div className="dash-card p-3.5 sm:p-4 rounded-xl border border-border/70 bg-card shadow-2xs">
          <p className="text-[11px] font-medium text-muted-foreground mb-1">Bugünkü Gönderim</p>
          <p className="text-lg sm:text-xl font-semibold text-sky-600 dark:text-sky-400 tracking-tight tabular-nums">
            {todayShipments} paket
          </p>
          <p className="text-[10px] text-sky-600/80 dark:text-sky-400/80 mt-1">Tüm pazaryerleri toplamı</p>
        </div>

        <div className="dash-card p-3.5 sm:p-4 rounded-xl border border-border/70 bg-card shadow-2xs">
          <p className="text-[11px] font-medium text-muted-foreground mb-1">Ortalama Teslimat Süresi</p>
          <p className="text-lg sm:text-xl font-semibold text-emerald-600 dark:text-emerald-400 tracking-tight tabular-nums">
            1.4 gün
          </p>
          <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-1">%94 ertesi gün teslim</p>
        </div>

        <div className="dash-card p-3.5 sm:p-4 rounded-xl border border-border/70 bg-card shadow-2xs">
          <p className="text-[11px] font-medium text-muted-foreground mb-1">Zamanında Teslimat</p>
          <p className="text-lg sm:text-xl font-semibold text-emerald-600 dark:text-emerald-400 tracking-tight tabular-nums">
            %98.4
          </p>
          <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-1">Pazaryeri KPI uyumu</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border/60 pb-px">
        {[
          { id: 'companies', label: 'Kargo Firmaları', icon: Truck },
          { id: 'zones', label: 'Bölge & Desi Fiyatları', icon: MapPin },
          { id: 'rules', label: 'Kargo Kuralları', icon: Settings },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            <tab.icon size={13} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab: Companies */}
      {activeTab === 'companies' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {shippingCompanies.map((company) => (
            <div
              key={company.id}
              className={`rounded-xl border p-4 bg-card shadow-2xs transition-all ${
                company.status === 'active'
                  ? 'border-border/70 hover:border-border hover:shadow-xs'
                  : 'border-border/40 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-xl shrink-0">
                    {company.logo}
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-foreground tracking-tight">
                      {company.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${
                          company.integrationStatus === 'connected'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : 'bg-muted text-muted-foreground border-border'
                        }`}
                      >
                        {company.integrationStatus === 'connected' ? (
                          <>
                            <CheckCircle2 size={10} /> Bağlı
                          </>
                        ) : (
                          'Pasif'
                        )}
                      </span>
                      <span className="flex items-center gap-0.5 text-amber-500 text-[11px] font-medium">
                        <Star className="w-3 h-3 fill-amber-500" />
                        {company.rating}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-muted-foreground">
                  <button
                    type="button"
                    className="p-1 rounded-md hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    type="button"
                    className="p-1 rounded-md hover:bg-muted hover:text-rose-500 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 my-3 p-2.5 rounded-lg bg-muted/30 border border-border/50 text-xs">
                <div>
                  <span className="text-[10px] text-muted-foreground block">Desi Ücreti</span>
                  <span className="font-semibold text-foreground tabular-nums">₺{company.defaultRate}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Ücretsiz Kargo</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    ₺{company.freeShippingMin}+
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                <span className="flex items-center gap-1">
                  <Clock size={12} /> {company.avgDelivery}
                </span>
                <span className="font-medium text-foreground">{company.todayShipments} paket bugün</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Zones */}
      {activeTab === 'zones' && (
        <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-2xs">
          <div className="p-3 sm:p-4 border-b border-border/60 bg-muted/20 flex items-center justify-between">
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-foreground tracking-tight">
                Bölge Bazlı Sevkiyat ve Fiyatlandırma
              </h3>
              <p className="text-[11px] text-muted-foreground">İllere ve mesafeye göre desi taban ücretleri</p>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-card border border-border/70 text-xs font-medium text-foreground hover:bg-muted transition-colors shadow-2xs"
            >
              <Plus size={12} /> Yeni Bölge
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/40 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/70">
                  <th className="text-left py-2.5 px-3.5">Bölge & Kapsam</th>
                  <th className="text-center py-2.5 px-3.5">İl Adedi</th>
                  <th className="text-right py-2.5 px-3.5">Taban Fiyat</th>
                  <th className="text-center py-2.5 px-3.5">Teslimat Süresi</th>
                  <th className="text-right py-2.5 px-3.5">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {shippingZones.map((zone) => (
                  <tr key={zone.id} className="transition-colors hover:bg-muted/25">
                    <td className="py-2.5 px-3.5 font-medium text-foreground">{zone.name}</td>
                    <td className="py-2.5 px-3.5 text-center text-muted-foreground">{zone.provinces} il</td>
                    <td className="py-2.5 px-3.5 text-right font-medium text-foreground tabular-nums">
                      ₺{zone.baseCost.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3.5 text-center">
                      <span className="px-2 py-0.5 rounded-md bg-muted text-[11px] font-medium text-muted-foreground">
                        {zone.deliveryTime}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-right">
                      <button
                        type="button"
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                      >
                        <Edit3 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Rules */}
      {activeTab === 'rules' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="rounded-xl border border-border/70 bg-card p-4 sm:p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs sm:text-sm font-semibold text-foreground tracking-tight">
                Aktif Kargo Kuralları
              </h3>
              <button
                type="button"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow-2xs"
              >
                <Plus size={12} /> Kural Ekle
              </button>
            </div>

            <div className="space-y-2">
              {shippingRules.map((rule) => (
                <div
                  key={rule.id}
                  className="p-3 rounded-lg bg-muted/25 border border-border/50 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-medium text-foreground">{rule.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{rule.condition}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {rule.discount || rule.surcharge}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border/70 bg-card p-4 sm:p-5 shadow-2xs space-y-3.5">
            <h3 className="text-xs sm:text-sm font-semibold text-foreground tracking-tight">
              Hızlı Kargo Ayarları
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                  Genel Ücretsiz Kargo Sepet Limiti
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    defaultValue={500}
                    className="w-full px-3 py-1.5 bg-background border border-border/70 rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-medium text-muted-foreground">₺</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                  Varsayılan Taşıyıcı Firma
                </label>
                <select className="w-full px-3 py-1.5 bg-background border border-border/70 rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500">
                  {shippingCompanies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-lg bg-muted/40 border border-border/50 flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground text-xs">Otomatik Kargo Barkodu Oluştur</p>
                  <p className="text-[10px] text-muted-foreground">Sipariş onayında API üzerinden etiket bas</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>

              <button
                type="button"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors shadow-2xs"
              >
                Ayarları Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simple Add Modal Placeholder */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Yeni Kargo Entegrasyonu</h3>
            <p className="text-xs text-muted-foreground">
              Yurtiçi, Trendyol Express, Aras veya Sürat Kargo API bilgilerinizi bağlayın.
            </p>
            <div className="space-y-2 text-xs">
              <input
                type="text"
                placeholder="Firma Adı (Örn: Sürat Kargo)"
                className="w-full px-3 py-1.5 bg-background border border-border/70 rounded-lg text-xs"
              />
              <input
                type="text"
                placeholder="Müşteri Kodu / Kullanıcı Adı"
                className="w-full px-3 py-1.5 bg-background border border-border/70 rounded-lg text-xs"
              />
              <input
                type="password"
                placeholder="API Şifresi / Servis Anahtarı"
                className="w-full px-3 py-1.5 bg-background border border-border/70 rounded-lg text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 rounded-lg border border-border/70 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-500"
              >
                Kaydet & Test Et
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
