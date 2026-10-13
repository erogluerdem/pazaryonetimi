'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import apiClient from './api-client';

// Generic hook for data fetching with tenant support
export function useApiData<T>(
  fetcher: (tenantId: string) => Promise<T>,
  options: { skip?: boolean; refetchInterval?: number } = {}
) {
  const { data: session } = useSession();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Extract tenantId and accessToken from authenticated session only.
  const tenantId = (session?.user as any)?.tenantId as string | undefined;
  const accessToken = (session?.user as any)?.accessToken as string | undefined;

  const refetch = useCallback(async () => {
    if (!tenantId || options.skip) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Set common credentials before fetch
      if (accessToken) apiClient.setAccessToken(accessToken);
      apiClient.setTenantId(tenantId);
      
      const result = await fetcher(tenantId);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [tenantId, accessToken, fetcher, options.skip]);

  // Only fetch on mount or when session changes
  useEffect(() => {
    refetch();
  }, [tenantId, refetch]);

  // Optional: refetch on interval
  useEffect(() => {
    if (!options.refetchInterval || options.skip) {
      return;
    }

    const interval = setInterval(refetch, options.refetchInterval);
    return () => clearInterval(interval);
  }, [options.refetchInterval, options.skip, refetch]);

  return { data, loading, error, refetch, tenantId };
}

// Dashboard Stats Hook
export function useDashboardStats(period: string = '30d') {
  const fetcher = useCallback(
    (tenantId: string) => apiClient.getDashboardStats(tenantId, period) as Promise<DashboardStats>,
    [period]
  );
  return useApiData(fetcher);
}

// Platform Performance Hook
export function usePlatformPerformance(_period?: string) {
  const fetcher = useCallback(
    (tenantId: string) => apiClient.getPlatformPerformance(tenantId) as Promise<PlatformPerformance[]>,
    []
  );
  return useApiData(fetcher);
}

// Recent Orders Hook
export function useRecentOrders(limit: number = 10) {
  const fetcher = useCallback(
    (tenantId: string) => apiClient.getRecentOrders(tenantId, limit) as Promise<RecentOrder[]>,
    [limit]
  );
  return useApiData(fetcher);
}

// Stock Alerts Hook
export function useStockAlerts() {
  const fetcher = useCallback(
    (tenantId: string) => apiClient.getStockAlerts(tenantId) as Promise<StockAlert[]>,
    []
  );
  return useApiData(fetcher);
}

// Top Products Hook
export function useTopProducts(limitOrPeriod: number | string = 10) {
  const limit = typeof limitOrPeriod === 'number' ? limitOrPeriod : 10;
  const fetcher = useCallback(
    (tenantId: string) => apiClient.getTopProducts(tenantId, limit) as Promise<TopProduct[]>,
    [limit]
  );
  return useApiData(fetcher);
}

// AI Insights Hook
export function useAiInsights() {
  const fetcher = useCallback(
    (tenantId: string) => apiClient.getAiInsights(tenantId) as Promise<AiInsight[]>,
    []
  );
  return useApiData(fetcher);
}

// Performance Trend Hook
export function usePerformanceTrend(metric: string = 'revenue', period: string = '30d') {
  const fetcher = useCallback(
    (tenantId: string) => apiClient.getPerformanceTrend(tenantId, metric, period) as Promise<TrendData[]>,
    [metric, period]
  );
  return useApiData(fetcher);
}

// Sales Forecast Hook
export function useSalesForecast(days: number = 30) {
  const fetcher = useCallback(
    (tenantId: string) => apiClient.getSalesForecast(tenantId, days) as Promise<SalesForecast>,
    [days]
  );
  return useApiData(fetcher);
}

// Category Performance Hook
export function useCategoryPerformance() {
  const fetcher = useCallback(
    (tenantId: string) => apiClient.getCategoryPerformance(tenantId) as Promise<CategoryPerformance[]>,
    []
  );
  return useApiData(fetcher);
}

// AI Advisor Hooks
export function useAiRecommendations() {
  const fetcher = useCallback(
    (tenantId: string) => apiClient.getRecommendations(tenantId) as Promise<AiRecommendation[]>,
    []
  );
  return useApiData(fetcher);
}

export function usePerformanceScores() {
  const fetcher = useCallback(
    (tenantId: string) => apiClient.getPerformanceScores(tenantId) as Promise<PerformanceScores>,
    []
  );
  return useApiData(fetcher);
}

// Competitor Hooks
export function useCompetitors() {
  const fetcher = useCallback(
    (tenantId: string) => apiClient.getCompetitors() as Promise<Competitor[]>,
    []
  );
  return useApiData(fetcher);
}

export function useMarketIntelForecast(productId: string) {
  const fetcher = useCallback(
    (tenantId: string) => apiClient.getMarketIntelForecast(productId) as Promise<MarketIntelForecast[]>,
    [productId]
  );
  return useApiData(fetcher);
}

// AI Summary Hook (stat notes, prediction text, forecasts)
export function useAiSummary() {
  const fetcher = useCallback(
    (tenantId: string) => apiClient.getAiSummary(tenantId) as Promise<AiSummary>,
    []
  );
  return useApiData(fetcher);
}

// Marketplace Health Hook
export function useMarketplaceHealth() {
  const fetcher = useCallback(
    (tenantId: string) => apiClient.getMarketplaceHealth(tenantId) as Promise<MarketplaceHealthData[]>,
    []
  );
  return useApiData(fetcher);
}

// Goals Hook
export function useGoals() {
  const fetcher = useCallback(
    (tenantId: string) => apiClient.getGoals(tenantId) as Promise<GoalData[]>,
    []
  );
  return useApiData(fetcher);
}

// Automation Types
export interface Automation {
  id: string;
  name: string;
  description: string;
  type: string;
  status: string;
  isActive?: boolean;
  trigger: string;
  action: string;
  runCount: number;
  successRate: number;
  lastRun?: string;
}

export interface AutomationLog {
  id: string;
  automation?: string;
  name?: string;
  details?: string;
  message?: string;
  status: 'success' | 'error' | 'pending';
  time?: string;
  createdAt?: string;
}



// Activity Feed Hook
export function useActivityFeed(limit: number = 12, options: { skip?: boolean; refetchInterval?: number } = {}) {
  const fetcher = useCallback(
    (tenantId: string) => apiClient.getActivityFeed(tenantId, limit) as Promise<ActivityEvent[]>,
    [limit]
  );
  return useApiData(fetcher, options);
}

// AI Chat Hook
export function useAiChat() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Merhaba! Ben AI Asistanınız. Pazaryeri satışlarınızı optimize etmek için size yardımcı olabilirim. Ne hakkında bilgi almak istersiniz?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const tenantId = (session?.user as any)?.tenantId || '';
  const accessToken = (session?.user as any)?.accessToken || '';

  const sendMessage = async (message: string) => {
    if (!message.trim() || !tenantId) return;

    const userMessage: ChatMessage = { role: 'user', content: message };
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      if (accessToken) apiClient.setAccessToken(accessToken);
      const response = await apiClient.chatWithAdvisor(tenantId, message, messages) as { response: string };
      const aiMessage: ChatMessage = { role: 'assistant', content: response.response };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    setMessages([
      { role: 'assistant', content: 'Merhaba! Ben AI Asistanınız. Pazaryeri satışlarınızı optimize etmek için size yardımcı olabilirim. Ne hakkında bilgi almak istersiniz?' }
    ]);
  };

  return { messages, isTyping, sendMessage, clearChat };
}



