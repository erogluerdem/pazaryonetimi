function isDemoModeActive(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('demo') === 'true') return true;
    return (
      localStorage.getItem('pazaryonetimi_admin_demo') === 'true' ||
      localStorage.getItem('pazaryonetimi_demo') === 'true'
    );
  } catch {
    return false;
  }
}

function getAdminMockFallback(endpoint: string): any {
  const clean = endpoint.toLowerCase();
  if (clean.includes('dashboard/stats')) {
    return {
      tenantCount: 148,
      tenantGrowth: '+18.4%',
      monthlyRevenue: 428900,
      revenueGrowth: '+24.2%',
      activeSessions: 342,
      aiJobsCount: 1840,
      serverStatus: 'HEALTHY',
      uptimeSeconds: 842000,
      cpuUsage: 24,
      memoryUsage: 48,
      dbConnections: 38,
      recentTenants: [
        { id: 't-1', name: 'Atlas Moda Tekstil A.Ş.', plan: 'ENTERPRISE', status: 'ACTIVE', createdAt: '2026-10-12T10:00:00Z', revenue: 145000 },
        { id: 't-2', name: 'Nordic Kozmetik Ltd.', plan: 'PRO', status: 'ACTIVE', createdAt: '2026-10-11T14:30:00Z', revenue: 89000 },
        { id: 't-3', name: 'TechTrend Elektronik', plan: 'PRO', status: 'ACTIVE', createdAt: '2026-10-10T09:15:00Z', revenue: 112000 },
        { id: 't-4', name: 'Ege Organik Gıda', plan: 'GROWTH', status: 'ACTIVE', createdAt: '2026-10-09T18:20:00Z', revenue: 43000 },
        { id: 't-5', name: 'Anadolu Zanaat Atölyesi', plan: 'FREE', status: 'PENDING', createdAt: '2026-10-14T08:00:00Z', revenue: 0 },
      ],
      revenueHistory: [
        { month: 'Mayıs', amount: 280000 },
        { month: 'Haziran', amount: 310000 },
        { month: 'Temmuz', amount: 345000 },
        { month: 'Ağustos', amount: 380000 },
        { month: 'Eylül', amount: 405000 },
        { month: 'Ekim', amount: 428900 },
      ],
    };
  }

  if (clean.includes('predictions')) {
    return {
      demandForecast: [
        { period: '1-7 Gün', change: 14.2 },
        { period: '8-14 Gün', change: 18.5 },
        { period: '15-30 Gün', change: 11.8 },
      ],
      stockPredictions: [
        { productName: 'Wireless Kulaklık Pro', daysUntilStockout: 4 },
        { productName: 'Akıllı Saat X2', daysUntilStockout: 9 },
        { productName: 'Type-C Hızlı Şarj Kiti', daysUntilStockout: 12 },
        { productName: 'Termal Kargo Etiket Rulosu', daysUntilStockout: 3 },
      ],
      revenuePrediction: {
        next30Days: 520000,
        confidence: 94,
        trend: 'up',
      },
      riskAnalysis: {
        overallRisk: 'low',
      },
    };
  }

  if (clean.includes('ai-summary')) {
    return {
      predictionText:
        'Son 30 günlük satış trendleri ve pazaryeri kampanya takvimine göre önümüzdeki ay ciroda %24.2 büyüme öngörülmektedir. Kritik stok uyarısı veren 4 ürün için tedarikçi siparişi önerilmektedir.',
    };
  }

  if (clean.includes('tenants')) {
    return {
      items: [
        { id: 't-1', name: 'Atlas Moda Tekstil A.Ş.', plan: 'ENTERPRISE', status: 'ACTIVE', createdAt: '2026-02-10T10:00:00Z', userCount: 12, orderCount: 3410 },
        { id: 't-2', name: 'Nordic Kozmetik Pazarlama', plan: 'PRO', status: 'ACTIVE', createdAt: '2026-04-15T14:30:00Z', userCount: 4, orderCount: 1280 },
        { id: 't-3', name: 'TechTrend Elektronik Aletler', plan: 'PRO', status: 'ACTIVE', createdAt: '2026-05-20T09:15:00Z', userCount: 6, orderCount: 1940 },
        { id: 't-4', name: 'Ege Organik Çiftlik Ürünleri', plan: 'GROWTH', status: 'ACTIVE', createdAt: '2026-06-01T18:20:00Z', userCount: 2, orderCount: 620 },
        { id: 't-5', name: 'Anadolu Zanaat ve Hediyelik', plan: 'FREE', status: 'ACTIVE', createdAt: '2026-07-12T08:00:00Z', userCount: 1, orderCount: 84 },
      ],
      total: 148,
      page: 1,
      totalPages: 15,
    };
  }

  if (clean.includes('users')) {
    return {
      items: [
        { id: 'u-1', email: 'admin@pazaryonetimi.com', firstName: 'Sistem', lastName: 'Yöneticisi', type: 'SUPER_ADMIN', status: 'ACTIVE', createdAt: '2026-01-01T00:00:00Z' },
        { id: 'u-2', email: 'destek@pazaryonetimi.com', firstName: 'Destek', lastName: 'Ekibi', type: 'SUPPORT', status: 'ACTIVE', createdAt: '2026-02-01T00:00:00Z' },
        { id: 'u-3', email: 'atlas.yonetim@atlasmoda.com', firstName: 'Ahmet', lastName: 'Yılmaz', type: 'TENANT_ADMIN', status: 'ACTIVE', createdAt: '2026-03-10T00:00:00Z' },
      ],
      total: 842,
      page: 1,
      totalPages: 85,
    };
  }

  if (clean.includes('audit-logs')) {
    return {
      items: [
        { id: 'log-1', action: 'TENANT_UPGRADE', resource: 'Tenant:t-1', user: 'admin@pazaryonetimi.com', ip: '192.168.1.1', timestamp: new Date(Date.now() - 3600000).toISOString() },
        { id: 'log-2', action: 'API_KEY_CREATED', resource: 'Integration:Trendyol', user: 'atlas.yonetim@atlasmoda.com', ip: '88.240.12.4', timestamp: new Date(Date.now() - 7200000).toISOString() },
        { id: 'log-3', action: 'STOCK_SYNC_TRIGGERED', resource: 'SyncEngine', user: 'system', ip: '127.0.0.1', timestamp: new Date(Date.now() - 10800000).toISOString() },
      ],
      total: 1240,
      page: 1,
      totalPages: 124,
    };
  }

  return { success: true, items: [], total: 0 };
}

