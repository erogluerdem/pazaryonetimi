"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { SystemModule, Plan, ModuleAccess, Announcement } from './types';
import apiClient from '../api-client';
import { DEFAULT_MODULES, getModuleByKey } from './default-modules';
import { NAV_ITEMS } from '../navigation.config';
import { resolvePanelRole, canAccessNavItem, type PanelRole } from '../rbac/nav-access';
import type { SyncQueueItem } from '@/components/dashboard/SyncQueuePanel';

interface ModuleContextType {
  // Tenant bilgileri
  tenantId: string;
  tenantPlan: Plan;
  
  // Modül bilgileri
  allModules: SystemModule[];
  enabledModules: string[];
  
  // Duyurular
  announcements: Announcement[];
  unreadAnnouncementCount: number;
  
  // Fonksiyonlar
  hasModuleAccess: (moduleKey: string) => boolean;
  getModuleAccess: (moduleKey: string) => ModuleAccess;
  isModuleEnabled: (moduleKey: string) => boolean;
  canAccessRoute: (path: string) => boolean;
  
  // Duyuru fonksiyonları
  markAnnouncementAsRead: (id: string) => void;
  dismissAnnouncement: (id: string) => void;
  
  // Admin fonksiyonları (sadece admin paneli için)
  toggleModule: (moduleKey: string, enabled: boolean) => Promise<void>;
  updateModuleConfig: (moduleKey: string, config: Record<string, unknown>) => Promise<void>;
  
  // Loading state
  isLoading: boolean;

  // Tenant context
  userType: string;
  roleName: string;
  panelRole: PanelRole;
  aiCredits: { used: number; limit: number };
  syncQueue: SyncQueueItem[];
  orderPipeline: Record<string, number>;
  criticalStockCount: number;
  canAccessNavPath: (path: string) => boolean;
  refreshTenantContext: () => Promise<boolean>;
  retrySyncIntegration: (integrationId: string) => Promise<boolean>;
}

const ModuleContext = createContext<ModuleContextType | undefined>(undefined);

// Duyurular API'den yüklenecek
// fetchAnnouncements API call kullanılmalı

