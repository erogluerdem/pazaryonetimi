'use client';
import { useNotifications as usePersistentNotifications } from '@/providers/notification-provider';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BellRing,
  X,
  ShoppingCart,
  Package,
  TrendingUp,
  Star,
  Zap,
  Settings,
  Check,
  CheckCheck,
  Trash2,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useWebSocket, RealtimeNotification } from '@/providers/websocket-provider';
import { useToast } from '@/providers/toast-provider';

const typeIcons: Record<string, any> = {
  order: ShoppingCart,
  stock: Package,
  price: TrendingUp,
  review: Star,
  system: Settings,
  integration: Zap,
  campaign: TrendingUp,
};

const typeColors: Record<string, string> = {
  order: 'text-purple-400 bg-purple-500/10',
  stock: 'text-orange-400 bg-orange-500/10',
  price: 'text-cyan-400 bg-cyan-500/10',
  review: 'text-yellow-400 bg-yellow-500/10',
  system: 'text-slate-400 bg-slate-500/10',
  integration: 'text-emerald-400 bg-emerald-500/10',
  campaign: 'text-pink-400 bg-pink-500/10',
};

const severityColors: Record<string, string> = {
  success: 'border-l-emerald-500',
  warning: 'border-l-amber-500',
  error: 'border-l-red-500',
  info: 'border-l-blue-500',
};

export default function NotificationBell() {
  const { status, onEvent } = useWebSocket();
  const { notifications, unreadCount, markAllAsRead: markAllRead, clearAll: clearNotifications } = usePersistentNotifications();
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Animate bell on new notification
  useEffect(() => {
    const cleanup = onEvent('notification', (data: unknown) => {
      const notification = data as RealtimeNotification;
      if (!notification?.title || !notification.message) return;
      const timer = setTimeout(() => {
        setIsAnimating(true);
      }, 0);
      const timer2 = setTimeout(() => setIsAnimating(false), 1000);

      // Show toast for important notifications
      if (notification.severity === 'error' || notification.severity === 'warning') {
        toast.addToast({
          type: notification.type as any,
          title: notification.title,
          message: notification.message,
          duration: 8000,
        });
      } else if (notification.type === 'order') {
        toast.addToast({
          type: 'order',
          title: notification.title,
          message: notification.message,
          duration: 6000,
          action: {
            label: 'Siparişi Görüntüle',
            onClick: () => window.location.href = '/dashboard/orders',
          },
        });
      }
    });

    return () => {
      cleanup();
    };
  }, [onEvent, toast]);

  const timeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return 'Az önce';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}dk önce`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}sa önce`;
    return `${Math.floor(hours / 24)}g önce`;
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) markAllRead();
        }}
        className="relative p-2 rounded-xl hover:bg-white/5 transition-colors group"
      >
        <motion.div
          animate={isAnimating ? { rotate: [0, -15, 15, -10, 10, -5, 5, 0] } : {}}
          transition={{ duration: 0.6 }}
        >
          {unreadCount > 0 ? (
            <BellRing size={20} className="text-slate-400 group-hover:text-white transition-colors" />
          ) : (
            <Bell size={20} className="text-slate-400 group-hover:text-white transition-colors" />
          )}
        </motion.div>

        {/* Badge */}
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}

        {/* Connection indicator */}
        <span
          className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-slate-900 ${status === 'connected' ? 'bg-emerald-400' : status === 'connecting' ? 'bg-amber-400 animate-pulse' : 'bg-red-400'
            }`}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="absolute right-0 top-full mt-2 w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">Bildirimler</h3>
                  <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border">
                    {status === 'connected' ? (
                      <>
                        <Wifi size={10} className="text-emerald-400" />
                        <span className="text-emerald-400">Canlı</span>
                      </>
                    ) : (
                      <>
                        <WifiOff size={10} className="text-red-400" />
                        <span className="text-red-400">Bağlantı Yok</span>
                      </>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {notifications.length > 0 && (
                    <>
                      <button
                        onClick={markAllRead}
                        className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
                        title="Tümünü okundu işaretle"
                      >
                        <CheckCheck size={14} className="text-slate-400" />
                      </button>
                      <button
                        onClick={clearNotifications}
                        className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
                        title="Tümünü temizle"
                      >
                        <Trash2 size={14} className="text-slate-400" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Notification List */}
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell size={32} className="mx-auto text-slate-700 mb-3" />
                    <p className="text-sm text-slate-500 font-medium">Henüz bildirim yok</p>
                    <p className="text-xs text-slate-600 mt-1">Yeni siparişler ve uyarılar burada görünecek</p>
                  </div>
                ) : (
                  notifications.map((notification) => {
                    const Icon = typeIcons[notification.type] || Bell;
                    const colorClass = typeColors[notification.type] || 'text-slate-400 bg-slate-500/10';
                    const severityBorder = severityColors[notification.severity] || 'border-l-slate-500';

                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-3 border-b border-slate-800/50 border-l-2 ${severityBorder} hover:bg-white/5 transition-colors cursor-pointer`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-1.5 rounded-lg ${colorClass.split(' ')[1]}`}>
                            <Icon size={14} className={colorClass.split(' ')[0]} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white">{notification.title}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-[10px] text-slate-600 mt-1">{timeAgo(notification.timestamp)}</p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="p-3 border-t border-slate-800 text-center">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      window.location.href = '/dashboard/notifications';
                    }}
                    className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Tüm Bildirimleri Görüntüle →
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
