"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Mail, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import Image from 'next/image';

import { isPlatformAdmin } from '@/lib/platform-admin';

export default function LoginForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { signIn } = await import('next-auth/react');
            
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
                callbackUrl: '/admin'
            });

            if (!result?.ok || result?.error) {
                setError("Geçersiz e-posta veya şifre.");
                setIsLoading(false);
                return;
            }

            const sessionRes = await fetch('/api/auth/session');
            const sessionData = await sessionRes.json();

            if (!isPlatformAdmin(sessionData?.user)) {
                const { signOut } = await import('next-auth/react');
                await signOut({ redirect: false });
                setError("Bu panele erişim yetkiniz bulunmuyor. Platform yöneticisi hesabı gereklidir.");
                setIsLoading(false);
                return;
            }

            window.location.href = "/admin";
        } catch (err) {
            console.error('Login error:', err);
            setError("Bir hata oluştu. Lütfen tekrar deneyin.");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#020617]">
            {/* Background Image with Ken Burns Effect */}
            <div className="absolute inset-0 z-0">
                <motion.div
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 20, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
                    className="relative w-full h-full opacity-40"
                >
                    <Image
                        src="/images/auth-bg-3d.png"
                        alt="Background"
                        fill
                        sizes="50vw"
                        className="object-cover"
                        priority
                    />
                </motion.div>
                <div className="absolute inset-0 bg-gradient-to-tr from-[#020617] via-[#020617]/80 to-transparent" />
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full h-px bg-white/5" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full max-w-[480px] px-6 relative z-10"
            >
                {/* Logo & Header */}
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-blue-600/10 border border-blue-500/20 mb-6 backdrop-blur-sm"
                    >
                        <Shield className="w-10 h-10 text-blue-500" />
                    </motion.div>
                    <h1 className="text-4xl font-bold text-white tracking-tight mb-2">
                        Admin Girişi
                    </h1>
                    <p className="text-slate-400 text-lg">
                        Yönetim paneline güvenli erişim
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative">
                    {/* Inner glow effect */}
                    <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

                    <form onSubmit={handleLogin} className="space-y-6 relative z-10">
                        {/* Error Message */}
                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3 text-red-400 text-sm"
                                >
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <span>{error}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Email Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300 ml-1">
                                E-posta Adresi
                            </label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@example.com"
                                    className="w-full h-14 bg-white/[0.02] border border-white/10 rounded-2xl pl-12 pr-4 text-white placeholder-slate-600 outline-none focus:border-blue-500/50 focus:bg-blue-500/5 transition-all text-base"
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300 ml-1">
                                Şifre
                            </label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full h-14 bg-white/[0.02] border border-white/10 rounded-2xl pl-12 pr-4 text-white placeholder-slate-600 outline-none focus:border-blue-500/50 focus:bg-blue-500/5 transition-all text-base"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-14 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 active:scale-[0.98]"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Giriş Yapılıyor...</span>
                                </>
                            ) : (
                                <>
                                    <span>Giriş Yap</span>
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>

                        {/* Demo Access Button */}
                        <div className="pt-2 border-t border-white/5">
                            <a
                                href="/admin?demo=true"
                                className="w-full h-12 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-2xl flex items-center justify-center gap-2 text-xs font-semibold text-purple-300 hover:text-purple-200 transition-all"
                            >
                                <Shield className="w-4 h-4 text-purple-400" />
                                <span>Admin Demosunu İncele (Kayıtsız) ➔</span>
                            </a>
                        </div>
                    </form>
                </div>

                {/* Footer Info */}
                <div className="mt-8 flex flex-col items-center gap-4 text-slate-500">
                    <div className="flex items-center gap-6 text-xs font-medium tracking-wider uppercase">
                        <span className="flex items-center gap-1.5">
                            <div className="w-1 h-1 rounded-full bg-blue-500" />
                            Secure RSA-4096
                        </span>
                        <span className="flex items-center gap-1.5">
                            <div className="w-1 h-1 rounded-full bg-blue-500" />
                            SESLİ ONAY AKTİF
                        </span>
                    </div>
                    <p className="text-[10px] text-slate-600">
                        &copy; 2026 PAZARYONETIMI. Tüm hakları saklıdır.
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