// Types
export interface AiSummary {
  weeklyForecast: {
    total: number;
    lowerBound: number;
    upperBound: number;
    bestDay: string;
    bestDayRevenue: number;
    confidence: number;
  };
  statNotes: {
    revenue: string;
    orders: string;
    avgOrder: string;
    profit: string;
    margin: string;
    cost: string;
  };
  predictionText: string;
}

export interface MarketplaceHealthData {
  name: string;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  score: number;
  metrics: {
    listingHealth: number;
    priceCompetitiveness: number;
    stockAvailability: number;
    customerSatisfaction: number;
    shippingPerformance: number;
  };
  alerts: string[];
  aiRecommendation: string;
}

export interface GoalData {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  prefix?: string;
  color: string;
  deadline: string;
  status: 'on-track' | 'behind' | 'completed' | 'at-risk';
  dailyRequired?: number;
  daysLeft?: number;
  trend?: string;
}

export interface ActivityEvent {
  id: string;
  type: 'order' | 'sale' | 'stock' | 'review' | 'shipping' | 'campaign' | 'system';
  title: string;
  description: string;
  time: string;
  platform?: string;
  value?: string;
  status?: 'success' | 'warning' | 'info' | 'error';
}

// Types
export interface Competitor {
  id: string;
  name: string;
  platform: string;
  storeUrl?: string;
  rating?: number;
  reviewCount: number;
  products: any[];
}

export interface MarketIntelForecast {
  id: string;
  productId: string;
  forecastDate: string;
  predictedSales: number;
  confidenceScore: number;
  metadata?: any;
}

// AI Studio/Content Hooks
export function useAiImage() {
  const [loading, setLoading] = useState(false);

  const { data: session } = useSession();
  const accessToken = (session?.user as any)?.accessToken || '';

  const generate = async (prompt: string, size?: string) => {
    if (accessToken) apiClient.setAccessToken(accessToken);
    setLoading(true);
    try {
      return await apiClient.generateImage(prompt, size) as { url: string };
    } finally {
      setLoading(false);
    }
  };

  const removeBg = async (imageUrl: string) => {
    if (accessToken) apiClient.setAccessToken(accessToken);
    setLoading(true);
    try {
      return await apiClient.removeBg(imageUrl) as { url: string };
    } finally {
      setLoading(false);
    }
  };

  return { generate, removeBg, loading };
}

export function useContentOptimizer() {
  const [loading, setLoading] = useState(false);

  const { data: session } = useSession();
  const accessToken = (session?.user as any)?.accessToken || '';

  const optimize = async (title: string, description: string, platform: string) => {
    if (accessToken) apiClient.setAccessToken(accessToken);
    setLoading(true);
    try {
      return await apiClient.optimizeContent(title, description, platform) as OptimizedContent;
    } finally {
      setLoading(false);
    }
  };

  return { optimize, loading };
}

// ==================== GELİŞMİŞ AI İÇERİK HOOKS ====================

export interface ContentAnalysisResult {
  id: string;
  scores: {
    overall: number;
    seo: number;
    readability: number;
    keyword: number;
    competitiveness: number;
  };
  issues: string[];
  suggestions: string[];
  keywords: string[];
  platformCompliance: {
    titleLength: boolean;
    descriptionLength: boolean;
    noForbiddenContent: boolean;
    score: number;
  };
  characterAnalysis: {
    titleLength: number;
    maxTitleLength: number;
    descriptionLength: number;
    maxDescriptionLength: number;
    wordCount: number;
    sentenceCount: number;
    paragraphCount: number;
    hasBulletPoints: boolean;
    hasEmojis: boolean;
    hasUpperCase: boolean;
  };
  aiInsights: {
    targetAudience: string;
    toneAnalysis: string;
    uniqueSellingPoints: string[];
    competitiveAdvantages: string[];
    contentGaps: string[];
  } | null;
}

export interface ContentOptimizationResult {
  id: string;
  version: number;
  optimizedTitle: string;
  optimizedDescription: string;
  keywords: string[];
  seoScoreBefore: number;
  seoScoreAfter: number;
  improvements: string[];
  tone: string;
  platform: string;
  status: string;
}

export interface ContentHealthDashboard {
  totalProducts: number;
  averageScores: {
    seo: number;
    readability: number;
    keyword: number;
    overall: number;
  };
  lowScoreCount: number;
  lowScoreProducts: any[];
  missingDescriptionCount: number;
  totalAnalyses: number;
  recentOptimizations: any[];
  healthStatus: string;
}

export interface BatchJobStatus {
  id: string;
  name: string;
  platform: string;
  tone: string;
  status: string;
  totalProducts: number;
  processedProducts: number;
  successCount: number;
  failCount: number;
  avgScoreBefore: number;
  avgScoreAfter: number;
  items?: any[];
  createdAt: string;
  completedAt?: string;
}

export interface GeneratedDescription {
  title: string;
  description: string;
  keywords: string[];
  seoScore: number;
  highlights: string[];
  callToAction: string;
}

