"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Check,
  X,
  Building2,
  Store,
  Package,
  Zap,
  User,
  ArrowRight,
  Trophy,
  Gift,
  Star,
  ShieldCheck,
  RotateCcw,
  TrendingUp,
  Boxes,
  Layers,
  HelpCircle,
  Bot,
  Phone,
  Mail,
  Briefcase,
  Globe2,
  Rocket,
  CheckCircle,
} from "lucide-react";

interface UserOnboardingProps {
  onClose?: () => void;
}

// Marketplace catalog with real brand assets from public/images/pazaryeri/
const MARKETPLACES = [
  {
    id: "trendyol",
    name: "Trendyol",
    badge: "En Çok Satan",
    desc: "Türkiye'nin lider pazaryeri",
    logo: "/images/pazaryeri/Trendyol.png",
    defaultSelected: true,
  },
  {
    id: "hepsiburada",
    name: "Hepsiburada",
    badge: "Popüler",
    desc: "Geniş kitle & HepsiJet",
    logo: "/images/pazaryeri/Hepsiburada.png",
    defaultSelected: true,
  },
  {
    id: "amazon",
    name: "Amazon Türkiye",
    badge: "Global",
    desc: "TR & Global Prime ağı",
    logo: "/images/pazaryeri/Amazon.png",
    defaultSelected: true,
  },
  {
    id: "n11",
    name: "N11",
    badge: "Hızlı Kurulum",
    desc: "Kupon & kampanya avantajı",
    logo: "/images/pazaryeri/N11.png",
    defaultSelected: true,
  },
  {
    id: "ciceksepeti",
    name: "Çiçeksepeti",
    badge: "Niş Pazar",
    desc: "Hediye & özel kategoriler",
    logo: "/images/pazaryeri/ciceksepeti.png",
    defaultSelected: false,
  },
  {
    id: "pazarama",
    name: "Pazarama",
    badge: "Büyüyen",
    desc: "İş Bankası güvencesi",
    logo: "/images/pazaryeri/Pazarama.png",
    defaultSelected: false,
  },
  {
    id: "shopify",
    name: "Shopify",
    badge: "Kendi Siteniz",
    desc: "Çift yönlü stok & ürün",
    logo: "/images/pazaryeri/Shopify.png",
    defaultSelected: false,
  },
  {
    id: "woocommerce",
    name: "WooCommerce",
    badge: "WordPress",
    desc: "Kendi sitenizi bağlayın",
    logo: "/images/pazaryeri/WooCommerce.png",
    defaultSelected: false,
  },
];

const SECTORS = [
  {
    id: "ecommerce",
    title: "E-Ticaret / Pazaryeri Satıcısı",
    desc: "Trendyol, Hepsiburada ve Amazon'da aktif satış",
    icon: Store,
  },
  {
    id: "retail",
    title: "Fiziksel Mağaza + Online",
    desc: "Hem cadde mağazası hem pazaryeri operasyonları",
    icon: Building2,
  },
  {
    id: "wholesale",
    title: "Üretici & Toptancı (B2B)",
    desc: "Büyük katalog, bayi dağıtımı ve çoklu depo",
    icon: Package,
  },
  {
    id: "dropshipping",
    title: "E-İhracat / Dropshipping",
    desc: "Yurt dışı satış, Amazon FBA ve tedarikçi XML",
    icon: Globe2,
  },
];

const COMPANY_TYPES = ["Şahıs Şirketi", "Limited Şirket", "Anonim Şirket", "Bireysel / Girişimci"];

