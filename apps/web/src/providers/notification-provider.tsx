"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import { X, Info, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

type SessionUser = {
    id?: string;
    tenantId?: string;
};

export interface RealtimeNotification {
    id: string;
    type: 'order' | 'stock' | 'price' | 'review' | 'system' | 'integration' | 'campaign';
    title: string;
    message: string;
    severity: 'info' | 'warning' | 'error' | 'success';
    timestamp: string;
    data?: Record<string, unknown>;
    read?: boolean;
}

interface NotificationContextType {
    notifications: RealtimeNotification[];
    unreadCount: number;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearAll: () => void;
    socket: Socket | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    const { data: session } = useSession();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
    const [toasts, setToasts] = useState<RealtimeNotification[]>([]);

    const seenNotifications = useRef(new Set<string>());
    const loadedNotifications = useRef(false);
    const unreadCount = notifications.filter(n => !n.read).length;

    const showToast = useCallback((notification: RealtimeNotification) => {
        setToasts(prev => [...prev, notification]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== notification.id));
        }, 5000);
    }, []);

    useEffect(() => {
        if (!session?.user) { setNotifications([]); seenNotifications.current.clear(); loadedNotifications.current = false; return; }
        let mounted = true;
        async function load() {
            const response = await fetch('/api/operations/alerts', { cache: 'no-store' });
            if (!response.ok || !mounted) return;
            const rows = await response.json();
            if (!Array.isArray(rows) || !mounted) return;
            const fresh: RealtimeNotification[] = rows.map(row => ({ ...row, timestamp: row.createdAt, read: row.isRead }));
            for (const item of fresh) {
                if (loadedNotifications.current && !seenNotifications.current.has(item.id+'|'+item.message+'|'+item.severity) && !item.read && ['error','success'].includes(item.severity)) showToast(item);
                seenNotifications.current.add(item.id+'|'+item.message+'|'+item.severity);
            }
            loadedNotifications.current = true; setNotifications(fresh);
        }
        void load().catch(() => undefined);
        const timer = setInterval(() => { void load().catch(() => undefined); }, 15000);
        return () => { mounted = false; clearInterval(timer); };
    }, [session?.user?.id, showToast]);

    const markAsRead = (id: string) => {
        void fetch('/api/operations/alerts/'+encodeURIComponent(id)+'/read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const markAllAsRead = () => {
        void fetch('/api/operations/alerts/all/read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const clearAll = () => {
        setNotifications([]);
    };

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, clearAll, socket }}>
            {children}

            {/* Toast Overlay */}
            <div className="fixed top-6 right-6 z-[60] flex flex-col gap-3 pointer-events-none">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, x: 50, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 20, scale: 0.9 }}
                            className="pointer-events-auto"
                        >
                            <div className={`min-w-[320px] max-w-sm bg-white dark:bg-slate-900 border-l-4 rounded-xl shadow-2xl p-4 flex gap-4 ${toast.severity === 'success' ? 'border-green-500' :
                                    toast.severity === 'error' ? 'border-red-500' :
                                        toast.severity === 'warning' ? 'border-amber-500' : 'border-blue-500'
                                }`}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${toast.severity === 'success' ? 'bg-green-100 dark:bg-green-500/10 text-green-600' :
                                        toast.severity === 'error' ? 'bg-red-100 dark:bg-red-500/10 text-red-600' :
                                            toast.severity === 'warning' ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-600' : 'bg-blue-100 dark:bg-blue-500/10 text-blue-600'
                                    }`}>
                                    {toast.severity === 'success' && <CheckCircle size={20} />}
                                    {toast.severity === 'error' && <AlertCircle size={20} />}
                                    {toast.severity === 'warning' && <AlertTriangle size={20} />}
                                    {toast.severity === 'info' && <Info size={20} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{toast.title}</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{toast.message}</p>
                                </div>
                                <button
                                    onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
    return context;
};
