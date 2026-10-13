'use client';

import React, { useState, Suspense, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Loader2, ArrowRight, Chrome, AlertCircle } from 'lucide-react';
import { AuthShell } from '@/components/auth/AuthShell';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (!result?.ok || result.error) {
        setError('Kimlik doğrulama başarısız. Lütfen bilgilerinizi kontrol edin.');
        setIsLoading(false);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError('Güvenli bağlantı sırasında bir hata oluştu. Lütfen tekrar deneyin.');
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    signIn('google', { callbackUrl });
  };

  return (
    <AuthShell
      badge="Modern e-ticaret ve pazaryeri ekosistemi"
      title={
        <>
          Ticaretinizi <span className="text-primary font-bold">daha akıllı</span> yönetin.
        </>
      }
      description="Pazar Yönetimi ile Trendyol, Hepsiburada, Amazon ve tüm pazaryerlerindeki siparişlerinizi, ürünlerinizi, stoklarınızı ve ekibinizi tek bir merkezden kusursuzca yönetin."
      topLink={{
        text: 'Hesabınız yok mu?',
        linkText: 'Hesap oluşturun',
        href: '/register',
      }}
    >
      <h2 className="text-xl font-semibold tracking-tight text-foreground">Tekrar hoş geldiniz</h2>
      <p className="mb-6 mt-1.5 text-xs sm:text-sm text-muted-foreground">
        Pazaryonetimi CRM hesabınıza giriş yapın.
      </p>

      {/* Social Login Buttons */}
      <div className="grid gap-2.5">
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg border border-border bg-background hover:bg-muted/50 text-xs font-semibold text-foreground shadow-xs transition-colors"
        >
          <Chrome className="size-4 text-primary" />
          Google ile devam et
        </button>
      </div>

      {/* OR Divider */}
      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        <span className="uppercase tracking-wider text-[10px]">VEYA</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Error Message */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2"
          >
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Credentials Form */}
      <form className="grid gap-4" onSubmit={handleSubmit} onChange={() => setError(null)}>
        <div className="grid gap-1.5">
          <label htmlFor="email" className="text-xs font-medium text-foreground">
            İş e-postası
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ornek@sirketiniz.com"
            autoComplete="email"
            required
            className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-xs"
          />
        </div>

        <div className="grid gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="password" className="text-xs font-medium text-foreground">
              Şifre
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-primary underline-offset-4 hover:underline"
            >
              Şifremi unuttum?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifrenizi girin"
              autoComplete="current-password"
              minLength={8}
              required
              className="w-full pl-3.5 pr-10 py-2.5 rounded-lg border border-input bg-background/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-xs"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
              aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground">Şifre en az 8 karakter olmalıdır.</p>
        </div>

        {/* Remember me */}
        <div className="flex items-center gap-2">
          <input
            id="rememberMe"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="size-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
          />
          <label htmlFor="rememberMe" className="text-xs text-muted-foreground cursor-pointer select-none">
            Beni hatırla (30 gün)
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 py-2.5 px-4 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Giriş yapılıyor...
            </>
          ) : (
            <>
              Giriş Yap
              <ArrowRight className="size-4" />
            </>
          )}
        </button>
      </form>

      {/* 2FA Quick Link if already enabled */}
      <div className="mt-4 pt-3 border-t border-border/50 text-center">
        <Link
          href="/two-factor"
          className="text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5"
        >
          İki faktörlü doğrulama kodu ile mi giriş yapacaksınız?
        </Link>
      </div>

      <p className="mt-5 text-center text-[11px] leading-relaxed text-muted-foreground">
        Giriş yaparak{' '}
        <Link href="/kurumsal/kullanim-kosullari" className="underline underline-offset-2 hover:text-foreground">
          Kullanım Koşulları
        </Link>{' '}
        ve{' '}
        <Link href="/kurumsal/gizlilik" className="underline underline-offset-2 hover:text-foreground">
          Gizlilik Politikası
        </Link>
        'nı kabul etmiş sayılırsınız.
      </p>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">Yükleniyor...</div>}>
      <LoginForm />
    </Suspense>
  );
}
