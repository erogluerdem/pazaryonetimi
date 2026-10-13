"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Sun,
    Moon,
    Monitor,
    Check,
    Sliders,
    Eye,
    Type,
    Droplet,
    Sparkles,
    RotateCcw,
    Circle,
    Square,
    Hexagon,
    LayoutDashboard,
    Zap,
    CheckCircle2
} from 'lucide-react';
import {
    useTheme,
    colorPalettes,
    radiusMap,
    fontMap,
    type ThemeColor,
    type ThemeFont,
    type ThemeRadius,
    type ThemeMode,
    type ThemeSettings,
    type ThemeStyle,
    defaultThemeSettings,
} from '@/providers/theme-provider';

// Tema renkleri (UI için label/gradient)
const themeColors: { id: ThemeColor; name: string; gradient: string }[] = [
    { id: 'blue', name: 'Mavi', gradient: 'from-blue-500 to-cyan-500' },
    { id: 'purple', name: 'Mor', gradient: 'from-purple-500 to-pink-500' },
    { id: 'green', name: 'Yeşil', gradient: 'from-green-500 to-emerald-500' },
    { id: 'orange', name: 'Turuncu', gradient: 'from-orange-500 to-amber-500' },
    { id: 'red', name: 'Kırmızı', gradient: 'from-red-500 to-rose-500' },
    { id: 'pink', name: 'Pembe', gradient: 'from-pink-500 to-fuchsia-500' },
    { id: 'teal', name: 'Turkuaz', gradient: 'from-teal-500 to-cyan-500' },
    { id: 'indigo', name: 'İndigo', gradient: 'from-indigo-500 to-violet-500' },
    { id: 'violet', name: 'Viyole', gradient: 'from-violet-500 to-purple-500' },
    { id: 'rose', name: 'Gül Kurusu', gradient: 'from-rose-500 to-pink-500' },
    { id: 'slate', name: 'Barut / Slate', gradient: 'from-slate-500 to-gray-600' },
];

// Font seçenekleri
const fontOptions: { id: ThemeFont; name: string; sample: string }[] = [
    { id: 'inter', name: 'Inter', sample: 'Aa' },
    { id: 'poppins', name: 'Poppins', sample: 'Aa' },
    { id: 'roboto', name: 'Roboto', sample: 'Aa' },
    { id: 'open-sans', name: 'Open Sans', sample: 'Aa' },
    { id: 'montserrat', name: 'Montserrat', sample: 'Aa' },
    { id: 'lato', name: 'Lato', sample: 'Aa' },
];

// Köşe yuvarlama seçenekleri
const radiusOptions: { id: ThemeRadius; name: string; value: string; icon: any }[] = [
    { id: 'none', name: 'Yok', value: '0px', icon: Square },
    { id: 'sm', name: 'Küçük', value: '4px', icon: Square },
    { id: 'md', name: 'Orta', value: '8px', icon: Square },
    { id: 'lg', name: 'Büyük', value: '12px', icon: Square },
    { id: 'xl', name: 'Çok Büyük', value: '16px', icon: Circle },
    { id: 'full', name: 'Tam Yuvarlak', value: '9999px', icon: Circle },
];

// Hazır tema preset'leri
const presetThemes: { name: string; icon: string; settings: Partial<ThemeSettings> }[] = [
    {
        name: 'Nexora Minimal',
        icon: '⚡',
        settings: { mode: 'dark', color: 'indigo', font: 'inter', radius: 'md', compactMode: false, animations: true, themeStyle: 'nexora' },
    },
    {
        name: 'Nexora Light',
        icon: '✨',
        settings: { mode: 'light', color: 'indigo', font: 'inter', radius: 'md', compactMode: false, animations: true, themeStyle: 'nexora' },
    },
    {
        name: 'Profesyonel',
        icon: '💼',
        settings: { mode: 'dark', color: 'blue', font: 'inter', radius: 'lg', compactMode: false, animations: true, themeStyle: 'default' },
    },
    {
        name: 'Enerji',
        icon: '🔥',
        settings: { mode: 'dark', color: 'orange', font: 'montserrat', radius: 'md', compactMode: false, animations: true, themeStyle: 'default' },
    },
    {
        name: 'Doğa',
        icon: '🌿',
        settings: { mode: 'dark', color: 'green', font: 'poppins', radius: 'xl', compactMode: false, animations: true, themeStyle: 'default' },
    },
    {
        name: 'Lüks',
        icon: '👑',
        settings: { mode: 'dark', color: 'purple', font: 'montserrat', radius: 'lg', compactMode: false, animations: true, themeStyle: 'default' },
    },
    {
        name: 'Minimal',
        icon: '🎯',
        settings: { mode: 'light', color: 'blue', font: 'inter', radius: 'sm', compactMode: true, animations: false, themeStyle: 'default' },
    },
    {
        name: 'Gece',
        icon: '🌙',
        settings: { mode: 'dark', color: 'slate', font: 'lato', radius: 'lg', compactMode: false, animations: true, themeStyle: 'default' },
    },
];