export function ModuleProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [tenantId, setTenantId] = useState<string>('');
  const [tenantPlan, setTenantPlan] = useState<Plan>('FREE');
  const [enabledModules, setEnabledModules] = useState<string[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [userType, setUserType] = useState('USER');
  const [roleName, setRoleName] = useState('USER');
  const [aiCredits, setAiCredits] = useState({ used: 0, limit: 200 });
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);
  const [orderPipeline, setOrderPipeline] = useState<Record<string, number>>({});
  const [criticalStockCount, setCriticalStockCount] = useState(0);

  const panelRole = resolvePanelRole(userType, roleName);

  const refreshTenantContext = async (): Promise<boolean> => {
    const res = await fetch('/api/tenant/context', { cache: 'no-store' });
    if (!res.ok) return false;
    const ctx = await res.json();
    setTenantPlan((ctx.plan as Plan) || 'FREE');
    setEnabledModules(ctx.enabledModules || []);
    setUserType(ctx.userType || 'USER');
    setRoleName(ctx.roleName || 'USER');
    setAiCredits(ctx.aiCredits || { used: 0, limit: 200 });
    setSyncQueue(ctx.integrations || []);
    setOrderPipeline(ctx.orderPipeline || {});
    setCriticalStockCount(ctx.criticalStockCount ?? 0);
    return true;
  };

  const loadAnnouncements = async () => {
    try {
      const res = await fetch('/api/announcements', { cache: 'no-store' });
      if (!res.ok) return;
      const rows = await res.json();
      if (!Array.isArray(rows)) return;
      setAnnouncements(
        rows.map((a: any) => ({
          id: a.id,
          title: a.title,
          content: a.content,
          summary: a.summary,
          type: a.type,
          target: 'ALL',
          icon: a.icon,
          color: a.color,
          actionUrl: a.actionUrl,
          actionText: a.actionText,
          isPinned: a.isPinned,
          isActive: a.isActive,
          isRead: a.isRead,
          isDismissed: a.isDismissed,
          startsAt: a.startsAt,
          endsAt: a.endsAt,
        })),
      );
    } catch {
      // ignore
    }
  };

  const retrySyncIntegration = async (integrationId: string) => {
    try {
      const res = await fetch(`/api/integrations/${integrationId}/retry-sync`, {
        method: 'POST',
      });
      if (!res.ok) return false;
      await refreshTenantContext();
      return true;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const tid = (session.user as { tenantId?: string })?.tenantId;
        if (tid) {
          setTenantId(tid);
          try {
            apiClient.setTenantId(tid);
          } catch (e) {
            console.warn('Failed to set tenantId on apiClient', e);
          }
        } else {
          try { apiClient.setTenantId(''); } catch {}
        }

        const loaded = await refreshTenantContext().catch(() => false);
        if (!loaded) {
          setEnabledModules(DEFAULT_MODULES.map((m) => m.key));
          setTenantPlan('PRO');
        }
        await loadAnnouncements();
      } catch (error) {
        console.error('Failed to load tenant data:', error);
        setEnabledModules(DEFAULT_MODULES.map((m) => m.key));
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [session]);
  
  const hasModuleAccess = (moduleKey: string): boolean => {
    return true;
  };
  
  const getModuleAccess = (moduleKey: string): ModuleAccess => {
    return {
      hasAccess: true,
      isEnabled: true,
      isTrial: false,
      requiredPlan: 'FREE',
      currentPlan: tenantPlan,
      canUpgrade: false,
    };
  };
  
  const isModuleEnabled = (moduleKey: string): boolean => {
    return true;
  };
  
  const canAccessNavPath = (path: string): boolean => {
    return true;
  };

  const canAccessRoute = (path: string): boolean => {
    return true;
  };
  
  const markAnnouncementAsRead = (id: string) => {
    setAnnouncements(prev => 
      prev.map(a => a.id === id ? { ...a, isRead: true } : a)
    );
  };
  
  const dismissAnnouncement = (id: string) => {
    setAnnouncements(prev => 
      prev.map(a => a.id === id ? { ...a, isDismissed: true } : a)
    );
  };
  
  const toggleModule = async (moduleKey: string, enabled: boolean) => {
    const res = await fetch(`/api/tenant/modules/${encodeURIComponent(moduleKey)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    });
    if (!res.ok) throw new Error('Modül güncellenemedi');
    if (enabled) {
      setEnabledModules(prev => [...new Set([...prev, moduleKey])]);
    } else {
      setEnabledModules(prev => prev.filter(k => k !== moduleKey));
    }
  };
  
  const updateModuleConfig = async (moduleKey: string, config: Record<string, unknown>) => {
    const res = await fetch(`/api/tenant/modules/${encodeURIComponent(moduleKey)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config }),
    });
    if (!res.ok) throw new Error('Modül yapılandırması güncellenemedi');
  };
  
  const unreadAnnouncementCount = announcements.filter(
    a => !a.isRead && !a.isDismissed && a.isActive
  ).length;
  
  return (
    <ModuleContext.Provider
      value={{
        tenantId,
        tenantPlan,
        allModules: DEFAULT_MODULES as SystemModule[],
        enabledModules,
        announcements,
        unreadAnnouncementCount,
        hasModuleAccess,
        getModuleAccess,
        isModuleEnabled,
        canAccessRoute,
        markAnnouncementAsRead,
        dismissAnnouncement,
        toggleModule,
        updateModuleConfig,
        isLoading,
        userType,
        roleName,
        panelRole,
        aiCredits,
        syncQueue,
        orderPipeline,
        criticalStockCount,
        canAccessNavPath,
        refreshTenantContext,
        retrySyncIntegration,
      }}
    >
      {children}
    </ModuleContext.Provider>
  );
}

export function useModules() {
  const context = useContext(ModuleContext);
  if (context === undefined) {
    throw new Error('useModules must be used within a ModuleProvider');
  }
  return context;
}

// Belirli bir modül için hook
export function useModule(moduleKey: string) {
  const { hasModuleAccess, getModuleAccess, isModuleEnabled } = useModules();
  
  return {
    hasAccess: hasModuleAccess(moduleKey),
    access: getModuleAccess(moduleKey),
    isEnabled: isModuleEnabled(moduleKey),
    module: getModuleByKey(moduleKey),
  };
}

// Duyurular için hook
export function useAnnouncements() {
  const { 
    announcements, 
    unreadAnnouncementCount, 
    markAnnouncementAsRead, 
    dismissAnnouncement 
  } = useModules();
  
  // Güvenli filter - announcements undefined veya object olabilir
  const safeAnnouncements = Array.isArray(announcements)
    ? announcements
    : (Array.isArray((announcements as any)?.data) ? (announcements as any).data : []);
  
  const activeAnnouncements = safeAnnouncements.filter(
    a => a.isActive && !a.isDismissed && (!a.endsAt || new Date(a.endsAt) > new Date())
  );
  
  const pinnedAnnouncements = activeAnnouncements.filter(a => a.isPinned);
  const regularAnnouncements = activeAnnouncements.filter(a => !a.isPinned);
  
  return {
    all: safeAnnouncements,
    active: activeAnnouncements,
    pinned: pinnedAnnouncements,
    regular: regularAnnouncements,
    unreadCount: unreadAnnouncementCount,
    markAsRead: markAnnouncementAsRead,
    dismiss: dismissAnnouncement,
  };
}