async function fetchLocalAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(endpoint, {
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      credentials: 'include',
      ...options,
    });
    if (!res.ok) {
      if (isDemoModeActive()) {
        return getAdminMockFallback(endpoint) as T;
      }
      const error = await res.json().catch(() => ({ message: 'API Hatası' }));
      throw new Error(error.message || error.error || `HTTP ${res.status}`);
    }
    return res.json();
  } catch (err) {
    if (isDemoModeActive()) {
      return getAdminMockFallback(endpoint) as T;
    }
    throw err;
  }
}

/** NestJS admin API — oturum üzerinden BFF proxy */
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const path = endpoint.replace(/^\//, '');
  try {
    return await fetchLocalAPI<T>(`/api/admin/proxy/${path}`, options);
  } catch (err) {
    if (isDemoModeActive()) {
      return getAdminMockFallback(path) as T;
    }
    throw err;
  }
}

// ═══════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════

export const adminApi = {
  getDashboardStats: () => fetchAPI<any>('admin/dashboard/stats'),

  // ═══════════════════════════════════════════════════════════════════
  // TENANTS
  // ═══════════════════════════════════════════════════════════════════
  getTenants: (params?: { plan?: string; search?: string; page?: number }) => {
    const qs = new URLSearchParams();
    if (params?.plan) qs.set('plan', params.plan);
    if (params?.search) qs.set('search', params.search);
    if (params?.page) qs.set('page', params.page.toString());
    return fetchAPI<any>(`admin/tenants?${qs}`);
  },
  getTenantDetail: (id: string) => fetchAPI<any>(`admin/tenants/${id}`),
  updateTenant: (id: string, data: any) =>
    fetchAPI<any>(`admin/tenants/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTenant: (id: string) =>
    fetchAPI<any>(`admin/tenants/${id}`, { method: 'DELETE' }),

  // ═══════════════════════════════════════════════════════════════════
  // USERS
  // ═══════════════════════════════════════════════════════════════════
  getUsers: (params?: { tenantId?: string; type?: string; search?: string; page?: number }) => {
    const qs = new URLSearchParams();
    if (params?.tenantId) qs.set('tenantId', params.tenantId);
    if (params?.type) qs.set('type', params.type);
    if (params?.search) qs.set('search', params.search);
    if (params?.page) qs.set('page', params.page.toString());
    return fetchAPI<any>(`admin/users?${qs}`);
  },
  getUserDetail: (id: string) => fetchAPI<any>(`admin/users/${id}`),
  createUser: (data: {
    email: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    type?: string;
    tenantId?: string;
    status?: string;
  }) =>
    fetchAPI<any>('admin/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id: string, data: any) =>
    fetchAPI<any>(`admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateUserRole: (id: string, type: string) =>
    fetchAPI<any>(`admin/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ type, role: type }),
    }),
  deleteUser: (id: string) =>
    fetchAPI<any>(`admin/users/${id}`, { method: 'DELETE' }),
  lockUser: (id: string) =>
    fetchAPI<any>(`admin/users/${id}/lock`, { method: 'POST' }),
  unlockUser: (id: string) =>
    fetchAPI<any>(`admin/users/${id}/unlock`, { method: 'POST' }),
  force2FA: (id: string) =>
    fetchAPI<any>(`admin/users/${id}/force-2fa`, { method: 'POST' }),

  // ═══════════════════════════════════════════════════════════════════
  // CRM & CUSTOMERS (Phase 3)
  // ═══════════════════════════════════════════════════════════════════
  getCustomers: (params?: { search?: string; page?: number }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.page) qs.set('page', params.page.toString());
    return fetchAPI<any>(`admin/customers?${qs}`);
  },
  getCustomerDetail: (email: string) => fetchAPI<any>(`admin/customers/${encodeURIComponent(email)}`),

  // ═══════════════════════════════════════════════════════════════════
  // HELPDESK & TICKETS (Phase 3)
  // ═══════════════════════════════════════════════════════════════════
  getSupportTickets: (params?: { status?: string; page?: number }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.page) qs.set('page', params.page.toString());
    return fetchAPI<any>(`admin/support-tickets?${qs}`);
  },
  getSupportTicketDetail: (id: string) => fetchAPI<any>(`admin/support-tickets/${id}`),
  replyToSupportTicket: (id: string, content: string) =>
    fetchAPI<any>(`admin/support-tickets/${id}/reply`, { method: 'POST', body: JSON.stringify({ content }) }),

  // ═══════════════════════════════════════════════════════════════════
  // TASKS (Phase 3 Kanban)
  // ═══════════════════════════════════════════════════════════════════
  getTasks: (params?: { status?: string; assigneeId?: string }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.assigneeId) qs.set('assigneeId', params.assigneeId);
    return fetchLocalAPI<any>(`/api/admin/tasks?${qs}`);
  },
  createTask: (data: any) =>
    fetchLocalAPI<any>('/api/admin/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id: string, data: any) =>
    fetchLocalAPI<any>(`/api/admin/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTask: (id: string) =>
    fetchLocalAPI<any>(`/api/admin/tasks/${id}`, { method: 'DELETE' }),

  // ═══════════════════════════════════════════════════════════════════
  // VARIANTS (Phase 3)
  // ═══════════════════════════════════════════════════════════════════
  getProductVariants: (productId: string) =>
    fetchAPI<any>(`admin/products/${productId}/variants`),
  bulkUpdateVariants: (productId: string, variants: any[]) =>
    fetchAPI<any>(`admin/products/${productId}/variants/bulk`, {
      method: 'POST',
      body: JSON.stringify({ variants })
    }),

  // ═══════════════════════════════════════════════════════════════════
  // PRODUCTS
  // ═══════════════════════════════════════════════════════════════════
  getProducts: (params?: { search?: string; limit?: number; page?: number }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.limit) qs.set('limit', params.limit.toString());
    if (params?.page) qs.set('page', params.page.toString());
    return fetchAPI<any>(`admin/products?${qs}`);
  },

  getOrders: (params?: { search?: string; status?: string; tenantId?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.status) qs.set('status', params.status);
    if (params?.tenantId) qs.set('tenantId', params.tenantId);
    if (params?.page) qs.set('page', params.page.toString());
    if (params?.limit) qs.set('limit', (params.limit ?? 50).toString());
    return fetchAPI<any>(`admin/orders?${qs}`);
  },
  updateOrderStatus: (id: string, status: string) =>
    fetchAPI<any>(`admin/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  getModules: () => fetchLocalAPI<any>('/api/admin/modules'),
  updateModule: (id: string, data: Record<string, unknown>) =>
    fetchLocalAPI<any>(`/api/admin/modules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  getForumOverview: () => fetchLocalAPI<any>('/api/admin/forum'),
  getOffers: () => fetchLocalAPI<any>('/api/admin/offers'),
  createOffer: (data: Record<string, unknown>) =>
    fetchLocalAPI<any>('/api/admin/offers', { method: 'POST', body: JSON.stringify(data) }),
  updateOffer: (id: string, data: Record<string, unknown>) =>
    fetchLocalAPI<any>(`/api/admin/offers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteOffer: (id: string) =>
    fetchLocalAPI<any>(`/api/admin/offers/${id}`, { method: 'DELETE' }),

  // ═══════════════════════════════════════════════════════════════════
  sendMessageToAiAssistant: (message: string, history: any[] = []) =>
    fetchAPI<any>('admin/ai-assistant/chat', { method: 'POST', body: JSON.stringify({ message, history }) }),

  getPredictions: (tenantId?: string) =>
    fetchAPI<any>(`analytics/predictions${tenantId ? `?tenantId=${tenantId}` : ''}`),

  getAiSummary: (tenantId?: string) =>
    fetchAPI<any>(`analytics/ai-summary${tenantId ? `?tenantId=${tenantId}` : ''}`),

  // ═══════════════════════════════════════════════════════════════════
  // ROLES
  // ═══════════════════════════════════════════════════════════════════
  getRoles: (tenantId?: string) => {
    const qs = tenantId ? `?tenantId=${tenantId}` : '';
    return fetchAPI<any>(`admin/roles${qs}`);
  },
  createRole: (data: { name: string; description?: string; permissions: string[] }) =>
    fetchAPI<any>('admin/roles', { method: 'POST', body: JSON.stringify(data) }),
  updateRole: (id: string, data: any) =>
    fetchAPI<any>(`admin/roles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRole: (id: string) =>
    fetchAPI<any>(`admin/roles/${id}`, { method: 'DELETE' }),

  // ═══════════════════════════════════════════════════════════════════
  // AUDIT LOGS
  // ═══════════════════════════════════════════════════════════════════
  getAuditLogs: (params?: {
    tenantId?: string; action?: string; resource?: string;
    startDate?: string; endDate?: string; page?: number; limit?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.tenantId) qs.set('tenantId', params.tenantId);
    if (params?.action) qs.set('action', params.action);
    if (params?.resource) qs.set('resource', params.resource);
    if (params?.startDate) qs.set('startDate', params.startDate);
    if (params?.endDate) qs.set('endDate', params.endDate);
    if (params?.page) qs.set('page', params.page.toString());
    if (params?.limit) qs.set('limit', params.limit.toString());
    return fetchAPI<any>(`admin/audit-logs?${qs}`);
  },

  // ═══════════════════════════════════════════════════════════════════
  // BACKUPS
  // ═══════════════════════════════════════════════════════════════════
  getBackups: (params?: { tenantId?: string; status?: string; page?: number }) => {
    const qs = new URLSearchParams();
    if (params?.tenantId) qs.set('tenantId', params.tenantId);
    if (params?.status) qs.set('status', params.status);
    if (params?.page) qs.set('page', params.page.toString());
    return fetchAPI<any>(`admin/backups?${qs}`);
  },
  getBackupSchedules: () => fetchAPI<any>('admin/backup-schedules'),
  createBackupSchedule: (data: any) =>
    fetchAPI<any>('admin/backup-schedules', { method: 'POST', body: JSON.stringify(data) }),
  restoreBackup: (id: string, dryRun?: boolean) =>
    fetchAPI<any>(`admin/backups/${id}/restore`, { method: 'POST', body: JSON.stringify({ dryRun }) }),
  getDrSettings: () => fetchAPI<any>('admin/dr-settings'),
  updateDrSettings: (tenantId: string, data: any) =>
    fetchAPI<any>(`admin/dr-settings/${tenantId}`, { method: 'PUT', body: JSON.stringify(data) }),

  // ═══════════════════════════════════════════════════════════════════
  // SECURITY
  // ═══════════════════════════════════════════════════════════════════
  getLoginAttempts: (params?: { email?: string; success?: string; page?: number }) => {
    const qs = new URLSearchParams();
    if (params?.email) qs.set('email', params.email);
    if (params?.success) qs.set('success', params.success);
    if (params?.page) qs.set('page', params.page.toString());
    return fetchAPI<any>(`admin/security/login-attempts?${qs}`);
  },
  getSecurityStats: () => fetchAPI<any>('admin/security/stats'),
  getSuspiciousIps: () => fetchAPI<any>('admin/security/suspicious-ips'),
  blockIp: (ip: string, reason: string) =>
    fetchAPI<any>('admin/security/block-ip', { method: 'POST', body: JSON.stringify({ ip, reason }) }),
  get2FAStats: () => fetchAPI<any>('admin/security/2fa-stats'),

  // ═══════════════════════════════════════════════════════════════════
  // SEO YÖNETİMİ
  // ═══════════════════════════════════════════════════════════════════
  getSeoPages: () => fetchLocalAPI<any>('/api/admin/seo/pages'),
  getSeoStats: () => fetchLocalAPI<any>('/api/admin/seo/stats'),
  getSeoRedirects: () => fetchLocalAPI<any>('/api/admin/seo/redirects'),
  getStructuredData: () => fetchLocalAPI<any>('/api/admin/seo/structured-data'),
  updateSeoPage: (pageId: string, data: any) =>
    fetchLocalAPI<any>(`/api/admin/seo/pages/${encodeURIComponent(pageId)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  createRedirect: (data: { source: string; destination: string; type: string }) =>
    fetchLocalAPI<any>('/api/admin/seo/redirects', { method: 'POST', body: JSON.stringify(data) }),
  runSeoAudit: () => fetchLocalAPI<any>('/api/admin/seo/audit', { method: 'POST' }),
  regenerateSitemap: () => fetchLocalAPI<any>('/api/admin/seo/sitemap/regenerate', { method: 'POST' }),

  // ═══════════════════════════════════════════════════════════════════
  // EXISTING
  // ═══════════════════════════════════════════════════════════════════
  getBilling: () => fetchAPI<any>('admin/billing'),
  getApiUsage: () => fetchAPI<any>('admin/api-usage'),
  getFeatureFlags: () => fetchAPI<any>('admin/feature-flags'),
  updateFeatureFlag: (key: string, data: any) =>
    fetchAPI<any>(`admin/feature-flags/${key}`, { method: 'PUT', body: JSON.stringify(data) }),
  getMaintenanceMode: () => fetchAPI<any>('admin/maintenance'),
  setMaintenanceMode: (data: any) =>
    fetchAPI<any>('admin/maintenance', { method: 'POST', body: JSON.stringify(data) }),
  bulkOperation: (data: any) =>
    fetchAPI<any>('admin/bulk-operation', { method: 'POST', body: JSON.stringify(data) }),
  sendAnnouncement: (data: any) =>
    fetchAPI<any>('admin/announcement', { method: 'POST', body: JSON.stringify(data) }),
  // ═══════════════════════════════════════════════════════════════════
  // SYSTEM MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════
  getSystemServices: () => fetchAPI<any>('system/services'),
  controlService: (serviceId: string, action: 'start' | 'stop' | 'restart') =>
    fetchAPI<any>(`system/services/${serviceId}/${action}`, { method: 'POST' }),
  getDatabaseInfo: () => fetchAPI<any>('system/database'),
  databaseAction: (action: 'backup' | 'migrate' | 'optimize') =>
    fetchAPI<any>(`system/database/${action}`, { method: 'POST' }),
  getDeploymentInfo: () => fetchAPI<any>('system/deployment'),
  runScript: (scriptName: string) =>
    fetchAPI<any>(`system/scripts/${scriptName}/run`, { method: 'POST' }),

  getSystemRealtime: () => fetchAPI<any>('system/realtime'),
};