export function UserOnboarding({ onClose }: UserOnboardingProps) {
  const router = useRouter();
  const { data: session } = useSession();

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [profileData, setProfileData] = useState({
    fullName: "",
    phone: "",
    role: "Mağaza Sahibi",
  });

  const [storeData, setStoreData] = useState({
    storeName: "",
    sector: "ecommerce",
    companyType: "Limited Şirket",
  });

  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([
    "trendyol",
    "hepsiburada",
    "amazon",
    "n11",
  ]);

  const [activeTourTab, setActiveTourTab] = useState(0);

  // Pre-fill user profile from session if available
  useEffect(() => {
    if (session?.user) {
      const u = session.user;
      setProfileData((prev) => ({
        ...prev,
        fullName: prev.fullName || u.name || "",
      }));
      setStoreData((prev) => ({
        ...prev,
        storeName:
          prev.storeName ||
          (u.name ? `${u.name}'in Mağazası` : "PazarYönetimi Mağazam"),
      }));
    }
  }, [session]);

  const stepMeta = [
    { id: "welcome", title: "Karşılama", icon: Sparkles },
    { id: "profile", title: "Profil", icon: User },
    { id: "store", title: "Mağaza", icon: Building2 },
    { id: "platforms", title: "Pazaryerleri", icon: Store },
    { id: "tour", title: "Özellikler", icon: Zap },
    { id: "complete", title: "Başarı", icon: Trophy },
  ];

  const totalSteps = stepMeta.length;
  const progressPercent = Math.round(((currentStepIndex + 1) / totalSteps) * 100);

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const selectAllPlatforms = () => {
    setSelectedPlatforms(MARKETPLACES.map((m) => m.id));
  };

  const selectPopularPlatforms = () => {
    setSelectedPlatforms(["trendyol", "hepsiburada", "amazon", "n11"]);
  };

  const liveSlug = useMemo(() => {
    return (storeData.storeName || "magazam")
      .toLowerCase()
      .replace(/[çÇ]/g, "c")
      .replace(/[ğĞ]/g, "g")
      .replace(/[ıİ]/g, "i")
      .replace(/[öÖ]/g, "o")
      .replace(/[şŞ]/g, "s")
      .replace(/[üÜ]/g, "u")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 30);
  }, [storeData.storeName]);

  const handleNext = () => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      finishOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const finishOnboarding = useCallback(async () => {
    setIsSubmitting(true);

    try {
      // 1. Save tenant store information & selected integrations
      await fetch("/api/tenant/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: storeData.storeName || "Pazar Mağazam",
          companyType: storeData.companyType,
          phone: profileData.phone,
          selectedPlatforms,
        }),
      }).catch((e) => console.warn("Tenant onboarding save warning:", e));

      // 2. Mark user onboarding complete
      const stepIds = stepMeta.map((s) => s.id);
      await Promise.all([
        fetch("/api/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            completedSteps: stepIds,
            totalTimeSpent: 60,
          }),
        }).catch(() => null),
        fetch("/api/onboarding/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            completedSteps: stepIds,
            totalTimeSpent: 60,
          }),
        }).catch(() => null),
      ]);

      if (typeof window !== "undefined") {
        localStorage.setItem("pazaryonetimi_onboarded", "true");
      }
    } catch (err) {
      console.error("Onboarding completion error:", err);
    } finally {
      setIsSubmitting(false);
      setIsVisible(false);
      if (onClose) onClose();
      router.push("/dashboard");
    }
  }, [storeData, profileData, selectedPlatforms, stepMeta, onClose, router]);

  const handleClose = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("pazaryonetimi_onboarded", "true");
    }
    setIsVisible(false);
    if (onClose) onClose();
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop with multi-layer ambient blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-slate-950/75 backdrop-blur-md transition-opacity"
        />

        {/* Ambient Glowing Blobs */}
        <div className="fixed top-1/4 left-1/3 -translate-x-1/2 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="fixed bottom-1/4 right-1/3 translate-x-1/2 w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative w-full max-w-2xl bg-card text-card-foreground border border-border/70 dark:border-white/10 rounded-2xl sm:rounded-[28px] shadow-2xl shadow-indigo-950/40 overflow-hidden flex flex-col z-10 max-h-[92vh]"
        >
          {/* Top Bar with Brand Badge, Step Tracker & Close */}
          <div className="px-5 sm:px-7 pt-5 pb-3 border-b border-border/60 bg-muted/30">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                  <Sparkles className="size-3" />
                  PazarYönetimi Hızlı Kurulum
                </span>
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  • Adım {currentStepIndex + 1} / {totalSteps}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-primary px-2 py-0.5 rounded-md bg-primary/10">
                  %{progressPercent}
                </span>
                <button
                  type="button"
                  onClick={handleClose}
                  className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                  title="Kapat ve panele git"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Stepper Progress Bar */}
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mb-3">
              <motion.div
                className="h-full bg-gradient-to-r from-primary via-indigo-500 to-violet-600 rounded-full"
                initial={false}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              />
            </div>

            {/* Step Breadcrumbs (desktop only) */}
            <div className="hidden sm:flex items-center justify-between text-xs text-muted-foreground pt-1">
              {stepMeta.map((s, idx) => {
                const isActive = idx === currentStepIndex;
                const isPassed = idx < currentStepIndex;

                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setCurrentStepIndex(idx)}
                    className={`flex items-center gap-1.5 transition-colors py-0.5 px-1 rounded ${
                      isActive
                        ? "text-primary font-semibold"
                        : isPassed
                        ? "text-foreground hover:text-primary"
                        : "text-muted-foreground/60 hover:text-muted-foreground"
                    }`}
                  >
                    <span
                      className={`size-5 rounded-full flex items-center justify-center text-[10px] ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                          : isPassed
                          ? "bg-emerald-500 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isPassed ? <Check className="size-3" /> : idx + 1}
                    </span>
                    <span>{s.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Content Body */}
          <div className="p-5 sm:p-7 overflow-y-auto flex-1">
            <AnimatePresence mode="wait">
              {/* STEP 1: WELCOME & CAPABILITIES */}
              {currentStepIndex === 0 && (
                <motion.div
                  key="step-welcome"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6 text-center"
                >
                  {/* Glowing Hero Icon */}
                  <div className="relative mx-auto size-20 sm:size-24 flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-primary/30 via-indigo-500/20 to-violet-500/30 blur-md"
                    />
                    <div className="relative size-16 sm:size-20 bg-gradient-to-br from-primary via-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 text-white">
                      <Sparkles className="size-8 sm:size-10" />
                    </div>
                  </div>

                  <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                      PazarYönetimi Ekosistemine Hoş Geldiniz! 🚀
                    </h2>
                    <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-lg mx-auto">
                      Tüm pazaryeri mağazalarınızı, stoklarınızı, siparişlerinizi ve yapay zeka stratejilerinizi tek ekrandan yönetmeye hazır mısınız?
                    </p>
                  </div>

                  {/* 4 Bento Feature Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-1">
                    <div className="p-3.5 rounded-xl border border-border/70 bg-muted/30 hover:border-primary/40 transition-colors">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <div className="size-7 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                          <Layers className="size-4" />
                        </div>
                        <h4 className="text-xs sm:text-sm font-semibold text-foreground">
                          Çoklu Pazaryeri Eşitleme
                        </h4>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Trendyol, Hepsiburada, Amazon ve N11 stokları anlık senkronize olur; mükerrer sipariş riski sıfırlanır.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl border border-border/70 bg-muted/30 hover:border-primary/40 transition-colors">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <div className="size-7 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                          <Bot className="size-4" />
                        </div>
                        <h4 className="text-xs sm:text-sm font-semibold text-foreground">
                          PazarAI Akıllı Strateji
                        </h4>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Buybox rekabeti, dinamik fiyatlama önerileri ve yapay zeka ile otomatik ürün açıklamaları.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl border border-border/70 bg-muted/30 hover:border-primary/40 transition-colors">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <div className="size-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                          <Boxes className="size-4" />
                        </div>
                        <h4 className="text-xs sm:text-sm font-semibold text-foreground">
                          Konsolide Sipariş & Kargo
                        </h4>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Tüm platformlardan gelen siparişler tek havuzda toplanır, tek tıkla kargo fişi ve e-fatura üretilir.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl border border-border/70 bg-muted/30 hover:border-primary/40 transition-colors">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <div className="size-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                          <TrendingUp className="size-4" />
                        </div>
                        <h4 className="text-xs sm:text-sm font-semibold text-foreground">
                          Net Kâr & Komisyon Analizi
                        </h4>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Pazaryeri komisyonları, kargo ücretleri ve ürün maliyetleri düşülerek anlık net kârınız hesaplanır.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleNext}
                      className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-primary via-indigo-600 to-violet-600 text-white font-semibold text-sm sm:text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:opacity-95 transition-all flex items-center justify-center gap-2"
                    >
                      Hızlı Kuruluma Başla
                      <ArrowRight className="size-4" />
                    </button>
                    <p className="text-[11px] text-muted-foreground mt-2">
                      ⚡ Sadece 60 saniyede mağazanızı satışa hazırlayın
                    </p>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: PROFILE SETUP */}
              {currentStepIndex === 1 && (
                <motion.div
                  key="step-profile"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  <div className="text-center">
                    <div className="size-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-3 text-white shadow-md shadow-emerald-500/20">
                      <User className="size-7" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                      Profilinizi Tamamlayın
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      Kritik stok alarmları ve sipariş raporları bu bilgilere göre iletilir
                    </p>
                  </div>

                  <div className="space-y-4 max-w-lg mx-auto">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">
                        Adınız ve Soyadınız
                      </label>
                      <div className="relative">
                        <User className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="text"
                          value={profileData.fullName}
                          onChange={(e) =>
                            setProfileData({ ...profileData, fullName: e.target.value })
                          }
                          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                          placeholder="Örn: Erdem Eroğlu"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">
                        Telefon Numarası
                      </label>
                      <div className="relative">
                        <Phone className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="tel"
                          value={profileData.phone}
                          onChange={(e) =>
                            setProfileData({ ...profileData, phone: e.target.value })
                          }
                          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                          placeholder="+90 5XX XXX XX XX"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">
                        E-posta Adresi (Doğrulandı)
                      </label>
                      <div className="relative">
                        <Mail className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="email"
                          disabled
                          value={session?.user?.email || "Giriş yapılmış e-posta"}
                          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-input bg-muted/50 text-muted-foreground cursor-not-allowed"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="size-3" /> Doğrulandı
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">
                        Yönetici Rolü
                      </label>
                      <div className="relative">
                        <Briefcase className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <select
                          value={profileData.role}
                          onChange={(e) =>
                            setProfileData({ ...profileData, role: e.target.value })
                          }
                          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                        >
                          <option value="Mağaza Sahibi">Mağaza Sahibi / Kurucu</option>
                          <option value="E-Ticaret Yöneticisi">E-Ticaret Yöneticisi</option>
                          <option value="Operasyon Sorumlusu">Operasyon & Depo Sorumlusu</option>
                          <option value="Finans & Muhasebe">Finans & Muhasebe</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: STORE / TENANT SETUP */}
              {currentStepIndex === 2 && (
                <motion.div
                  key="step-store"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5"
                >
                  <div className="text-center">
                    <div className="size-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 text-white shadow-md shadow-indigo-500/20">
                      <Building2 className="size-7" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                      Mağazanızı Tanımlayın
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      Şirket bilgilerinizi girin ve operasyon alanınızı belirleyin
                    </p>
                  </div>

                  <div className="space-y-4 max-w-xl mx-auto">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">
                        Mağaza / Şirket Adı
                      </label>
                      <input
                        type="text"
                        value={storeData.storeName}
                        onChange={(e) =>
                          setStoreData({ ...storeData, storeName: e.target.value })
                        }
                        className="w-full px-4 py-2.5 text-sm rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                        placeholder="Örn: Trend Butik E-Ticaret"
                      />
                      <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1 font-mono">
                        <span className="text-primary">URL:</span> pazaryonetimi.com/{liveSlug}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">
                        İşletme Modeli / Sektörünüz
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {SECTORS.map((sec) => {
                          const Icon = sec.icon;
                          const isSelected = storeData.sector === sec.id;

                          return (
                            <button
                              key={sec.id}
                              type="button"
                              onClick={() => setStoreData({ ...storeData, sector: sec.id })}
                              className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                                isSelected
                                  ? "border-primary bg-primary/5 ring-1 ring-primary/40 shadow-xs"
                                  : "border-border/70 hover:border-border hover:bg-muted/30"
                              }`}
                            >
                              <div
                                className={`size-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                  isSelected
                                    ? "bg-primary text-white"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                <Icon className="size-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-foreground truncate">
                                  {sec.title}
                                </p>
                                <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                                  {sec.desc}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">
                        Şirket Türü
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {COMPANY_TYPES.map((type) => {
                          const isSelected = storeData.companyType === type;
                          return (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setStoreData({ ...storeData, companyType: type })}
                              className={`py-2 px-2.5 text-xs rounded-lg border font-medium transition-all text-center ${
                                isSelected
                                  ? "border-primary bg-primary/10 text-primary font-semibold"
                                  : "border-border/70 text-muted-foreground hover:bg-muted/30"
                              }`}
                            >
                              {type}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 4: MARKETPLACE CONNECTIONS WITH REAL LOGOS */}
              {currentStepIndex === 3 && (
                <motion.div
                  key="step-platforms"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="text-center">
                    <div className="size-14 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-3 text-white shadow-md shadow-orange-500/20">
                      <Store className="size-7" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                      Pazaryerlerinizi Seçin
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      Satış yaptığınız platformları işaretleyin, ürün ve sipariş havuzunu oluşturalım
                    </p>
                  </div>

                  {/* Quick Select Actions */}
                  <div className="flex items-center justify-between text-xs pt-1 px-1">
                    <span className="font-semibold text-foreground">
                      Seçilen:{" "}
                      <span className="text-primary font-bold">
                        {selectedPlatforms.length} / {MARKETPLACES.length}
                      </span>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={selectPopularPlatforms}
                        className="text-xs text-primary hover:underline font-medium"
                      >
                        En Popülerleri Seç (4)
                      </button>
                      <span className="text-muted-foreground/40">•</span>
                      <button
                        type="button"
                        onClick={selectAllPlatforms}
                        className="text-xs text-muted-foreground hover:text-foreground font-medium"
                      >
                        Tümünü Seç
                      </button>
                    </div>
                  </div>

                  {/* Marketplaces Grid with Real Logos */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-[300px] overflow-y-auto p-1">
                    {MARKETPLACES.map((mp) => {
                      const isSelected = selectedPlatforms.includes(mp.id);

                      return (
                        <button
                          key={mp.id}
                          type="button"
                          onClick={() => togglePlatform(mp.id)}
                          className={`relative p-3 rounded-xl border text-left transition-all flex flex-col items-center justify-between gap-2.5 group ${
                            isSelected
                              ? "border-primary bg-primary/5 ring-1 ring-primary/40 shadow-xs"
                              : "border-border/70 hover:border-border hover:bg-muted/20 opacity-80"
                          }`}
                        >
                          {/* Selection Checkmark */}
                          <div
                            className={`absolute top-2 right-2 size-5 rounded-full flex items-center justify-center transition-all ${
                              isSelected
                                ? "bg-primary text-primary-foreground shadow-xs"
                                : "border border-border/80 bg-background text-transparent"
                            }`}
                          >
                            <Check className="size-3" />
                          </div>

                          {/* Real Brand Logo */}
                          <div className="h-10 w-full flex items-center justify-center p-1 bg-white dark:bg-slate-900 rounded-lg border border-border/40 mt-1">
                            <Image
                              src={mp.logo}
                              alt={mp.name}
                              width={90}
                              height={32}
                              className="max-h-7 w-auto object-contain"
                            />
                          </div>

                          <div className="text-center w-full">
                            <p className="text-xs font-bold text-foreground truncate">
                              {mp.name}
                            </p>
                            <span className="inline-block text-[10px] text-muted-foreground mt-0.5">
                              {mp.badge}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Informative helper note */}
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-2.5">
                    <HelpCircle className="size-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                      API anahtarlarınızı kurulumdan sonra paneldeki <strong>Entegrasyonlar</strong> sekmesinden dilediğiniz zaman tek tıkla tanımlayabilirsiniz.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* STEP 5: AI & CAPABILITIES TOUR */}
              {currentStepIndex === 4 && (
                <motion.div
                  key="step-tour"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="text-center">
                    <div className="size-14 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 text-white shadow-md shadow-violet-500/20">
                      <Zap className="size-7" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                      Güçlü Özellikleri Keşfedin
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      PazarYönetimi ile operasyonunuzu otomatikleştirin
                    </p>
                  </div>

                  {/* Tabs Switcher */}
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted rounded-xl">
                    {[
                      { idx: 0, label: "PazarAI Brifing", icon: Bot },
                      { idx: 1, label: "Mükerrer Önleme", icon: ShieldCheck },
                      { idx: 2, label: "1-Tıkla Geri Alma", icon: RotateCcw },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTourTab === tab.idx;

                      return (
                        <button
                          key={tab.idx}
                          type="button"
                          onClick={() => setActiveTourTab(tab.idx)}
                          className={`py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                            isActive
                              ? "bg-background text-primary shadow-xs"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <Icon className="size-3.5" />
                          <span className="truncate">{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Showcase Card Preview */}
                  <div className="min-h-[210px] p-4 rounded-2xl border border-border/70 bg-gradient-to-br from-muted/40 via-background to-muted/20 flex flex-col justify-center">
                    {activeTourTab === 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-xs font-semibold text-primary">
                            Yapay Zekalı Günlük Operasyon Rehberi
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-foreground">
                          🤖 PazarAI Sabah Brifingi & Buybox Takibi
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Her sabah giriş yaptığınızda yapay zeka dün geceki ciroyu, kargo bekleyen siparişleri ve rakiplerinizin fiyat değişikliklerini analiz ederek günün stratejisini hazırlar.
                        </p>
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
                            <p className="text-[10px] text-muted-foreground font-medium">Örnek Buybox Tavsiyesi</p>
                            <p className="text-xs font-semibold text-primary mt-0.5">
                              ₺499 → ₺495 (1. sırayı geri al)
                            </p>
                          </div>
                          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            <p className="text-[10px] text-muted-foreground font-medium">Kritik Stok Uyarısı</p>
                            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                              3 üründe son 2 adet kaldı
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTourTab === 1 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            Yüksek Güvenlikli Entegrasyon Motoru
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-foreground">
                          🛡️ Kesintiye Karşı Mükerrer Sipariş ve Stok Kalkanı
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Pazaryeri API bağlantısı kopsa veya XML beslemesi kesilse dahi sistem idempotent kuyruk yapısıyla hiçbir zaman mükerrer ürün ve hatalı stok oluşturmaz.
                        </p>
                        <ul className="space-y-1.5 text-xs text-muted-foreground pt-1">
                          <li className="flex items-center gap-2">
                            <Check className="size-3.5 text-emerald-500" />
                            <span>Bir pazaryerinde satılan ürün diğer tüm platformlarda anında düşer.</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="size-3.5 text-emerald-500" />
                            <span>Bağlantı hatası durumunda yöneticiye otomatik bildirim ve 15 dk sağlık denetimi.</span>
                          </li>
                        </ul>
                      </div>
                    )}

                    {activeTourTab === 2 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <RotateCcw className="size-4 text-indigo-500" />
                          <span className="text-xs font-semibold text-indigo-500">
                            Geri Alınabilir Toplu İşlemler
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-foreground">
                          ⏪ 1-Tıkla Değişiklik Geri Alma & Anlık Snapshot
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Binlerce üründe yaptığınız toplu fiyat artışı veya stok güncellemesi öncesi sistem otomatik güvenlik anlık görüntüsü (snapshot) alır. İstenmeyen bir durumda tek tıkla eski haline dönebilirsiniz.
                        </p>
                        <div className="p-2.5 rounded-lg bg-muted border border-border/80 flex items-center justify-between text-xs">
                          <div>
                            <p className="font-semibold text-foreground">Son Toplu İşlem: %15 Fiyat Güncellemesi</p>
                            <p className="text-[10px] text-muted-foreground">324 ürün güncellendi • Yedek alındı</p>
                          </div>
                          <span className="px-2 py-1 rounded bg-primary text-white font-medium text-[11px] shadow-xs">
                            Geri Al
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* STEP 6: CELEBRATION & COMPLETION */}
              {currentStepIndex === 5 && (
                <motion.div
                  key="step-complete"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5 text-center relative"
                >
                  {/* Confetti Particles */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {[...Array(16)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute size-2 rounded-full"
                        style={{
                          backgroundColor: [
                            "#3b82f6",
                            "#8b5cf6",
                            "#10b981",
                            "#f59e0b",
                            "#ec4899",
                          ][i % 5],
                          left: `${15 + (i * 5) % 70}%`,
                          top: `${20 + (i * 6) % 60}%`,
                        }}
                        initial={{ opacity: 0, scale: 0, y: 0 }}
                        animate={{
                          opacity: [0, 1, 0],
                          scale: [0, 1.5, 0.8],
                          y: [-20, (i % 2 === 0 ? 1 : -1) * 60],
                          x: [(i % 2 === 0 ? -1 : 1) * 30, (i % 2 === 0 ? 1 : -1) * 50],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: i * 0.12,
                          ease: "easeOut",
                        }}
                      />
                    ))}
                  </div>

                  <div className="relative mx-auto size-20 sm:size-24 flex items-center justify-center">
                    <motion.div
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 rounded-3xl bg-amber-500/20 blur-xl"
                    />
                    <div className="relative size-16 sm:size-20 bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30 text-white">
                      <Trophy className="size-8 sm:size-10" />
                    </div>
                  </div>

                  <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                      Tebrikler! Mağazanız Hazır 🎉
                    </h2>
                    <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                      İlk kurulumu başarıyla tamamladınız. Artık tüm satış kanallarınızı tek merkezden yönetebilirsiniz.
                    </p>
                  </div>

                  {/* Summary Box */}
                  <div className="p-4 rounded-2xl border border-border/80 bg-muted/30 text-left space-y-3 max-w-lg mx-auto">
                    <div className="flex items-center justify-between pb-2 border-b border-border/60">
                      <div>
                        <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                          Mağaza Adı
                        </span>
                        <p className="text-sm font-bold text-foreground">
                          {storeData.storeName || "PazarYönetimi Mağazam"}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <CheckCircle className="size-3.5" /> %100 Hazır
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                        Seçilen Pazaryerleri ({selectedPlatforms.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {selectedPlatforms.map((pid) => {
                          const m = MARKETPLACES.find((x) => x.id === pid);
                          return (
                            <span
                              key={pid}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-background border border-border/80 text-foreground flex items-center gap-1 shadow-2xs"
                            >
                              <Check className="size-3 text-primary" />
                              {m?.name || pid}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Badges Earned */}
                  <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-primary/10 to-violet-500/10 border border-amber-500/20 max-w-lg mx-auto">
                    <p className="text-xs font-bold text-foreground flex items-center justify-center gap-1.5 mb-2">
                      <Gift className="size-3.5 text-amber-500" />
                      Kazanılan Başlangıç Rozetleri
                    </p>
                    <div className="flex justify-center gap-3 sm:gap-6">
                      <div className="flex flex-col items-center">
                        <div className="size-9 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-1">
                          <Star className="size-4" />
                        </div>
                        <span className="text-[10px] font-medium text-muted-foreground">Hızlı Başlangıç</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="size-9 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-1">
                          <Rocket className="size-4" />
                        </div>
                        <span className="text-[10px] font-medium text-muted-foreground">Çoklu Kanal</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="size-9 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-500 mb-1">
                          <Bot className="size-4" />
                        </div>
                        <span className="text-[10px] font-medium text-muted-foreground">PazarAI Kaşifi</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Action Footer */}
          <div className="px-5 sm:px-7 py-4 border-t border-border/60 bg-muted/20 flex items-center justify-between gap-3">
            {/* Back Button */}
            {currentStepIndex > 0 && currentStepIndex < totalSteps - 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="py-2.5 px-4 rounded-xl border border-border bg-background text-foreground hover:bg-muted/50 text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5"
              >
                <ChevronLeft className="size-4" />
                Geri
              </button>
            ) : (
              <button
                type="button"
                onClick={handleClose}
                className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
              >
                Atla ve Panele Git
              </button>
            )}

            {/* Next / Finish Button */}
            <div className="flex items-center gap-2">
              {currentStepIndex < totalSteps - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="py-2.5 px-5 rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-semibold shadow-md shadow-primary/25 hover:opacity-95 transition-all flex items-center gap-1.5"
                >
                  {currentStepIndex === 0 ? "Kuruluma Başla" : "Devam Et"}
                  <ChevronRight className="size-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={finishOnboarding}
                  className="py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-primary text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/30 hover:opacity-95 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? "Kaydediliyor..." : "Panele Geç ve Yönetmeye Başla 🚀"}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
export default UserOnboarding;
