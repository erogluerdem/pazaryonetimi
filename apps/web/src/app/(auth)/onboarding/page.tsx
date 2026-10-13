'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, MapPin, Phone, FileText, ChevronRight, ChevronLeft,
  Check, Loader2, Store, Link2, ShoppingBag, Truck, CreditCard,
  ArrowRight, Sparkles,
} from 'lucide-react';

const STEPS = [
  { id: 'company', title: 'Şirket Bilgileri', icon: Building2 },
  { id: 'platforms', title: 'Pazaryerleri', icon: ShoppingBag },
  { id: 'settings', title: 'Ek Ayarlar', icon: Store },
];

const PLATFORMS = [
  { key: 'TRENDYOL', name: 'Trendyol', color: 'bg-orange-500' },
  { key: 'HEPSIBURADA', name: 'Hepsiburada', color: 'bg-red-500' },
  { key: 'AMAZON', name: 'Amazon', color: 'bg-yellow-500' },
  { key: 'N11', name: 'N11', color: 'bg-purple-500' },
  { key: 'CICEKSEPETI', name: 'Çiçeksepeti', color: 'bg-pink-500' },
  { key: 'GITTIGIDIYOR', name: 'GittiGidiyor', color: 'bg-green-500' },
];

const SHIPPING_PROVIDERS = [
  { key: 'SHIPPING_ARAS', name: 'Aras Kargo' },
  { key: 'SHIPPING_YURTICI', name: 'Yurtiçi Kargo' },
  { key: 'SHIPPING_MNG', name: 'MNG Kargo' },
  { key: 'SHIPPING_PTT', name: 'PTT Kargo' },
];