export function useContentAnalysis() {
  const { data: session } = useSession();
  const accessToken = (session?.user as any)?.accessToken || '';
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ContentAnalysisResult | null>(null);

  const analyze = async (data: {
    title: string;
    description?: string;
    platform?: string;
    productId?: string;
    keywords?: string[];
    category?: string;
  }) => {
    if (accessToken) apiClient.setAccessToken(accessToken);
    setLoading(true);
    try {
      const result = await apiClient.deepAnalyzeContent(data) as ContentAnalysisResult;
      setAnalysisResult(result);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const bulkAnalyze = async (productIds: string[], platform: string) => {
    if (accessToken) apiClient.setAccessToken(accessToken);
    setLoading(true);
    try {
      return await apiClient.bulkAnalyzeContent(productIds, platform);
    } finally {
      setLoading(false);
    }
  };

  return { analyze, bulkAnalyze, analysisResult, loading };
}

export function useContentHealth() {
  const [data, setData] = useState<ContentHealthDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const result = await apiClient.getContentHealth() as ContentHealthDashboard;
      setData(result);
      return result;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return { data, loading, refetch: fetchHealth };
}

export function useContentOptimization() {
  const { data: session } = useSession();
  const accessToken = (session?.user as any)?.accessToken || '';
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ContentOptimizationResult | null>(null);

  const optimizeDeep = async (data: {
    title: string;
    description?: string;
    platform: string;
    tone?: string;
    productId?: string;
    keywords?: string[];
    category?: string;
    templateId?: string;
  }) => {
    if (accessToken) apiClient.setAccessToken(accessToken);
    setLoading(true);
    try {
      const res = await apiClient.deepOptimizeContent(data) as ContentOptimizationResult;
      setResult(res);
      return res;
    } finally {
      setLoading(false);
    }
  };

  const generateDesc = async (data: {
    productName: string;
    keywords?: string[];
    platform: string;
    tone: string;
    category?: string;
    features?: string[];
    templateId?: string;
  }) => {
    setLoading(true);
    try {
      return await apiClient.generateProductDescription(data) as GeneratedDescription;
    } finally {
      setLoading(false);
    }
  };

  const apply = async (optimizationId: string, syncToPlatform?: boolean) => {
    setLoading(true);
    try {
      return await apiClient.applyContentOptimization(optimizationId, syncToPlatform);
    } finally {
      setLoading(false);
    }
  };

  const bulkApply = async (optimizationIds: string[], syncToPlatform?: boolean) => {
    setLoading(true);
    try {
      return await apiClient.bulkApplyOptimizations(optimizationIds, syncToPlatform);
    } finally {
      setLoading(false);
    }
  };

  return { optimizeDeep, generateDesc, apply, bulkApply, result, loading };
}

export function useBatchOptimization() {
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<BatchJobStatus[]>([]);

  const createBatch = async (data: {
    name: string;
    productIds: string[];
    platform: string;
    tone?: string;
    config?: any;
  }) => {
    setLoading(true);
    try {
      return await apiClient.createBatchOptimization(data);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const result = await apiClient.listBatchJobs() as BatchJobStatus[];
      setJobs(result);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const getJobStatus = async (jobId: string) => {
    return await apiClient.getBatchJobStatus(jobId) as BatchJobStatus;
  };

  return { createBatch, fetchJobs, getJobStatus, jobs, loading };
}

export function useContentTemplates() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const result = await apiClient.getContentTemplates() as any[];
      setTemplates(result);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const createTemplate = async (data: any) => {
    setLoading(true);
    try {
      const result = await apiClient.createContentTemplate(data);
      await fetchTemplates();
      return result;
    } finally {
      setLoading(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    setLoading(true);
    try {
      await apiClient.deleteContentTemplate(id);
      await fetchTemplates();
    } finally {
      setLoading(false);
    }
  };

  return { templates, fetchTemplates, createTemplate, deleteTemplate, loading };
}

export function useContentRules() {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRules = async (platform?: string) => {
    setLoading(true);
    try {
      const result = await apiClient.getContentRules(platform) as any[];
      setRules(result);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const createRule = async (data: any) => {
    setLoading(true);
    try {
      const result = await apiClient.createContentRule(data);
      await fetchRules();
      return result;
    } finally {
      setLoading(false);
    }
  };

  const deleteRule = async (id: string) => {
    setLoading(true);
    try {
      await apiClient.deleteContentRule(id);
      await fetchRules();
    } finally {
      setLoading(false);
    }
  };

  return { rules, fetchRules, createRule, deleteRule, loading };
}

export function useOrders() {
  const { data: session } = useSession();
  const tenantId = (session?.user as any)?.tenantId as string | undefined;
  const accessToken = (session?.user as any)?.accessToken as string | undefined;
  const [loading, setLoading] = useState(false);

  const getOrders = async (params: any) => {
    if (accessToken) apiClient.setAccessToken(accessToken);
    if (tenantId) apiClient.setTenantId(tenantId);
    setLoading(true);
    try {
      const query = new URLSearchParams(params).toString();
      return await apiClient.request(`/orders?${query}`);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    if (tenantId) apiClient.setTenantId(tenantId);
    setLoading(true);
    try {
      return await apiClient.request(`/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async (data: any) => {
    if (tenantId) apiClient.setTenantId(tenantId);
    setLoading(true);
    try {
      return await apiClient.request('/orders', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } finally {
      setLoading(false);
    }
  };

  return { getOrders, updateStatus, createOrder, loading };
}

export function useInventory(params: Record<string, any> = {}) {
  const fetcher = useCallback(
    (tenantId: string) => {
      apiClient.setTenantId(tenantId);
      return apiClient.getInventory(params) as Promise<any>;
    },
    [params]
  );
  return useApiData(fetcher);
}

export function useInventoryStats() {
  const fetcher = useCallback(
    (tenantId: string) => {
      apiClient.setTenantId(tenantId);
      return apiClient.getInventoryStats() as Promise<any>;
    },
    []
  );
  return useApiData(fetcher);
}

export function useOrderStats() {
  const fetcher = useCallback(
    (tenantId: string) => apiClient.getOrderStats(tenantId) as Promise<any>,
    []
  );
  return useApiData(fetcher);
}

export function useReturns(params: Record<string, string> = {}) {
  const fetcher = useCallback(
    (tenantId: string) => {
      apiClient.setTenantId(tenantId);
      return apiClient.getReturns(params) as Promise<any>;
    },
    [params]
  );
  return useApiData(fetcher);
}

export function useReturnStats() {
  const fetcher = useCallback(
    (tenantId: string) => {
      apiClient.setTenantId(tenantId);
      return apiClient.getReturnStats() as Promise<any>;
    },
    []
  );
  return useApiData(fetcher);
}

export function useFinance() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const accessToken = (session?.user as any)?.accessToken || '';
  const tenantId = (session?.user as any)?.tenantId || '';

  const getStats = async () => {
    if (!tenantId) return null;
    if (accessToken) apiClient.setAccessToken(accessToken);
    setLoading(true);
    try {
      return await apiClient.request(`/finance/stats?tenantId=${tenantId}`);
    } finally {
      setLoading(false);
    }
  };

  const calculateProfit = async (orderId: string) => {
    if (accessToken) apiClient.setAccessToken(accessToken);
    setLoading(true);
    try {
      return await apiClient.request(`/finance/calculate-profit?orderId=${orderId}`, {
        method: 'POST'
      });
    } finally {
      setLoading(false);
    }
  };

  return { getStats, calculateProfit, loading };
}

export function useInvoices() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const accessToken = (session?.user as any)?.accessToken || '';
  const tenantId = (session?.user as any)?.tenantId || '';

  const getInvoices = async () => {
    if (!tenantId) return null;
    if (accessToken) apiClient.setAccessToken(accessToken);
    setLoading(true);
    try {
      return await apiClient.request(`/finance/invoices?tenantId=${tenantId}`);
    } finally {
      setLoading(false);
    }
  };

  const generateInvoice = async (orderId: string) => {
    if (accessToken) apiClient.setAccessToken(accessToken);
    setLoading(true);
    try {
      return await apiClient.request(`/finance/generate-invoice`, {
        method: 'POST',
        body: JSON.stringify({ orderId }),
      });
    } finally {
      setLoading(false);
    }
  };

  return { getInvoices, generateInvoice, loading };
}

export interface OptimizedContent {
  optimizedTitle: string;
  optimizedDescription: string;
  keywords: string[];
  seoScoreAfter: number;
  improvements: string[];
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  activeProducts: number;
  conversionRate: number;
  netProfit?: number;
  profitMargin?: number;
  periodComparison: {
    revenueChange: number;
    ordersChange: number;
    productsChange: number;
    conversionChange: number;
    profitChange?: number;
    marginChange?: number;
  };
}

export interface PlatformPerformance {
  platform: string;
  revenue: number;
  orders: number;
  growth: number;
  share: number;
}

export interface RecentOrder {
  id: string;
  customer: string;
  product: string;
  price: number;
  status: string;
  platform: string;
  createdAt: string;
}

export interface StockAlert {
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  status: 'critical' | 'low' | 'normal';
  daysUntilStockout: number;
}

export interface PaymentStats {
  totalRevenue: number;
  netProfit: number;
  pendingPayments: number;
  expectedPayments: number;
  platformFees: number;
  shippingCosts: number;
  refunds: number;
  profitMargin: number;
  platformBreakdown: {
    platform: string;
    revenue: number;
    commission: number;
    net: number;
  }[];
}

export interface PendingPayment {
  platform: string;
  amount: number;
  expectedDate: string;
  daysLeft: number;
}

export interface LoginEntry {
  id: string;
  date: string;
  ip: string;
  device: string;
  browser: string;
  location: string;
  status: 'success' | 'failed';
}
export interface AiInsight {
  id: string;
  type: string;
  priority: string;
  title: string;
  description: string;
  impact: string;
  confidence: number;
  actions: string[];
  createdAt: string;
}

export interface TrendData {
  date: string;
  value: number;
}

export interface SalesForecast {
  historicalData: TrendData[];
  forecast: { date: string; predicted: number; confidence: number }[];
  summary: {
    expectedRevenue: number;
    averageDaily: number;
    growthRate: number;
  };
  insights?: { type: string; title: string; description: string }[];
}

export interface CategoryPerformance {
  name: string;
  count: number;
  revenue: number;
  avgPrice: number;
  share: number;
}

export interface AiRecommendation {
  id: string;
  type: string;
  priority: string;
  title: string;
  description: string;
  impact: string;
  confidence: number;
  actions: string[];
  data?: any;
}

export interface PerformanceScores {
  overall: number;
  seo: number;
  pricing: number;
  stockHealth: number;
  customerSatisfaction: number;
  competitiveness: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function useSupport() {
  const { data: session } = useSession();
  const accessToken = (session?.user as any)?.accessToken || '';
  const [loading, setLoading] = useState(false);

  const getTickets = async (tenantId: string = 'demo-tenant-id') => {
    if (accessToken) apiClient.setAccessToken(accessToken);
    setLoading(true);
    try {
      return await apiClient.request(`/support/tickets?tenantId=${tenantId}`);
    } finally {
      setLoading(false);
    }
  };

  const getTicketDetails = async (id: string, tenantId: string = 'demo-tenant-id') => {
    setLoading(true);
    try {
      return await apiClient.request(`/support/tickets/${id}?tenantId=${tenantId}`);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (data: { ticketId: string; content: string; senderType: string; tenantId?: string }) => {
    setLoading(true);
    try {
      return await apiClient.request(`/support/messages`, {
        method: 'POST',
        body: JSON.stringify({ ...data, tenantId: data.tenantId || 'demo-tenant-id' }),
      });
    } finally {
      setLoading(false);
    }
  };

  const createTicket = async (data: { subject: string; message: string; platform?: string; tenantId?: string }) => {
    setLoading(true);
    try {
      return await apiClient.request(`/support/tickets`, {
        method: 'POST',
        body: JSON.stringify({ ...data, tenantId: data.tenantId || 'demo-tenant-id' }),
      });
    } finally {
      setLoading(false);
    }
  };

  return { getTickets, getTicketDetails, sendMessage, createTicket, loading };
}

// ==========================================
// CUSTOMER HOOKS
// ==========================================
export function useCustomers(params: Record<string, any> = {}) {
  const paramsKey = JSON.stringify(params);

  const fetcher = useCallback(
    (tenantId: string) => {
      apiClient.setTenantId(tenantId);
      return apiClient.getCustomers(params) as Promise<{
        customers: Customer[];
        pagination: { total: number; page: number; limit: number; totalPages: number };
      }>;
    },
    [paramsKey]
  );

  const { data, loading, error, refetch } = useApiData<{
    customers: Customer[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }>(fetcher);

  const updateCustomer = async (id: string, updateData: Partial<Customer>) => {
    const result = await apiClient.updateCustomer(id, updateData);
    await refetch();
    return result;
  };

  return {
    customers: data?.customers || [],
    pagination: data?.pagination,
    loading,
    error,
    fetchCustomers: refetch,
    updateCustomer,
    refetch,
  };
}

export function useCustomerStats() {
  const fetcher = useCallback(
    (tenantId: string) => {
      apiClient.setTenantId(tenantId);
      return apiClient.getCustomerStats() as Promise<CustomerStats>;
    },
    []
  );
  return useApiData<CustomerStats>(fetcher);
}

export function useRFMAnalysis() {
  const fetcher = useCallback(
    (tenantId: string) => {
      apiClient.setTenantId(tenantId);
      return apiClient.getRFMAnalysis() as Promise<RFMAnalysisData>;
    },
    []
  );
  return useApiData<RFMAnalysisData>(fetcher);
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  segment: 'vip' | 'regular' | 'new' | 'at-risk' | 'churned';
  totalOrders: number;
  totalSpent: number;
  avgOrderValue: number;
  lastOrderDate: string;
  joinDate: string;
  platforms: string[];
  loyaltyScore: number;
  tags?: string[];
  address?: { city: string; country: string };
  notes?: string;
}

export interface CustomerStats {
  totalCustomers: number;
  newCustomersThisMonth: number;
  vipCustomers: number;
  atRiskCustomers: number;
  avgLifetimeValue: number;
  retentionRate: number;
  churnRate: number;
  customerGrowth: number;
}

export interface RFMScore {
  customerId: string;
  customerName: string;
  customerEmail: string;
  recency: number;
  frequency: number;
  monetary: number;
  recencyScore: number;
  frequencyScore: number;
  monetaryScore: number;
  rfmScore: string;
  segment: string;
  segmentDescription: string;
}

export interface CustomerSegmentRFM {
  name: string;
  code: string;
  description: string;
  count: number;
  percentage: number;
  avgMonetary: number;
  avgFrequency: number;
  color: string;
  action: string;
}

export interface RFMAnalysisData {
  customers: RFMScore[];
  segments: CustomerSegmentRFM[];
  summary: {
    totalCustomers: number;
    avgRecency: number;
    avgFrequency: number;
    avgMonetary: number;
    topSegment: string;
    atRiskCount: number;
    championsCount: number;
  };
}

// ==========================================
// STORE HOOKS
// ==========================================
export function useStores() {
  const { data: session } = useSession();
  const accessToken = (session?.user as any)?.accessToken || '';
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const fetchStores = async () => {
    if (accessToken) apiClient.setAccessToken(accessToken);
    setLoading(true);
    setError(null);
    try {
      const raw = (await apiClient.getStores()) as any[];
      const mapped: Store[] = (raw || []).map((s: any) => ({
        id: s.id,
        platform: s.platform ? String(s.platform).toLowerCase() : '',
        storeName: s.name || `${s.platform} Mağazası`,
        name: s.name,
        status: s.status || 'disconnected',
        verified: s.verified === true,
        connectionStatus: s.connectionStatus,
        lastSync: s.lastSync
          ? new Date(s.lastSync).toLocaleString('tr-TR')
          : 'Henüz senkronize edilmedi',
        lastSyncAttemptAt: s.lastSyncAttemptAt,
        lastSyncStatus: s.lastSyncStatus,
        lastSyncError: s.lastSyncError,
        productsAdded: s.productsAdded ?? 0,
        productsUpdated: s.productsUpdated ?? 0,
        productsFailed: s.productsFailed ?? 0,
        ordersSynced: s.ordersSynced ?? 0,
        totalProducts: s.productCount ?? s.totalProducts ?? 0,
        totalOrders: s.orderCount ?? s.totalOrders ?? 0,
        revenue: s.revenue ?? 0,
        rating: s.rating ?? 0,
        health: s.health ?? 0,
        credentials: s.credentials,
      }));
      setStores(mapped);
      return mapped;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Mağazalar yüklenemedi'));
      return [];
    } finally {
      setLoading(false);
    }
  };

  const connectStore = async (
    platform: string,
    credentials: Record<string, unknown>,
    marketplaceId?: string,
  ) => {
    setLoading(true);
    try {
      const result = await apiClient.connectStore(
        platform,
        credentials,
        marketplaceId,
      );
      await fetchStores();
      return result;
    } finally {
      setLoading(false);
    }
  };

  const disconnectStore = async (storeId: string) => {
    setLoading(true);
    try {
      await apiClient.disconnectStore(storeId);
      await fetchStores();
    } finally {
      setLoading(false);
    }
  };

  const syncStore = async (storeId: string, syncType?: string) => {
    setLoading(true);
    try {
      return await apiClient.syncStore(storeId, syncType);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  return { stores, loading, error, fetchStores, connectStore, disconnectStore, syncStore };
}

export interface Store {
  id: string;
  platform: string;
  storeName: string;
  name?: string;
  status: 'connected' | 'disconnected' | 'error' | 'pending' | 'syncing';
  verified?: boolean;
  connectionStatus?: string;
  lastSync: string;
  lastSyncAttemptAt?: string | null;
  lastSyncStatus?: string | null;
  lastSyncError?: string | null;
  productsAdded?: number;
  productsUpdated?: number;
  productsFailed?: number;
  ordersSynced?: number;
  totalProducts: number;
  totalOrders: number;
  revenue: number;
  rating: number;
  health?: number;
  credentials?: any;
  syncProgress?: number;
}

// ==========================================
// CAMPAIGN HOOKS
// ==========================================
export function useCampaigns() {
  const { data: session } = useSession();
  const accessToken = (session?.user as any)?.accessToken || '';
  const [loading, setLoading] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const fetchCampaigns = async (params: Record<string, string> = {}) => {
    if (accessToken) apiClient.setAccessToken(accessToken);
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.getCampaigns(params) as Campaign[];
      setCampaigns(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Kampanyalar yüklenemedi'));
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createCampaign = async (data: Partial<Campaign>) => {
    setLoading(true);
    try {
      const result = await apiClient.createCampaign(data);
      await fetchCampaigns();
      return result;
    } finally {
      setLoading(false);
    }
  };

  const updateCampaign = async (id: string, data: Partial<Campaign>) => {
    setLoading(true);
    try {
      const result = await apiClient.updateCampaign(id, data);
      await fetchCampaigns();
      return result;
    } finally {
      setLoading(false);
    }
  };

  const deleteCampaign = async (id: string) => {
    setLoading(true);
    try {
      await apiClient.deleteCampaign(id);
      await fetchCampaigns();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  return { campaigns, loading, error, fetchCampaigns, createCampaign, updateCampaign, deleteCampaign };
}

export interface Campaign {
  id: string;
  name: string;
  type: 'discount' | 'flash-sale' | 'bundle' | 'loyalty' | 'seasonal';
  status: 'active' | 'paused' | 'scheduled' | 'completed' | 'draft';
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  revenue: number;
  roas: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  conversionRate: number;
  platforms: string[];
  products: string[];
  description?: string;
  discount?: number;
  stats?: {
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
    roas: number;
  };
}

// ==========================================
// REVIEW HOOKS
// ==========================================
export function useReviews(params: Record<string, string> = {}) {
  const fetcher = useCallback(
    (tenantId: string) => {
      apiClient.setTenantId(tenantId);
      return apiClient.getReviews(params) as Promise<any>;
    },
    [params]
  );
  return useApiData(fetcher);
}

export function useReviewStats() {
  const fetcher = useCallback(
    (tenantId: string) => {
      apiClient.setTenantId(tenantId);
      return apiClient.getReviewStats() as Promise<any>;
    },
    []
  );
  return useApiData(fetcher);
}

export interface Review {
  id: string;
  productId: string;
  productName: string;
  customerName: string;
  rating: number;
  comment: string;
  reply?: string;
  platform: string;
  date: string;
  status: 'pending' | 'replied' | 'flagged' | 'resolved';
  sentiment: 'positive' | 'neutral' | 'negative';
  aiSuggestedReply?: string;
  helpful: number;
  verified: boolean;
  // Fallback compatibility
  product?: string;
  customer?: string;
  avatar?: string;
  title?: string;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  responseRate: number;
  sentimentBreakdown: { positive: number; neutral: number; negative: number };
  ratingDistribution: { [key: number]: number };
  avgResponseTime: string;
  unrepliedCount: number;
}

// ==========================================
// PRICING HOOKS
// ==========================================
export function usePricingAnalysis() {
  const { data: session } = useSession();
  const accessToken = (session?.user as any)?.accessToken || '';
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<PricingItem[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const fetchAnalysis = async (params: Record<string, string> = {}) => {
    if (accessToken) apiClient.setAccessToken(accessToken);
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.getPricingAnalysis(params) as PricingItem[];
      setAnalysis(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fiyat analizi yüklenemedi'));
      return [];
    } finally {
      setLoading(false);
    }
  };

  const applyPrice = async (productId: string, newPrice: number) => {
    setLoading(true);
    try {
      const result = await apiClient.applyPriceRecommendation(productId, newPrice);
      await fetchAnalysis();
      return result;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, []);

  return { analysis, loading, error, fetchAnalysis, applyPrice };
}

export interface PricingItem {
  id: string;
  productName: string;
  sku: string;
  currentPrice: number;
  recommendedPrice: number;
  competitorMin: number;
  competitorMax: number;
  competitorAvg: number;
  margin: number;
  buyBoxStatus: 'winning' | 'losing' | 'no-competition';
  priceChange: number;
  platform: string;
  demand: 'high' | 'medium' | 'low';
  aiConfidence: number;
}

// ==========================================
// COMPETITOR INTELLIGENCE HOOKS
// ==========================================
export function useCompetitorAlerts(threshold: number = 5) {
  const fetcher = useCallback(
    () => apiClient.getCompetitorAlerts(threshold) as Promise<{ alertCount: number; alerts: CompetitorAlert[] }>,
    [threshold]
  );
  const { data, loading, error, refetch } = useApiData(
    useCallback((_tenantId: string) => fetcher(), [fetcher])
  );
  return { alerts: data?.alerts || [], alertCount: data?.alertCount || 0, loading, error, refetch };
}

export interface CompetitorAlert {
  type: string;
  severity: 'high' | 'medium' | 'low';
  productId: string;
  productTitle: string;
  details: string;
  myPrice?: number;
  competitorAvgPrice?: number;
}

export function useCompetitorGap(productId: string) {
  const fetcher = useCallback(
    (_tenantId: string) => apiClient.getCompetitorGap(productId),
    [productId]
  );
  return useApiData(fetcher);
}

export function usePricingRules() {
  const [rules, setRules] = useState<PricingRuleData[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const result = await apiClient.getPricingRules() as PricingRuleData[];
      setRules(result || []);
    } finally {
      setLoading(false);
    }
  };

  const createRule = async (data: Record<string, unknown>) => {
    setLoading(true);
    try {
      await apiClient.createPricingRule(data);
      await fetchRules();
    } finally {
      setLoading(false);
    }
  };

  const deleteRule = async (ruleId: string) => {
    setLoading(true);
    try {
      await apiClient.deletePricingRule(ruleId);
      await fetchRules();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRules(); }, []);
  return { rules, loading, fetchRules, createRule, deleteRule };
}

export interface PricingRuleData {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  priority: number;
  appliedCount: number;
  conditions: Record<string, unknown>;
  action: Record<string, unknown>;
}

export function useExperiments() {
  const [experiments, setExperiments] = useState<ExperimentData[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchExperiments = async () => {
    setLoading(true);
    try {
      const result = await apiClient.getExperiments() as ExperimentData[];
      setExperiments(result || []);
    } finally {
      setLoading(false);
    }
  };

  const createExperiment = async (data: Record<string, unknown>) => {
    setLoading(true);
    try {
      await apiClient.createExperiment(data);
      await fetchExperiments();
    } finally {
      setLoading(false);
    }
  };

  const stopExperiment = async (experimentId: string) => {
    setLoading(true);
    try {
      const result = await apiClient.stopExperiment(experimentId);
      await fetchExperiments();
      return result;
    } finally {
      setLoading(false);
    }
  };

  const evaluateExperiment = async (experimentId: string) => {
    return apiClient.evaluateExperiment(experimentId);
  };

  useEffect(() => { fetchExperiments(); }, []);
  return { experiments, loading, fetchExperiments, createExperiment, stopExperiment, evaluateExperiment };
}

export interface ExperimentData {
  id: string;
  productId: string;
  name: string;
  status: string;
  controlPrice: number;
  testPrice: number;
  controlSales: number;
  testSales: number;
  controlRevenue: number;
  testRevenue: number;
  startDate: string;
  endDate?: string;
  durationDays: number;
  result?: {
    winner: string;
    salesLift: number;
    revenueLift: number;
    significance: number;
    isSignificant: boolean;
    recommendation: string;
  };
}

// ==========================================
// SHIPPING HOOKS
// ==========================================
export function useShipping() {
  const [loading, setLoading] = useState(false);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [providers, setProviders] = useState<ShippingProvider[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const fetchShipments = async (params: Record<string, string> = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.getShipments(params) as Shipment[];
      setShipments(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Kargolar yüklenemedi'));
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchProviders = async () => {
    try {
      const result = await apiClient.getShippingProviders() as ShippingProvider[];
      setProviders(result);
      return result;
    } catch {
      return [];
    }
  };

  const trackShipment = async (trackingNumber: string) => {
    return await apiClient.trackShipment(trackingNumber);
  };

  const calculateShipping = async (data: any) => {
    return await apiClient.calculateShipping(data);
  };

  useEffect(() => {
    fetchShipments();
    fetchProviders();
  }, []);

  return { shipments, providers, loading, error, fetchShipments, fetchProviders, trackShipment, calculateShipping };
}

export interface Shipment {
  id: string;
  orderId: string;
  trackingNumber: string;
  carrier: string;
  status: 'pending' | 'picked-up' | 'in-transit' | 'out-for-delivery' | 'delivered' | 'returned';
  estimatedDelivery: string;
  actualDelivery?: string;
  customerName: string;
  destination: { city: string; district: string };
  weight: number;
  cost: number;
  platform: string;
  createdAt: string;
}

export interface ShippingProvider {
  id: string;
  name: string;
  logo?: string;
  isActive: boolean;
  avgDeliveryDays: number;
  rating: number;
  pricePerKg: number;
  supportedRegions: string[];
  features: string[];
}

// ==========================================
// REPORT HOOKS
// ==========================================
export function useReports() {
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [scheduled, setScheduled] = useState<ScheduledReport[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const fetchReports = async (params: Record<string, string> = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.getReports(params) as Report[];
      setReports(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Raporlar yüklenemedi'));
      return [];
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (type: string, params: any) => {
    setLoading(true);
    try {
      const result = await apiClient.generateReport(type, params);
      await fetchReports();
      return result;
    } finally {
      setLoading(false);
    }
  };

  const fetchScheduled = async () => {
    try {
      const result = await apiClient.getScheduledReports() as ScheduledReport[];
      setScheduled(result);
      return result;
    } catch {
      return [];
    }
  };

  const exportData = async (type: string, format: string = 'csv') => {
    return await apiClient.exportData(type, format);
  };

  useEffect(() => {
    fetchReports();
    fetchScheduled();
  }, []);

  return { reports, scheduled, loading, error, fetchReports, generateReport, fetchScheduled, exportData };
}

export interface Report {
  id: string;
  name: string;
  type: 'sales' | 'inventory' | 'financial' | 'customer' | 'performance' | 'custom';
  status: 'ready' | 'generating' | 'failed';
  createdAt: string;
  period: string;
  format: string;
  size?: string;
  downloadUrl?: string;
  summary?: Record<string, any>;
  month?: string;
  revenue?: number;
  orders?: number;
  profit?: number;
}

export interface ScheduledReport {
  id: string;
  name: string;
  type: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  nextRun: string;
  lastRun?: string;
  recipients: string[];
  isActive: boolean;
}

// ==========================================
// PAYMENT HOOKS
// ==========================================
export function usePayments() {
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [pending, setPending] = useState<PendingPayment[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const fetchPayments = async (params: Record<string, string> = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.getPayments(params) as Payment[];
      setPayments(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Ödemeler yüklenemedi'));
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const result = await apiClient.getPaymentStats() as PaymentStats;
      setStats(result);
      return result;
    } catch {
      return null;
    }
  };

  const fetchPending = async () => {
    try {
      const result = await apiClient.getPendingPayments() as PendingPayment[];
      setPending(result);
      return result;
    } catch {
      return [];
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchStats();
    fetchPending();
  }, []);

  return { payments, stats, pending, loading, error, fetchPayments, fetchStats, fetchPending };
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  platform: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  method: string;
  date: string;
  commission: number;
  netAmount: number;
  customerName: string;
}

export interface PaymentStats {
  totalRevenue: number;
  pendingAmount: number;
  totalCommissions: number;
  netProfit: number;
  avgTransactionValue: number;
  refundRate: number;
  platformBreakdown: { platform: string; revenue: number; commission: number; net: number }[];
}

export interface PendingPayment {
  id: string;
  platform: string;
  amount: number;
  expectedDate: string;
  orderCount: number;
}

// ==========================================
// SECURITY HOOKS
// ==========================================
export function useSecurity() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState<SecurityOverview | null>(null);
  const [loginHistory, setLoginHistory] = useState<LoginEntry[]>([]);
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const tenantId = (session?.user as { tenantId?: string } | undefined)?.tenantId;
    const accessToken = (session as { accessToken?: string } | null)?.accessToken;
    if (accessToken) apiClient.setAccessToken(accessToken);
    if (tenantId) apiClient.setTenantId(tenantId);
  }, [session]);

  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.getSecurityOverview() as SecurityOverview;
      setOverview(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Güvenlik bilgileri yüklenemedi'));
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchLoginHistory = async () => {
    try {
      const result = await apiClient.getLoginHistory() as LoginEntry[];
      setLoginHistory(result);
      return result;
    } catch { return []; }
  };

  const fetchSessions = async () => {
    try {
      const result = await apiClient.getActiveSessions() as ActiveSession[];
      setSessions(result);
      return result;
    } catch { return []; }
  };

  const fetchApiKeys = async () => {
    try {
      const result = await apiClient.getApiKeys() as ApiKey[];
      setApiKeys(result);
      return result;
    } catch { return []; }
  };

  const createApiKey = async (name: string, permissions: string[]) => {
    setLoading(true);
    try {
      const result = await apiClient.createApiKey(name, permissions);
      await fetchApiKeys();
      return result;
    } finally { setLoading(false); }
  };

  const revokeApiKey = async (keyId: string) => {
    setLoading(true);
    try {
      await apiClient.revokeApiKey(keyId);
      await fetchApiKeys();
    } finally { setLoading(false); }
  };

  const revokeSession = async (sessionId: string) => {
    setLoading(true);
    try {
      await apiClient.revokeSession(sessionId);
      await fetchSessions();
    } finally { setLoading(false); }
  };

  const toggle2FA = async (enabled: boolean) => {
    setLoading(true);
    try {
      return await apiClient.toggle2FA(enabled);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!session?.user) return;
    fetchOverview();
    fetchLoginHistory();
    fetchSessions();
    fetchApiKeys();
  }, [session?.user]);

  return {
    overview, loginHistory, sessions, apiKeys,
    loading, error,
    fetchOverview, fetchLoginHistory, fetchSessions, fetchApiKeys,
    createApiKey, revokeApiKey, revokeSession, toggle2FA
  };
}

export interface SecurityOverview {
  securityScore: number;
  twoFactorEnabled: boolean;
  lastPasswordChange: string;
  failedLoginAttempts: number;
  activeSessionCount: number;
  apiKeyCount: number;
  threats: { level: string; message: string; date: string }[];
}

export interface FinanceStats {
  totalRevenue: number;
  totalProfit: number;
  totalCommission: number;
  margin: number;
  orderCount: number;
}

export interface Prediction {
  id: string;
  productId: string;
  productName: string;
  currentValue: number;
  predictedValue: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  insights: string[];
}

export interface OrderItem {
  id: string;
  title: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  marketplaceOrderId: string;
  platform: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  orderDate: string;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'RETURNED';
  totalAmount: number;
  paymentStatus: 'PAID' | 'PENDING' | 'FAILED';
  shippingAddress: string;
  items: OrderItem[];
}
export interface PaymentStats {
  totalRevenue: number;
  netProfit: number;
  pendingPayments: number;
  expectedPayments: number;
  platformFees: number;
  shippingCosts: number;
  refunds: number;
  profitMargin: number;
  platformBreakdown: {
    platform: string;
    revenue: number;
    commission: number;
    net: number;
  }[];
}

export interface PendingPayment {
  platform: string;
  amount: number;
  expectedDate: string;
  daysLeft: number;
}

export interface ActiveSession {
  id: string;
  device: string;
  browser: string;
  ip: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  createdAt: string;
  lastUsed: string;
  isActive: boolean;
}

// ==========================================
// AUTOMATION HOOKS
// ==========================================
export function useAutomations() {
  const [loading, setLoading] = useState(false);
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const fetchAutomations = async (params: Record<string, string> = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.getAutomations(params) as Automation[];
      setAutomations(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Otomasyonlar yüklenemedi'));
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createAutomation = async (data: Partial<Automation>) => {
    setLoading(true);
    try {
      const result = await apiClient.createAutomation(data);
      await fetchAutomations();
      return result;
    } finally { setLoading(false); }
  };

  const updateAutomation = async (id: string, data: Partial<Automation>) => {
    setLoading(true);
    try {
      const result = await apiClient.updateAutomation(id, data);
      await fetchAutomations();
      return result;
    } finally { setLoading(false); }
  };

  const toggleAutomation = async (id: string, isActive: boolean) => {
    setLoading(true);
    try {
      await apiClient.toggleAutomation(id, isActive);
      await fetchAutomations();
    } finally { setLoading(false); }
  };

  const deleteAutomation = async (id: string) => {
    setLoading(true);
    try {
      await apiClient.deleteAutomation(id);
      await fetchAutomations();
    } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchAutomations();
  }, []);

  return { automations, loading, error, fetchAutomations, createAutomation, updateAutomation, toggleAutomation, deleteAutomation };
}


// ==========================================
// BULK ACTIONS HOOKS
// ==========================================
export function useBulkActions() {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<BulkActionRecord[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const executeBulkAction = async (action: string, productIds: string[], data: any) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.executeBulkAction(action, productIds, data);
      await fetchHistory();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Toplu işlem başarısız'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const rollbackBulkAction = async (bulkActionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.rollbackBulkAction(bulkActionId);
      await fetchHistory();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Geri alma başarısız'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const result = await apiClient.getBulkActionHistory() as BulkActionRecord[];
      setHistory(result);
      return result;
    } catch { return []; }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return { history, loading, error, executeBulkAction, rollbackBulkAction, fetchHistory };
}

export interface BulkActionRecord {
  id: string;
  action: string;
  status: 'completed' | 'in-progress' | 'failed' | 'partial' | 'rolled_back';
  affectedCount?: number;
  totalCount?: number;
  productCount?: number;
  success?: number;
  failed?: number;
  startedAt?: string;
  completedAt?: string;
  executedAt?: string;
  details?: string;
  user?: string;
  executedBy?: string;
  canRollback?: boolean;
  isRolledBack?: boolean;
  snapshotCount?: number;
}

// ==========================================
// SEO HOOKS
// ==========================================
export function useSeoAnalysis() {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<SeoAnalysisItem[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const fetchAnalysis = async (params: Record<string, string> = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.getSeoAnalysis(params) as SeoAnalysisItem[];
      setAnalysis(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('SEO analizi yüklenemedi'));
      return [];
    } finally {
      setLoading(false);
    }
  };

  const optimizeSeo = async (productId: string) => {
    setLoading(true);
    try {
      const result = await apiClient.optimizeSeo(productId);
      await fetchAnalysis();
      return result;
    } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchAnalysis();
  }, []);

  return { analysis, loading, error, fetchAnalysis, optimizeSeo };
}

export interface SeoAnalysisItem {
  id: string;
  productName: string;
  platform: string;
  seoScore: number;
  titleScore: number;
  descriptionScore: number;
  keywordScore: number;
  imageScore: number;
  issues: { type: string; message: string; severity: 'high' | 'medium' | 'low' }[];
  suggestions: string[];
  lastAnalyzed: string;
}

// ==========================================
// ACTIVITY HOOKS
// ==========================================
export function useActivityLog() {
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const fetchActivities = async (params: Record<string, string> = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.getActivityLog(params) as ActivityEntry[];
      setActivities(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Aktivite logu yüklenemedi'));
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  return { activities, loading, error, fetchActivities, refetch: fetchActivities };
}

export interface ActivityLog {
  id: string;
  type: 'create' | 'update' | 'delete' | 'login' | 'sync' | 'export' | 'import' | 'bulk-action' | 'automation' | 'view' | 'sync';
  module: 'products' | 'orders' | 'customers' | 'settings' | 'integrations' | 'ai' | 'auth' | 'finance';
  title: string;
  description: string;
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  timestamp: Date;
  status: 'success' | 'failed' | 'warning';
}

export type ActivityEntry = ActivityLog;

// ==========================================
// WEBHOOK HOOKS
// ==========================================
export function useWebhooks() {
  const [loading, setLoading] = useState(false);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const fetchWebhooks = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.getWebhooks() as Webhook[];
      setWebhooks(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Webhooklar yüklenemedi'));
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createWebhook = async (data: Partial<Webhook>) => {
    setLoading(true);
    try {
      const result = await apiClient.createWebhook(data);
      await fetchWebhooks();
      return result;
    } finally { setLoading(false); }
  };

  const updateWebhook = async (id: string, data: Partial<Webhook>) => {
    setLoading(true);
    try {
      const result = await apiClient.updateWebhook(id, data);
      await fetchWebhooks();
      return result;
    } finally { setLoading(false); }
  };

  const deleteWebhook = async (id: string) => {
    setLoading(true);
    try {
      await apiClient.deleteWebhook(id);
      await fetchWebhooks();
    } finally { setLoading(false); }
  };

  const testWebhook = async (id: string) => {
    setLoading(true);
    try {
      return await apiClient.testWebhook(id);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchWebhooks();
  }, []);

  return { webhooks, loading, error, fetchWebhooks, createWebhook, updateWebhook, deleteWebhook, testWebhook };
}

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  status: 'active' | 'paused' | 'error';
  secret?: string;
  lastTriggered?: string;
  successRate: number;
  totalCalls: number;
  failedCalls: number;
  createdAt: string;
  headers?: Record<string, string>;
}

// ==========================================
// PREDICTIONS HOOKS
// ==========================================
export function usePredictions() {
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const fetchPredictions = async (params: Record<string, string> = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.getPredictions(params) as Prediction[];
      setPredictions(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Tahminler yüklenemedi'));
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, []);

  return { predictions, loading, error, fetchPredictions };
}

export interface Prediction {
  id: string;
  productId: string;
  productName: string;
  type: 'sales' | 'demand' | 'price' | 'stock';
  currentValue: number;
  predictedValue: number;
  confidence: number;
  period: string;
  trend: 'up' | 'down' | 'stable';
  insights: string[];
  date: string;
}

// ==========================================
// PRODUCTS HOOK (Enhanced)
// ==========================================
export function useProducts(page: number = 1, limit: number = 20) {
  const fetcher = useCallback(
    (tenantId: string) => {
      apiClient.setTenantId(tenantId);
      return apiClient.getProducts(page, limit) as Promise<any>;
    },
    [page, limit]
  );
  return useApiData(fetcher);
}

export function useProductStats() {
  const fetcher = useCallback(
    (tenantId: string) => {
      apiClient.setTenantId(tenantId);
      return apiClient.getProductStats() as Promise<any>;
    },
    []
  );
  return useApiData(fetcher);
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  price: number;
  costPrice?: number;
  stock: number;
  category: string;
  brand?: string;
  platform: string[];
  status: 'active' | 'inactive' | 'draft' | 'out-of-stock';
  images: string[];
  rating: number;
  reviewCount: number;
  sales: number;
  revenue: number;
  seoScore?: number;
  weight?: number;
  dimensions?: { width: number; height: number; depth: number };
  description?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  image?: string;
}

export interface TopProduct {
  id: string;
  name: string;
  sku: string;
  price: number;
  sales: number;
  revenue: number;
  rating: number;
  image: string | null;
}

// WhatsApp Types
export interface Message {
  id: string;
  customer: string;
  time: string;
  message: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  type: string;
}

export interface Template {
  name: string;
  count: number;
  status: 'approved' | 'pending' | 'rejected';
}

export interface WhatsAppStats {
  sent: number;
  readRate: number;
  conversion: number;
  avgResponse: number;
}

export interface WhatsAppData {
  messages: Message[];
  stats: WhatsAppStats;
  templates: Template[];
}

export function useWhatsAppData() {
  const fetcher = useCallback(
    (tenantId: string) => apiClient.getWhatsAppData(tenantId) as Promise<WhatsAppData>,
    []
  );
  return useApiData(fetcher);
}

// Webhooks Hook - Removed duplicate, using existing useWebhooks at line 1654

// Tasks Hook
export function useTasks() {
  const fetcher = useCallback(
    (tenantId: string) => apiClient.getTasks(tenantId) as Promise<TaskData[]>,
    []
  );
  return useApiData(fetcher);
}

// Suppliers Hook
export function useSuppliers() {
  const fetcher = useCallback(
    (tenantId: string) => apiClient.getSuppliers(tenantId) as Promise<SupplierData[]>,
    []
  );
  return useApiData(fetcher);
}


// WebhookData - Removed duplicate, using existing Webhook interface at line 1714

export interface TaskData {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in-progress' | 'completed';
  dueDate: string;
  assignee: string;
}

export function useSeoPages() {
  const fetcher = useCallback(
    (tenantId: string) => apiClient.request('/admin/seo/pages') as Promise<{ pages: SeoPageData[]; total: number }>,
    []
  );
  return useApiData(fetcher);
}

export function useSeoStats() {
  const fetcher = useCallback(
    (tenantId: string) => apiClient.request('/admin/seo/stats') as Promise<SeoStats>,
    []
  );
  return useApiData(fetcher);
}

export interface SupplierData {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  rating: number;
  activeProducts: number;
  lastOrder: string;
  status: 'active' | 'inactive' | 'pending';
}

export interface SeoPageData {
  id: string;
  path: string;
  title: string;
  description: string;
  keywords: string[];
  seoScore: number;
  indexable: boolean;
  lastModified: string;
  ogImage: string;
  canonical: string;
}

export interface SeoStats {
  overallScore: number;
  totalPages: number;
  indexedPages: number;
  notIndexedPages: number;
  avgTitleLength: number;
  avgDescriptionLength: number;
  pagesWithoutMeta: number;
  pagesWithLowScore: number;
  totalKeywords: number;
  totalRedirects: number;
  sitemapPages: number;
  robotsRules: number;
  structuredDataTypes: number;
  lastCrawlDate: string;
  crawlErrors: number;
  mobileScore: number;
  performanceScore: number;
  accessibilityScore: number;
  bestPracticesScore: number;
  scoreHistory: Array<{ date: string; score: number }>;
}

// ==========================================
// SYSTEM PERFORMANCE HOOK
// ==========================================
export function useSystemPerformance() {
  const fetcher = useCallback(
    () => apiClient.getSystemPerformance() as Promise<any>,
    []
  );
  return useApiData(fetcher);
}

// ==========================================
// PROFITABILITY HOOK
// ==========================================
export function useProfitability() {
  const fetcher = useCallback(
    () => apiClient.getProfitabilityData() as Promise<any>,
    []
  );
  return useApiData(fetcher);
}
export function useNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Bildirimler yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await apiClient.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error('Bildirim işaretlenemedi:', error);
    }
  };

  const clearAllRead = async () => {
    // API logic could be added here
    setNotifications(prev => prev.filter(n => !n.read));
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return { notifications, setNotifications, loading, fetchNotifications, markAsRead, clearAllRead };
}

// ==========================================
// AB TESTING HOOK
// ==========================================
export function useAbTesting() {
  const fetcher = useCallback(
    () => apiClient.getAbTestingData() as Promise<any>,
    []
  );
  return useApiData(fetcher);
}

// ==========================================
// LIVE CHAT HOOK
// ==========================================
export function useLiveChat() {
  const fetcher = useCallback(
    () => apiClient.getLiveChatData() as Promise<any>,
    []
  );
  return useApiData(fetcher);
}

