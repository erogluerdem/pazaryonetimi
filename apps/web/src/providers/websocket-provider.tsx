'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

// ─── Types ────────────────────────────────────────────
export interface RealtimeNotification {
  id: string;
  type: 'order' | 'stock' | 'price' | 'review' | 'system' | 'integration' | 'campaign';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  timestamp: string;
  data?: Record<string, unknown>;
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface WebSocketContextType {
  status: ConnectionStatus;
  notifications: RealtimeNotification[];
  unreadCount: number;
  subscribe: (channels: string[]) => void;
  unsubscribe: (channels: string[]) => void;
  clearNotifications: () => void;
  markAllRead: () => void;
  onEvent: (event: string, callback: (data: unknown) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || '';
const MAX_NOTIFICATIONS = 50;

// ─── Provider ─────────────────────────────────────────
export function WebSocketProvider({
  children,
  tenantId,
  userId,
}: {
  children: ReactNode;
  tenantId?: string;
  userId?: string;
}) {
  const socketRef = useRef<Socket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const eventListeners = useRef<Map<string, Set<(data: unknown) => void>>>(new Map());

  useEffect(() => {
    // Don't attempt connection if no tenantId (avoids undefined in query string)
    if (!tenantId) {
      setStatus('disconnected');
      return () => { };
    }

    try {
      const socket = io(`${WS_URL}/notifications`, {
        query: { tenantId, userId: userId || 'anonymous' },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 3000,
      });

      socketRef.current = socket;
      setStatus('connecting');

      socket.on('connect', () => {
        setStatus('connected');
      });

      socket.on('disconnect', () => {
        setStatus('disconnected');
      });

      socket.on('connect_error', () => {
        setStatus('error');
        // Suppress logging of connection errors
      });

      // Handle incoming notifications
      socket.on('notification', (notification: RealtimeNotification) => {
        setNotifications((prev) => [notification, ...prev].slice(0, MAX_NOTIFICATIONS));
        setUnreadCount((prev) => prev + 1);

        // Trigger event listeners
        const listeners = eventListeners.current.get('notification');
        listeners?.forEach((cb) => cb(notification));

        // Browser notification (if permission granted)
        if (Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/images/logo-icon.png',
            tag: notification.id,
          });
        }
      });

      // Forward specific events to listeners
      const events = ['order:new', 'stock:alert', 'price:change', 'review:new', 'dashboard:update'];
      events.forEach((event) => {
        socket.on(event, (data: unknown) => {
          const listeners = eventListeners.current.get(event);
          listeners?.forEach((cb) => cb(data));
        });
      });

      return () => {
        socket.disconnect();
        socketRef.current = null;
      };
    } catch {
      // Silently fail if WebSocket connection fails (mock API doesn't support it)
      setStatus('error');
      return () => { };
    }
  }, [tenantId, userId]);

  // Initial load of unread notifications from database
  useEffect(() => {
    if (!tenantId) return;
    fetch('/api/v1/notifications', {
      headers: { 'x-tenant-id': tenantId },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.notifications)) {
          setNotifications(
            data.notifications.map((n: any) => ({
              id: n.id,
              type: n.type || 'system',
              title: n.title,
              message: n.message,
              severity: n.severity || 'info',
              timestamp: n.createdAt,
              data: n.data,
            })),
          );
          setUnreadCount(data.unreadCount ?? 0);
        }
      })
      .catch(() => undefined);
  }, [tenantId]);

  const subscribe = useCallback((channels: string[]) => {
    socketRef.current?.emit('subscribe', { channels });
  }, []);

  const unsubscribe = useCallback((channels: string[]) => {
    socketRef.current?.emit('unsubscribe', { channels });
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const markAllRead = useCallback(() => {
    setUnreadCount(0);
    if (tenantId) {
      fetch('/api/v1/notifications/mark-all-read', {
        method: 'POST',
        headers: { 'x-tenant-id': tenantId },
      }).catch(() => undefined);
    }
  }, [tenantId]);

  const onEvent = useCallback((event: string, callback: (data: unknown) => void) => {
    if (!eventListeners.current.has(event)) {
      eventListeners.current.set(event, new Set());
    }
    eventListeners.current.get(event)!.add(callback);

    // Return cleanup function
    return () => {
      eventListeners.current.get(event)?.delete(callback);
    };
  }, []);

  return (
    <WebSocketContext.Provider
      value={{
        status,
        notifications,
        unreadCount,
        subscribe,
        unsubscribe,
        clearNotifications,
        markAllRead,
        onEvent,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    // Return a disconnected fallback instead of throwing
    return {
      status: 'disconnected' as ConnectionStatus,
      notifications: [],
      unreadCount: 0,
      subscribe: () => { },
      unsubscribe: () => { },
      clearNotifications: () => { },
      markAllRead: () => { },
      onEvent: () => () => { },
    };
  }
  return context;
}
