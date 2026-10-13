"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useSecurity } from '@/lib/hooks';
import { PasswordChangeForm } from '@/components/settings/PasswordChangeForm';
import {
    Shield,
    Key,
    Lock,
    Unlock,
    Eye,
    EyeOff,
    Smartphone,
    Mail,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Settings,
    Users,
    Globe,
    RefreshCw,
    LogOut,
    Fingerprint,
    Bell,
    History,
    MapPin,
    Monitor,
    Laptop,
    ChevronRight,
    Copy,
    Download,
    Trash2
} from 'lucide-react';

const loginHistoryData: any[] = [];
const activeSessionsData: any[] = [];
const apiKeysData: any[] = [];

export default function SecurityPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [securityAlerts, setSecurityAlerts] = useState<Array<{ id: string; type: string; message: string; date: string }>>([]);
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [loginAlerts, setLoginAlerts] = useState(true);
    const [showApiKey, setShowApiKey] = useState<string | number | null>(null);
    const [activeTab, setActiveTab] = useState('overview');

    const { loginHistory: apiLoginHistory, sessions: apiSessions, apiKeys: apiApiKeys, loading } = useSecurity();

    useEffect(() => {
        fetch('/api/security/alerts', { cache: 'no-store' })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (!data) return;
                setTwoFactorEnabled(Boolean(data.twoFactorEnabled));
                if (Array.isArray(data.alerts)) setSecurityAlerts(data.alerts);
            })
            .catch(() => {});
    }, []);

    const loginHistory = Array.isArray(apiLoginHistory) ? apiLoginHistory : loginHistoryData;
    const activeSessions = Array.isArray(apiSessions) ? apiSessions : activeSessionsData;
    const apiKeys = Array.isArray(apiApiKeys) ? apiApiKeys : apiKeysData;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Güvenlik verileri yükleniyor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
                        <Shield className="w-8 h-8 text-red-500" />
                        Güvenlik
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Hesap güvenliği ve erişim yönetimi
                    </p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-red-600 rounded-xl text-white text-sm font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-500/20"
                >
                    <RefreshCw className="w-4 h-4" />
                    Güvenlik Taraması
                </motion.button>
            </div>

            {/* Security Score */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-red-500/10 to-red-600/5 dark:from-red-900/40 dark:to-red-800/20 rounded-2xl p-6 border border-red-500/20"
            >
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-foreground mb-2">Güvenlik Skoru</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Hesabınızın güvenlik durumu</p>
                    </div>
                    <div className="flex items-center gap-6 flex-wrap">
                        <div className="text-center">
                            <div className="relative w-24 h-24">
                                <svg className="w-24 h-24 transform -rotate-90">
                                    <circle cx="48" cy="48" r="40" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="8" fill="none" />
                                    <circle
                                        cx="48" cy="48" r="40"
                                        stroke="#10b981"
                                        strokeWidth="8"
                                        fill="none"
                                        strokeDasharray={`${85 * 2.51} 251`}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-2xl font-black text-foreground">85</span>
                                </div>
                            </div>
                            <span className="text-sm text-green-600 dark:text-green-400 font-bold">İyi</span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                                <span className="text-slate-600 dark:text-slate-300">İki faktörlü doğrulama aktif</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                                <span className="text-slate-600 dark:text-slate-300">Güçlü şifre kullanılıyor</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                                <span className="text-slate-600 dark:text-slate-300">Şifre 90 gündür değişmedi</span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Tabs */}
            <div className="flex items-center gap-2 border-b border-border">
                {['overview', 'sessions', 'api', 'logs'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-3 text-sm font-bold transition-colors border-b-2 -mb-px ${
                            activeTab === tab
                                ? 'text-red-600 dark:text-red-400 border-red-500'
                                : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-foreground'
                        }`}
                    >
                        {tab === 'overview' && 'Genel'}
                        {tab === 'sessions' && 'Aktif Oturumlar'}
                        {tab === 'api' && 'API Anahtarları'}
                        {tab === 'logs' && 'Giriş Geçmişi'}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Password Settings */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-surface rounded-2xl p-6 border border-border"
                    >
                        <PasswordChangeForm />
                    </motion.div>

                    {/* Two-Factor Auth */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-surface rounded-2xl p-6 border border-border"
                    >
                        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                            <Smartphone className="w-5 h-5 text-red-500" />
                            İki Faktörlü Doğrulama
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-background rounded-xl border border-border">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-500/20 rounded-lg">
                                        <Fingerprint className="w-5 h-5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div>
                                        <span className="text-sm font-bold text-foreground">Authenticator Uygulaması</span>
                                        <p className="text-xs text-slate-500">Google Authenticator ile bağlı</p>
                                    </div>
                                </div>
                                <button className={`relative w-12 h-6 rounded-full transition-colors ${
                                    twoFactorEnabled ? 'bg-green-600' : 'bg-slate-300 dark:bg-slate-700'
                                }`} onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}>
                                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                                        twoFactorEnabled ? 'translate-x-6' : 'translate-x-0.5'
                                    }`} />
                                </button>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-background rounded-xl border border-border">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/20 rounded-lg">
                                        <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <span className="text-sm font-bold text-foreground">E-posta Doğrulama</span>
                                        <p className="text-xs text-slate-500">info@example.com</p>
                                    </div>
                                </div>
                                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="flex items-center justify-between p-4 bg-background rounded-xl border border-border">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-500/20 rounded-lg">
                                        <Smartphone className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div>
                                        <span className="text-sm font-bold text-foreground">SMS Doğrulama</span>
                                        <p className="text-xs text-slate-500">+90 *** *** 45 67</p>
                                    </div>
                                </div>
                                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>

                            <div className="pt-2">
                                <Link
                                    href="/two-factor"
                                    className="flex items-center justify-between w-full py-2.5 px-3.5 text-xs font-semibold rounded-xl border border-border bg-muted/40 hover:bg-muted text-foreground transition-colors group"
                                >
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-3.5 h-3.5 text-primary" />
                                        <span>2FA Giriş ve Doğrulama Ekranını Test Et</span>
                                    </div>
                                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                                </Link>
                            </div>
                        </div>
                    </motion.div>

                    {/* Notifications */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-surface rounded-2xl p-6 border border-border"
                    >
                        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                            <Bell className="w-5 h-5 text-red-500" />
                            Güvenlik Bildirimleri
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-background rounded-xl border border-border">
                                <span className="text-sm text-slate-600 dark:text-slate-300">Yeni giriş e-posta bildirimi</span>
                                <button className={`relative w-10 h-5 rounded-full transition-colors ${
                                    emailNotifications ? 'bg-red-600' : 'bg-slate-300 dark:bg-slate-700'
                                }`} onClick={() => setEmailNotifications(!emailNotifications)}>
                                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${
                                        emailNotifications ? 'translate-x-5' : 'translate-x-0.5'
                                    }`} />
                                </button>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-background rounded-xl border border-border">
                                <span className="text-sm text-slate-600 dark:text-slate-300">Şüpheli aktivite uyarıları</span>
                                <button className={`relative w-10 h-5 rounded-full transition-colors ${
                                    loginAlerts ? 'bg-red-600' : 'bg-slate-300 dark:bg-slate-700'
                                }`} onClick={() => setLoginAlerts(!loginAlerts)}>
                                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${
                                        loginAlerts ? 'translate-x-5' : 'translate-x-0.5'
                                    }`} />
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Security Alerts */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-surface rounded-2xl p-6 border border-border"
                    >
                        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                            Son Uyarılar
                        </h3>
                        <div className="space-y-3">
                            {securityAlerts.map((alert) => (
                                <div key={alert.id} className={`p-3 rounded-xl ${
                                    alert.type === 'warning' ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-blue-500/10 border border-blue-500/20'
                                }`}>
                                    <div className="flex items-start gap-3">
                                        {alert.type === 'warning' ? (
                                            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                                        ) : (
                                            <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                        )}
                                        <div>
                                            <p className="text-sm text-slate-600 dark:text-slate-300">{alert.message}</p>
                                            <p className="text-xs text-slate-500 mt-1">{alert.date}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Sessions Tab */}
            {activeTab === 'sessions' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-surface rounded-2xl border border-border overflow-hidden"
                >
                    <div className="p-4 border-b border-border flex items-center justify-between">
                        <h3 className="text-lg font-bold text-foreground">Aktif Oturumlar</h3>
                        <button className="text-sm text-red-600 dark:text-red-400 hover:text-red-500 font-bold">
                            Tüm oturumları kapat
                        </button>
                    </div>
                    <div className="divide-y divide-border">
                        {activeSessions.map((session) => (
                            <div key={session.id} className="p-4 hover:bg-background/50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-background rounded-xl border border-border">
                                            {session.device.includes('iPhone') || session.device.includes('Android') ? (
                                                <Smartphone className="w-5 h-5 text-slate-500" />
                                            ) : (
                                                <Monitor className="w-5 h-5 text-slate-500" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-foreground font-bold">{session.device}</span>
                                                {(session as any).isCurrent && (
                                                    <span className="px-2 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg text-xs font-bold border border-green-500/20">
                                                        Mevcut
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    {session.location}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {session.lastActive}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    {!(session as any).isCurrent && (
                                        <button className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg text-sm font-bold hover:bg-red-500/20 transition-colors border border-red-500/20">
                                            <LogOut className="w-4 h-4" />
                                            Çıkış Yap
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* API Keys Tab */}
            {activeTab === 'api' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-surface rounded-2xl border border-border overflow-hidden"
                >
                    <div className="p-4 border-b border-border flex items-center justify-between">
                        <h3 className="text-lg font-bold text-foreground">API Anahtarları</h3>
                        <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-500/20">
                            <Key className="w-4 h-4" />
                            Yeni Anahtar
                        </button>
                    </div>
                    <div className="divide-y divide-border">
                        {apiKeys.map((apiKey) => (
                            <div key={apiKey.id} className="p-4 hover:bg-background/50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-foreground font-bold">{apiKey.name}</span>
                                            <span className={`px-2 py-0.5 rounded-lg text-xs font-bold border ${
                                                (apiKey as any).isActive !== false && (apiKey as any).status !== 'inactive' ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20'
                                            }`}>
                                                {(apiKey as any).isActive !== false && (apiKey as any).status !== 'inactive' ? 'Aktif' : 'Pasif'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <code className="px-2 py-1 bg-background border border-border rounded-lg text-sm text-slate-600 dark:text-slate-300 font-mono">
                                                {showApiKey === apiKey.id ? apiKey.key.replace('*****', 'abc12xyz89') : apiKey.key}
                                            </code>
                                            <button
                                                onClick={() => setShowApiKey(showApiKey === apiKey.id ? null : apiKey.id)}
                                                className="p-1 text-slate-400 hover:text-foreground"
                                            >
                                                {showApiKey === apiKey.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                            <button className="p-1 text-slate-400 hover:text-foreground">
                                                <Copy className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="text-xs text-slate-500 mt-2">
                                            Oluşturulma: {(apiKey as any).createdAt || (apiKey as any).created} • Son kullanım: {apiKey.lastUsed}
                                        </div>
                                    </div>
                                    <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Logs Tab */}
            {activeTab === 'logs' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-surface rounded-2xl border border-border overflow-hidden"
                >
                    <div className="p-4 border-b border-border flex items-center justify-between">
                        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                            <History className="w-5 h-5 text-red-500" />
                            Giriş Geçmişi
                        </h3>
                        <button className="flex items-center gap-2 text-sm text-slate-500 hover:text-foreground font-bold">
                            <Download className="w-4 h-4" />
                            Dışa Aktar
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-background">
                                <tr>
                                    <th className="text-left p-4 text-slate-500 text-sm font-bold">Cihaz</th>
                                    <th className="text-left p-4 text-slate-500 text-sm font-bold">IP Adresi</th>
                                    <th className="text-left p-4 text-slate-500 text-sm font-bold">Konum</th>
                                    <th className="text-left p-4 text-slate-500 text-sm font-bold">Tarih</th>
                                    <th className="text-center p-4 text-slate-500 text-sm font-bold">Durum</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {loginHistory.map((log) => (
                                    <tr key={log.id} className="hover:bg-background/50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-foreground font-medium">{log.device}</span>
                                                {(log as any).current && (
                                                    <span className="px-2 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg text-xs font-bold border border-green-500/20">
                                                        Mevcut
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <code className="text-slate-500 text-sm font-mono">{log.ip}</code>
                                        </td>
                                        <td className="p-4 text-slate-600 dark:text-slate-300">{log.location}</td>
                                        <td className="p-4 text-slate-500 text-sm">{log.date}</td>
                                        <td className="p-4 text-center">
                                            {log.status === 'success' ? (
                                                <span className="px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full text-xs font-bold flex items-center justify-center gap-1 w-fit mx-auto border border-green-500/20">
                                                    <CheckCircle2 className="w-3 h-3" /> Başarılı
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 bg-red-500/10 text-red-600 dark:text-red-400 rounded-full text-xs font-bold flex items-center justify-center gap-1 w-fit mx-auto border border-red-500/20">
                                                    <AlertTriangle className="w-3 h-3" /> Başarısız
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