const PAYMENT_PROVIDERS = [
  { key: 'PAYMENT_IYZICO', name: 'iyzico' },
  { key: 'PAYMENT_PAYTR', name: 'PayTR' },
  { key: 'PAYMENT_PARAM', name: 'Param' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [companyData, setCompanyData] = useState({
    companyName: '',
    taxOffice: '',
    taxNumber: '',
    companyType: 'Limited',
    address: '',
    city: '',
    district: '',
    postcode: '',
    phone: '',
  });

  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<string[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<string[]>([]);

  const tenantId = (session?.user as any)?.tenantId;

  const toggleItem = (list: string[], setList: (v: string[]) => void, key: string) => {
    setList(list.includes(key) ? list.filter(k => k !== key) : [...list, key]);
  };

  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setCompanyData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!tenantId) {
      setError('Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/tenant/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          ...companyData,
          selectedPlatforms,
          selectedShipping,
          selectedPayment,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Kurulum tamamlanamadı.');
      }

      if (update) { await update(); }
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu.');
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    if (currentStep === 0) return companyData.companyName.trim().length > 0;
    return true;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] flex flex-col">
      <header className="h-16 border-b border-slate-200 dark:border-white/5 flex items-center px-8 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
            <Sparkles size={18} />
          </div>
          <span className="font-bold text-slate-900 dark:text-white text-lg">PazarYönetimi</span>
        </div>
      </header>

      <div className="bg-white dark:bg-slate-900/50 border-b border-slate-200 dark:border-white/5 px-8 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          {STEPS.map((step, i) => (
            <div key={step.id} className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
                i < currentStep
                  ? 'bg-green-500 text-white'
                  : i === currentStep
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-400'
              }`}>
                {i < currentStep ? <Check size={18} /> : <step.icon size={18} />}
              </div>
              <span className={`text-sm font-semibold hidden sm:block ${
                i === currentStep ? 'text-slate-900 dark:text-white' : 'text-slate-400'
              }`}>{step.title}</span>
              {i < STEPS.length - 1 && <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 mx-2" />}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            {currentStep === 0 && (
              <motion.div key="company" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Şirket Bilgileriniz</h2>
                  <p className="text-slate-500 dark:text-slate-400 mt-1">Fatura ve vergi işlemleri için gerekli bilgiler.</p>
                </div>
                <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 p-6 space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Şirket / Mağaza Adı *</label>
                    <div className="relative">
                      <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input name="companyName" value={companyData.companyName} onChange={handleCompanyChange}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                        placeholder="Şirketinizin adı" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Şirket Türü</label>
                      <select name="companyType" value={companyData.companyType} onChange={handleCompanyChange}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-white">
                        <option value="Şahıs">Şahıs</option>
                        <option value="Limited">Limited Şirketi</option>
                        <option value="Anonim">Anonim Şirketi</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Vergi Dairesi</label>
                      <input name="taxOffice" value={companyData.taxOffice} onChange={handleCompanyChange}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                        placeholder="Kadıköy" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Vergi No / TC No</label>
                      <div className="relative">
                        <FileText size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input name="taxNumber" value={companyData.taxNumber} onChange={handleCompanyChange}
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                          placeholder="1234567890" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Telefon</label>
                      <div className="relative">
                        <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input name="phone" value={companyData.phone} onChange={handleCompanyChange}
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                          placeholder="0532 000 0000" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Adres</label>
                    <div className="relative">
                      <MapPin size={16} className="absolute left-3 top-3 text-slate-400" />
                      <input name="address" value={companyData.address} onChange={handleCompanyChange}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                        placeholder="Mahalle, Cadde, No" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">İl</label>
                      <input name="city" value={companyData.city} onChange={handleCompanyChange}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                        placeholder="İstanbul" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">İlçe</label>
                      <input name="district" value={companyData.district} onChange={handleCompanyChange}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                        placeholder="Kadıköy" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Posta Kodu</label>
                      <input name="postcode" value={companyData.postcode} onChange={handleCompanyChange}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                        placeholder="34710" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 1 && (
              <motion.div key="platforms" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Pazaryerleri</h2>
                  <p className="text-slate-500 dark:text-slate-400 mt-1">Satış yaptığınız veya yapmak istediğiniz pazaryerlerini seçin. API anahtarlarını daha sonra ayarlardan girebilirsiniz.</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {PLATFORMS.map(p => (
                    <button key={p.key} type="button" onClick={() => toggleItem(selectedPlatforms, setSelectedPlatforms, p.key)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        selectedPlatforms.includes(p.key)
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'
                          : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-slate-300'
                      }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 ${p.color} rounded-lg flex items-center justify-center`}>
                          <ShoppingBag size={16} className="text-white" />
                        </div>
                        <span className="font-semibold text-sm text-slate-900 dark:text-white">{p.name}</span>
                      </div>
                      {selectedPlatforms.includes(p.key) && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                          <Check size={14} /> Seçildi
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  <Link2 size={12} className="inline mr-1" />
                  API anahtarlarınızı daha sonra <strong>Ayarlar → Platform Entegrasyonları</strong> kısmından girebilirsiniz.
                </p>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div key="settings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Kargo & Ödeme</h2>
                  <p className="text-slate-500 dark:text-slate-400 mt-1">Kullandığınız kargo ve ödeme sağlayıcılarını seçin.</p>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <Truck size={16} /> Kargo Firmaları
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {SHIPPING_PROVIDERS.map(s => (
                      <button key={s.key} type="button" onClick={() => toggleItem(selectedShipping, setSelectedShipping, s.key)}
                        className={`p-3 rounded-xl border-2 text-left transition-all text-sm font-medium ${
                          selectedShipping.includes(s.key)
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300'
                            : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                        }`}>
                        {selectedShipping.includes(s.key) && <Check size={14} className="inline mr-1" />}
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <CreditCard size={16} /> Ödeme Sağlayıcıları
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {PAYMENT_PROVIDERS.map(p => (
                      <button key={p.key} type="button" onClick={() => toggleItem(selectedPayment, setSelectedPayment, p.key)}
                        className={`p-3 rounded-xl border-2 text-left transition-all text-sm font-medium ${
                          selectedPayment.includes(p.key)
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300'
                            : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                        }`}>
                        {selectedPayment.includes(p.key) && <Check size={14} className="inline mr-1" />}
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
                {error && (
                  <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-sm text-red-700 dark:text-red-300 font-medium">
                    {error}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between mt-8">
            <button type="button" onClick={() => setCurrentStep(prev => prev - 1)} disabled={currentStep === 0}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft size={16} /> Geri
            </button>
            {currentStep < STEPS.length - 1 ? (
              <button type="button" onClick={() => setCurrentStep(prev => prev + 1)} disabled={!canProceed()}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20">
                Sonraki <ChevronRight size={16} />
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={isSubmitting}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/30">
                {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Kaydediliyor...</> : <>Kurulumu Tamamla <ArrowRight size={16} /></>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