export default function ThemePage() {
    const { theme, setThemeSettings, resetTheme, resolvedMode } = useTheme();
    const [saved, setSaved] = useState(false);

    // "Kaydedildi" efekti
    useEffect(() => {
        if (saved) {
            const t = setTimeout(() => setSaved(false), 2000);
            return () => clearTimeout(t);
        }
    }, [saved]);

    const applyPreset = (settings: Partial<ThemeSettings>) => {
        setThemeSettings(settings);
        setSaved(true);
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Tema & Görünüm Özelleştirme</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Dashboard ve kullanıcı paneli görünümünü kişiselleştirin — değişiklikler anında uygulanır</p>
                </div>
                <div className="flex items-center gap-3">
                    {saved && (
                        <motion.span
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-xs font-semibold text-emerald-500 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
                        >
                            <Check size={14} /> Tercihler Kaydedildi
                        </motion.span>
                    )}
                    <button
                        onClick={() => { resetTheme(); setSaved(true); }}
                        className="flex items-center gap-2 px-3.5 py-2 bg-card border border-border hover:border-rose-500/30 text-muted-foreground hover:text-rose-500 rounded-xl text-xs font-semibold transition-all shadow-xs"
                    >
                        <RotateCcw size={14} />
                        Sıfırla
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Sol Panel - Ayarlar */}
                <div className="xl:col-span-2 space-y-6">

                    {/* BÖLÜM 1: TEMA MİMARİSİ (VARSAYILAN VS NEXORA CRM) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-card border border-border rounded-2xl p-6 shadow-xs"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2.5">
                                <LayoutDashboard size={20} className="text-primary" />
                                Tema Tasarım Mimarisi
                            </h2>
                            <span className="text-[11px] font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-md border border-border">
                                {theme.themeStyle === 'nexora' ? 'Nexora CRM Aktif' : 'Kurumsal Pro Aktif'}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                            Panelin genel tasarım dilini belirleyin. Nexora CRM tasarımı; nokta ızgaralı modern arkaplan, oklch minimal kartlar ve sadeleştirilmiş tablo yapısı sunar.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Option: Default */}
                            <button
                                type="button"
                                onClick={() => {
                                    setThemeSettings({ themeStyle: 'default' });
                                    setSaved(true);
                                }}
                                className={`relative p-5 rounded-xl border-2 text-left transition-all ${
                                    theme.themeStyle !== 'nexora'
                                        ? 'border-primary bg-primary/5 shadow-xs ring-2 ring-primary/20'
                                        : 'border-border hover:border-primary/40 bg-card'
                                }`}
                            >
                                {theme.themeStyle !== 'nexora' && (
                                    <div className="absolute top-4 right-4 size-5 bg-primary text-white rounded-full flex items-center justify-center">
                                        <Check size={12} />
                                    </div>
                                )}
                                <div className="font-bold text-foreground text-sm flex items-center gap-2">
                                    <span>Pro Kurumsal</span>
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground">Varsayılan</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                                    Canlı renk geçişleri, zengin gölgeler ve klasik kurumsal SaaS yönetim arayüzü.
                                </p>
                                <div className="mt-4 h-12 rounded-lg bg-surface border border-border p-2 flex items-center gap-2">
                                    <div className="w-8 h-full rounded bg-indigo-600/30" />
                                    <div className="flex-1 space-y-1">
                                        <div className="h-2 w-3/4 rounded bg-border" />
                                        <div className="h-2 w-1/2 rounded bg-border/60" />
                                    </div>
                                </div>
                            </button>

                            {/* Option: Nexora */}
                            <button
                                type="button"
                                onClick={() => {
                                    setThemeSettings({ themeStyle: 'nexora', font: 'inter', radius: 'md' });
                                    setSaved(true);
                                }}
                                className={`relative p-5 rounded-xl border-2 text-left transition-all overflow-hidden ${
                                    theme.themeStyle === 'nexora'
                                        ? 'border-primary bg-primary/5 shadow-xs ring-2 ring-primary/20'
                                        : 'border-border hover:border-primary/40 bg-card'
                                }`}
                            >
                                <div className="absolute top-0 right-0 px-2.5 py-0.5 bg-gradient-to-l from-indigo-600 to-primary text-white text-[10px] font-bold rounded-bl-lg uppercase tracking-wider">
                                    Yeni Tema
                                </div>
                                {theme.themeStyle === 'nexora' && (
                                    <div className="absolute top-7 right-4 size-5 bg-primary text-white rounded-full flex items-center justify-center">
                                        <Check size={12} />
                                    </div>
                                )}
                                <div className="font-bold text-foreground text-sm flex items-center gap-2">
                                    <span>Nexora CRM</span>
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">Minimal</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                                    Nokta ızgaralı arkaplan, oklch minimal kartlar, zarif kenarlıklar ve keskin tablo yapısı.
                                </p>
                                <div className="mt-4 h-12 rounded-lg border border-border bg-background relative overflow-hidden p-2 flex items-center gap-2">
                                    <div className="nexora-dot-pattern" />
                                    <div className="relative z-10 w-7 h-full rounded-md bg-foreground/10 border border-border" />
                                    <div className="relative z-10 flex-1 space-y-1">
                                        <div className="h-2 w-2/3 rounded-xs bg-foreground/20" />
                                        <div className="h-1.5 w-1/3 rounded-xs bg-primary" />
                                    </div>
                                </div>
                            </button>
                        </div>
                    </motion.div>

                    {/* BÖLÜM 2: GÖRÜNÜM MODU */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="bg-card border border-border rounded-2xl p-6 shadow-xs"
                    >
                        <h2 className="text-base sm:text-lg font-bold text-foreground mb-4 flex items-center gap-2.5">
                            <Sun size={20} className="text-primary" />
                            Görünüm Modu
                        </h2>
                        <div className="grid grid-cols-3 gap-3 sm:gap-4">
                            {([
                                { id: 'light' as ThemeMode, label: 'Açık', icon: Sun, desc: 'Aydınlık ortamlar için' },
                                { id: 'dark' as ThemeMode, label: 'Koyu', icon: Moon, desc: 'Göz yorgunluğunu azaltır' },
                                { id: 'system' as ThemeMode, label: 'Sistem', icon: Monitor, desc: 'Cihaz ayarını takip et' },
                            ]).map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => {
                                        setThemeSettings({ mode: option.id });
                                        setSaved(true);
                                    }}
                                    className={`relative flex flex-col items-center gap-3 p-4 sm:p-5 rounded-xl border-2 transition-all ${
                                        theme.mode === option.id
                                            ? 'border-primary bg-primary/5 shadow-xs'
                                            : 'border-border hover:border-primary/30 bg-card'
                                    }`}
                                >
                                    {theme.mode === option.id && (
                                        <div className="absolute top-2.5 right-2.5 size-4 sm:size-5 bg-primary rounded-full flex items-center justify-center text-white">
                                            <Check size={11} />
                                        </div>
                                    )}
                                    <div className={`p-3 rounded-xl ${theme.mode === option.id ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                        <option.icon size={22} />
                                    </div>
                                    <div className="text-center">
                                        <div className="font-semibold text-foreground text-xs sm:text-sm">{option.label}</div>
                                        <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 hidden sm:block">{option.desc}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </motion.div>

                    {/* BÖLÜM 3: VURGU RENGİ */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-card border border-border rounded-2xl p-6 shadow-xs"
                    >
                        <h2 className="text-base sm:text-lg font-bold text-foreground mb-4 flex items-center gap-2.5">
                            <Droplet size={20} className="text-primary" />
                            Vurgu Rengi (Accent)
                        </h2>
                        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-11 gap-2.5">
                            {themeColors.map((color) => {
                                const palette = colorPalettes[color.id] || colorPalettes.blue;
                                const isSelected = theme.color === color.id;
                                return (
                                    <button
                                        key={color.id}
                                        onClick={() => {
                                            setThemeSettings({ color: color.id });
                                            setSaved(true);
                                        }}
                                        className={`relative aspect-square rounded-xl transition-transform hover:scale-105 flex items-center justify-center shadow-xs ${
                                            isSelected ? 'ring-2 ring-offset-2 ring-primary scale-105' : ''
                                        }`}
                                        style={{ backgroundColor: palette.primary }}
                                        title={color.name}
                                    >
                                        {isSelected && (
                                            <Check size={16} className="text-white drop-shadow-sm" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Aktif Vurgu Rengi:</span>
                            <span className="text-xs font-semibold text-foreground capitalize">
                                {themeColors.find(c => c.id === theme.color)?.name} ({colorPalettes[theme.color]?.primary})
                            </span>
                        </div>
                    </motion.div>

                    {/* BÖLÜM 4: YAZI TİPİ */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="bg-card border border-border rounded-2xl p-6 shadow-xs"
                    >
                        <h2 className="text-base sm:text-lg font-bold text-foreground mb-4 flex items-center gap-2.5">
                            <Type size={20} className="text-primary" />
                            Yazı Tipi (Typography)
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {fontOptions.map((font) => (
                                <button
                                    key={font.id}
                                    onClick={() => {
                                        setThemeSettings({ font: font.id });
                                        setSaved(true);
                                    }}
                                    className={`flex items-center justify-between p-3.5 rounded-xl border-2 transition-all ${
                                        theme.font === font.id
                                            ? 'border-primary bg-primary/5 shadow-xs'
                                            : 'border-border hover:border-primary/30 bg-card'
                                    }`}
                                    style={{ fontFamily: fontMap[font.id] }}
                                >
                                    <span className="font-semibold text-xs sm:text-sm text-foreground">{font.name}</span>
                                    <span className="text-xl text-muted-foreground">{font.sample}</span>
                                </button>
                            ))}
                        </div>
                    </motion.div>

                    {/* BÖLÜM 5: KÖŞE YUVARLAMA */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-card border border-border rounded-2xl p-6 shadow-xs"
                    >
                        <h2 className="text-base sm:text-lg font-bold text-foreground mb-4 flex items-center gap-2.5">
                            <Hexagon size={20} className="text-primary" />
                            Köşe Yuvarlama (Radius)
                        </h2>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                            {radiusOptions.map((radius) => (
                                <button
                                    key={radius.id}
                                    onClick={() => {
                                        setThemeSettings({ radius: radius.id });
                                        setSaved(true);
                                    }}
                                    className={`flex flex-col items-center gap-2 p-3.5 border-2 transition-all ${
                                        theme.radius === radius.id
                                            ? 'border-primary bg-primary/5 shadow-xs'
                                            : 'border-border hover:border-primary/30 bg-card'
                                    }`}
                                    style={{ borderRadius: radius.value }}
                                >
                                    <div
                                        className="size-7 bg-primary/20 border border-primary/40"
                                        style={{ borderRadius: radius.value }}
                                    />
                                    <span className="text-xs font-medium text-foreground">{radius.name}</span>
                                </button>
                            ))}
                        </div>
                    </motion.div>

                    {/* BÖLÜM 6: DİĞER TERCİHLER */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="bg-card border border-border rounded-2xl p-6 shadow-xs"
                    >
                        <h2 className="text-base sm:text-lg font-bold text-foreground mb-4 flex items-center gap-2.5">
                            <Sliders size={20} className="text-primary" />
                            Arayüz Düzeni ve Yoğunluk
                        </h2>
                        <div className="space-y-3">
                            {/* Kompakt Mod */}
                            <div className="flex items-center justify-between p-3.5 bg-muted/30 border border-border/80 rounded-xl">
                                <div>
                                    <div className="text-xs sm:text-sm font-semibold text-foreground">Arayüz Yoğunluğu (Kompakt Mod)</div>
                                    <div className="text-[11px] text-muted-foreground">Tablo ve kart aralıklarını daraltarak daha fazla veri gösterir</div>
                                </div>
                                <button
                                    onClick={() => {
                                        setThemeSettings({ compactMode: !theme.compactMode });
                                        setSaved(true);
                                    }}
                                    className={`relative w-11 h-6 rounded-full transition-colors ${
                                        theme.compactMode ? 'bg-primary' : 'bg-slate-400 dark:bg-slate-700'
                                    }`}
                                >
                                    <div
                                        className={`absolute top-1 size-4 bg-white rounded-full transition-transform ${
                                            theme.compactMode ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </div>

                            {/* Animasyonlar */}
                            <div className="flex items-center justify-between p-3.5 bg-muted/30 border border-border/80 rounded-xl">
                                <div>
                                    <div className="text-xs sm:text-sm font-semibold text-foreground">Arayüz Animasyonları</div>
                                    <div className="text-[11px] text-muted-foreground">Geçiş ve kayma animasyonlarını etkinleştir</div>
                                </div>
                                <button
                                    onClick={() => {
                                        setThemeSettings({ animations: !theme.animations });
                                        setSaved(true);
                                    }}
                                    className={`relative w-11 h-6 rounded-full transition-colors ${
                                        theme.animations ? 'bg-primary' : 'bg-slate-400 dark:bg-slate-700'
                                    }`}
                                >
                                    <div
                                        className={`absolute top-1 size-4 bg-white rounded-full transition-transform ${
                                            theme.animations ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </div>

                            {/* Sidebar Pozisyonu */}
                            <div className="flex items-center justify-between p-3.5 bg-muted/30 border border-border/80 rounded-xl">
                                <div>
                                    <div className="text-xs sm:text-sm font-semibold text-foreground">Kenar Çubuğu Konumu</div>
                                    <div className="text-[11px] text-muted-foreground">Navigasyon menüsünün ekrandaki yeri</div>
                                </div>
                                <div className="flex gap-2">
                                    {(['left', 'right'] as const).map((pos) => (
                                        <button
                                            key={pos}
                                            onClick={() => {
                                                setThemeSettings({ sidebarPosition: pos });
                                                setSaved(true);
                                            }}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                                theme.sidebarPosition === pos
                                                    ? 'bg-primary text-white shadow-xs'
                                                    : 'bg-card text-muted-foreground hover:text-foreground border border-border'
                                            }`}
                                        >
                                            {pos === 'left' ? 'Sol' : 'Sağ'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Sağ Panel - Canlı Önizleme + Hazır Temalar */}
                <div className="space-y-6">
                    {/* Canlı Önizleme */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-card border border-border rounded-2xl p-6 shadow-xs sticky top-24"
                    >
                        <h2 className="text-base sm:text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                            <Eye size={18} className="text-primary" />
                            Canlı Arayüz Önizleme
                        </h2>

                        {/* Interactive Preview Container */}
                        <div className="bg-background rounded-xl border border-border overflow-hidden relative shadow-xs">
                            {/* Dot matrix if nexora theme */}
                            {theme.themeStyle === 'nexora' && (
                                <div className="nexora-dot-pattern" />
                            )}

                            {/* Header bar */}
                            <div className="relative z-10 h-9 bg-card border-b border-border flex items-center justify-between px-3">
                                <div className="flex items-center gap-2">
                                    <div className="size-2 rounded-full bg-red-500/80" />
                                    <div className="size-2 rounded-full bg-yellow-500/80" />
                                    <div className="size-2 rounded-full bg-green-500/80" />
                                    <span className="text-[10px] font-semibold text-muted-foreground ml-1">
                                        {theme.themeStyle === 'nexora' ? 'Nexora Workspace' : 'Pazaryonetimi'}
                                    </span>
                                </div>
                                <span
                                    className="px-2 py-0.5 rounded text-[9px] font-bold text-white shadow-xs"
                                    style={{ backgroundColor: colorPalettes[theme.color]?.primary || '#3b82f6' }}
                                >
                                    {theme.themeStyle === 'nexora' ? 'NEXORA' : 'PRO'}
                                </span>
                            </div>

                            {/* Body layout */}
                            <div className="relative z-10 flex min-h-[220px]">
                                {/* Mini Sidebar */}
                                <div className={`w-12 bg-muted/40 border-r border-border p-2 space-y-2 shrink-0 ${
                                    theme.sidebarPosition === 'right' ? 'order-last border-r-0 border-l' : ''
                                }`}>
                                    {[1, 2, 3, 4].map((i) => (
                                        <div
                                            key={i}
                                            className={`w-full aspect-square rounded-md transition-colors ${
                                                i === 1 ? 'bg-primary/20 border border-primary/30' : 'bg-muted border border-border'
                                            }`}
                                        />
                                    ))}
                                </div>

                                {/* Mini Content */}
                                <div className="flex-1 p-3 space-y-2.5">
                                    {/* Mini KPI Cards */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="p-2.5 rounded-lg border border-border bg-card shadow-xs">
                                            <div className="text-[9px] text-muted-foreground">Gelir (Bugün)</div>
                                            <div className="text-xs font-bold text-foreground mt-0.5">₺24.850</div>
                                            <span className="text-[8px] font-semibold text-emerald-500">▲ %14.2</span>
                                        </div>
                                        <div className="p-2.5 rounded-lg border border-border bg-card shadow-xs">
                                            <div className="text-[9px] text-muted-foreground">Siparişler</div>
                                            <div className="text-xs font-bold text-foreground mt-0.5">142 Adet</div>
                                            <span className="text-[8px] font-semibold text-emerald-500">▲ %8.1</span>
                                        </div>
                                    </div>

                                    {/* Mini Nexora Table */}
                                    <div className="rounded-lg border border-border bg-card overflow-hidden">
                                        <div className="bg-muted/40 px-2.5 py-1 text-[9px] font-semibold text-muted-foreground border-b border-border flex justify-between">
                                            <span>SİPARİŞ / MAĞAZA</span>
                                            <span>DURUM</span>
                                        </div>
                                        <div className="p-2 space-y-1.5">
                                            <div className="flex items-center justify-between text-[10px]">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="size-4 rounded-full bg-orange-500/20 text-orange-600 flex items-center justify-center text-[8px] font-bold">T</div>
                                                    <span className="font-medium text-foreground">Trendyol #8491</span>
                                                </div>
                                                <span className="px-1.5 py-0.2 rounded-full text-[8px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                                    Tamamlandı
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-[10px]">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="size-4 rounded-full bg-blue-500/20 text-blue-600 flex items-center justify-center text-[8px] font-bold">H</div>
                                                    <span className="font-medium text-foreground">Hepsiburada #2041</span>
                                                </div>
                                                <span className="px-1.5 py-0.2 rounded-full text-[8px] font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                                                    Kargoda
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Current Settings Summary */}
                        <div className="mt-5 space-y-2 text-xs">
                            <div className="flex items-center justify-between py-1 border-b border-border/60">
                                <span className="text-muted-foreground">Mimari:</span>
                                <span className="font-semibold text-foreground capitalize">
                                    {theme.themeStyle === 'nexora' ? 'Nexora Minimal' : 'Pro Kurumsal'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-1 border-b border-border/60">
                                <span className="text-muted-foreground">Mod:</span>
                                <span className="font-semibold text-foreground capitalize">
                                    {theme.mode === 'dark' ? 'Koyu' : theme.mode === 'light' ? 'Açık' : 'Sistem'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-1 border-b border-border/60">
                                <span className="text-muted-foreground">Vurgu:</span>
                                <div className="flex items-center gap-2">
                                    <div
                                        className="size-3 rounded-full"
                                        style={{ backgroundColor: colorPalettes[theme.color]?.primary }}
                                    />
                                    <span className="font-semibold text-foreground capitalize">
                                        {themeColors.find(c => c.id === theme.color)?.name}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between py-1 border-b border-border/60">
                                <span className="text-muted-foreground">Köşe Yuvarlama:</span>
                                <span className="font-semibold text-foreground">
                                    {radiusOptions.find(r => r.id === theme.radius)?.name}
                                </span>
                            </div>
                        </div>

                        {/* Preset Themes */}
                        <div className="mt-6 pt-5 border-t border-border">
                            <h3 className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                                <Sparkles size={13} className="text-primary" />
                                1-Tık Hazır Presetler
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                {presetThemes.map((preset) => (
                                    <button
                                        key={preset.name}
                                        onClick={() => applyPreset(preset.settings)}
                                        className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 hover:bg-muted border border-border hover:border-primary/40 transition-all text-left group"
                                    >
                                        <span className="text-base shrink-0">{preset.icon}</span>
                                        <span className="text-xs font-medium text-foreground group-hover:text-primary truncate">
                                            {preset.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
