'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { isPlatformAdmin } from '@/lib/platform-admin';
import { Loader2, Shield, Store, X, ArrowRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('demo') === 'true') {
        localStorage.setItem('pazaryonetimi_admin_demo', 'true');
        return true;
      }
      return localStorage.getItem('pazaryonetimi_admin_demo') === 'true';
    }
    return false;
  });

  useEffect(() => {
    if (isLoginPage || status === 'loading') return;

    // In demo mode, bypass auth checks
    if (isDemoMode) return;

    if (status === 'unauthenticated') {
      router.replace(`/admin/login?callbackUrl=${encodeURIComponent(pathname ?? '/admin')}`);
      return;
    }

    const user = session?.user as { type?: string; tenantId?: string | null } | undefined;
    if (!isPlatformAdmin(user)) {
      void signOut({ redirect: false }).then(() => {
        router.replace('/unauthorized?from=admin');
      });
    }
  }, [status, session, router, pathname, isLoginPage, isDemoMode]);

  if (isLoginPage) return <>{children}</>;

  if (status === 'loading' && !isDemoMode) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-slate-950 text-white">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!isDemoMode && !isPlatformAdmin(session?.user as { type?: string; tenantId?: string | null })) {
    return null;
  }

  const handleExitDemo = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pazaryonetimi_admin_demo');
    }
    router.push('/demo');
  };

  return (
    <>
      {isDemoMode && (
        <>
          {/* Top Demo Notification Banner */}
          <div className="bg-gradient-to-r from-purple-900/50 via-indigo-900/40 to-slate-900 border-b border-purple-500/30 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 z-50 text-white sticky top-0 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold text-2xs border border-purple-500/30 flex items-center gap-1">
                <Shield className="w-3 h-3" /> SÜPER ADMİN DEMOSU
              </span>
              <span className="text-slate-300 font-medium">
                Platform operasyonlarını ve çoklu kiracı (multi-tenant) yönetimini inceliyorsunuz.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard?demo=true"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium text-2xs hover:bg-amber-500/30 transition-colors"
              >
                <Store className="w-3 h-3" />
                <span>Mağaza Paneli Demosuna Geç ➔</span>
              </Link>
              <Link
                href="/demo"
                className="text-slate-400 hover:text-white text-2xs underline"
              >
                Demo Merkezi
              </Link>
              <button
                onClick={handleExitDemo}
                className="p-1 text-slate-400 hover:text-white rounded-md transition-colors"
                title="Demodan Çık"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Floating Bottom Quick Switcher */}
          <div className="fixed bottom-4 right-4 z-50 hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/90 border border-purple-500/30 text-white shadow-xl backdrop-blur-md text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-purple-400">
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Demo</span>
            </div>
            <span className="text-slate-600">|</span>
            <Link
              href="/dashboard?demo=true"
              className="hover:text-amber-400 flex items-center gap-1 font-medium transition-colors"
            >
              <Store className="w-3 h-3" />
              <span>Mağaza Paneli ➔</span>
            </Link>
            <span className="text-slate-600">|</span>
            <button
              onClick={handleExitDemo}
              className="text-slate-400 hover:text-red-400 transition-colors"
            >
              Çıkış
            </button>
          </div>
        </>
      )}
      {children}
    </>
  );
}
