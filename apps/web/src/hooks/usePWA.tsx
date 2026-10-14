'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, WifiOff, CheckCircle2, Smartphone } from 'lucide-react';

// Extend Window interface for PWA globals
declare global {
  interface Window {
    __pwaInstallPrompt: BeforeInstallPromptEvent | null;
    __pwaInstalled: boolean;
  }
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWA() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Online/offline durumu
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // PWA kurulum durumu kontrol
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      window.__pwaInstalled
    ) {
      setIsInstalled(true);
    }

    // 1) Layout'taki <script> ile yakalanan erken event'i kontrol et
    if (window.__pwaInstallPrompt) {
      setDeferredPrompt(window.__pwaInstallPrompt);
      setIsInstallable(true);
    }

    // 2) Erken event yakalandığında tetiklenen custom event
    const handlePromptCaptured = () => {
      if (window.__pwaInstallPrompt) {
        setDeferredPrompt(window.__pwaInstallPrompt);
        setIsInstallable(true);
      }
    };
    window.addEventListener('pwa-prompt-captured', handlePromptCaptured);

    // 3) Normal beforeinstallprompt (Layout script yoksa veya React mount sonrası gelirse)
    let handleBeforeInstallPrompt: ((e: Event) => void) | null = null;
    if (!window.__pwaInstallPrompt && !window.__pwaInstalled) {
      handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        const promptEvent = e as BeforeInstallPromptEvent;
        window.__pwaInstallPrompt = promptEvent;
        setDeferredPrompt(promptEvent);
        setIsInstallable(true);
      };
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt, { once: true });
    }

    // Kurulum tamamlandı
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      window.__pwaInstallPrompt = null;
      window.__pwaInstalled = true;
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    // Service Worker kayıt
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          setSwRegistration(registration);
          // Güncelleme kontrolü
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'activated') {
                  console.log('[PWA] Service Worker güncellendi');
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('[PWA] Service Worker kayıt hatası:', error);
        });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('pwa-prompt-captured', handlePromptCaptured);
      if (handleBeforeInstallPrompt) {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      }
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = useCallback(async () => {
    const prompt = deferredPrompt || window.__pwaInstallPrompt;
    if (!prompt) return false;

    try {
      prompt.prompt();
      const { outcome } = await prompt.userChoice;

      if (outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
      }

      setDeferredPrompt(null);
      window.__pwaInstallPrompt = null;
      return outcome === 'accepted';
    } catch (error) {
      console.error('[PWA] Install hatası:', error);
      return false;
    }
  }, [deferredPrompt]);

  const requestNotificationPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      return 'denied';
    }
    const permission = await Notification.requestPermission();
    return permission;
  }, []);

  const checkForUpdates = useCallback(async () => {
    if (swRegistration) {
      await swRegistration.update();
    }
  }, [swRegistration]);

  return {
    isInstallable,
    isInstalled,
    isOnline,
    installApp,
    requestNotificationPermission,
    checkForUpdates,
  };
}

// Offline Banner Component
export function OfflineBanner() {
  const { isOnline } = usePWA();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom- safe-pb left-4 right-4 z-[60]"
        >
          <div className="bg-amber-500/90 backdrop-blur-md text-white py-3 px-4 rounded-2xl shadow-lg border border-amber-400/30 flex items-center justify-center gap-3">
            <WifiOff size={18} />
            <span className="text-sm font-bold">Çevrimdışısınız. Bazı özellikler kısıtlı olabilir.</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Install Prompt Component
export function InstallPrompt() {
  const { isInstallable, isInstalled, installApp } = usePWA();
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [adminEnabled, setAdminEnabled] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Admin ayarlarını kontrol et
    fetch('/api/pwa-settings')
      .then((res) => res.json())
      .then((data) => {
        setAdminEnabled(data.pwa_install_prompt_enabled ?? true);

        // Gecikme uygula
        const delayMs = (data.pwa_install_prompt_delay || 0) * 1000;
        if (delayMs > 0) {
          setTimeout(() => setReady(true), delayMs);
        } else {
          setReady(true);
        }
      })
      .catch(() => {
        setReady(true);
      });
  }, []);

  useEffect(() => {
    const wasDismissed = localStorage.getItem('pwa-install-dismissed');
    if (wasDismissed) {
      const dismissedTime = parseInt(wasDismissed);
      if (Date.now() - dismissedTime > 7 * 86400000) {
        localStorage.removeItem('pwa-install-dismissed');
      } else {
        setDismissed(true);
      }
    }
  }, []);

  const handleInstall = async () => {
    setInstalling(true);
    const success = await installApp();
    setInstalling(false);
    if (success) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    setDismissed(true);
  };

  // Logic: Show if enabled, ready, installable, not installed, and not dismissed.
  const showPrompt = adminEnabled && ready && isInstallable && !isInstalled && !dismissed && !showSuccess;

  return (
    <AnimatePresence>
      {/* Success Notification */}
      {showSuccess && (
        <motion.div
          initial={{ y: 50, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 50, opacity: 0, scale: 0.9 }}
          className="fixed bottom-6 left-4 right-4 z-[100] md:left-auto md:right-6 md:w-auto"
        >
          <div className="bg-emerald-500/90 backdrop-blur-xl border border-emerald-400/30 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <CheckCircle2 size={18} className="text-white" />
            </div>
            <div>
              <h4 className="font-bold text-sm">Başarıyla Yüklendi!</h4>
              <p className="text-xs text-emerald-100">Ana ekranınızdan erişebilirsiniz.</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Install Prompt */}
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", damping: 20, stiffness: 100 }}
          className="fixed bottom-4 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-[400px] z-[90]"
        >
          {/* Main Glass Container */}
          <div className="relative overflow-hidden rounded-[24px] group">
            {/* Background Blur & Gradient */}
            <div className="absolute inset-0 bg-[#0f172a]/80 dark:bg-black/80 backdrop-blur-xl border border-white/10 dark:border-white/10 shadow-2xl" />

            {/* Animated Glow Effect */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/30 rounded-full blur-[60px] animate-pulse" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/30 rounded-full blur-[60px] animate-pulse delay-1000" />

            <div className="relative p-5">
              <div className="flex items-start gap-4">
                {/* App Icon */}
                <div className="relative shrink-0 w-14 h-14 rounded-2xl overflow-hidden shadow-lg border border-white/10 group-hover:scale-105 transition-transform duration-500">
                  <div className="absolute inset-0 bg-blue-600 flex items-center justify-center">
                    <span className="font-black text-white text-xl">PZ</span>
                  </div>
                  {/* Shine */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Content */}
                <div className="flex-1 pt-0.5">
                  <h3 className="text-white font-bold text-base leading-tight">Uygulamayı Yükle</h3>
                  <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                    Daha hızlı erişim ve çevrimdışı kullanım için ana ekrana ekleyin.
                  </p>
                </div>

                {/* Close Button */}
                <button
                  onClick={handleDismiss}
                  className="text-slate-500 hover:text-white transition-colors p-1"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Actions */}
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  onClick={handleDismiss}
                  className="py-3 px-4 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  Daha Sonra
                </button>
                <button
                  onClick={handleInstall}
                  disabled={installing}
                  className="relative py-3 px-4 rounded-xl text-xs font-black text-white overflow-hidden group/btn bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {installing ? (
                      <>
                        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Yükleniyor...
                      </>
                    ) : (
                      <>
                        <Smartphone size={14} />
                        Yükle & Başla
                      </>
                    )}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
