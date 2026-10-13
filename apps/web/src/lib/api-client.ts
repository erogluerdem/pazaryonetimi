// API Base Configuration
function normalizeApiBaseUrl(raw?: string): string {
  const value = (raw || '').trim();
  if (!value) return '';

  if (value.startsWith('/')) {
    return value.replace(/\/$/, '');
  }

  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value.replace(/\/$/, '');
  }

  if (value.startsWith('//')) {
    return `https:${value}`.replace(/\/$/, '');
  }

  return `https://${value}`.replace(/\/$/, '');
}

const API_BASE_URL = typeof window !== 'undefined'
  ? ''
  : (normalizeApiBaseUrl(process.env.API_INTERNAL_URL || process.env.API_URL || process.env.NEXT_PUBLIC_API_URL) || 'http://localhost:3001');

// ─── Retry Configuration ──────────────────────────
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  retryableStatuses: number[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

// ─── API Error Class ──────────────────────────────
export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public endpoint: string,
    public responseBody?: any
  ) {
    super(Array.isArray(responseBody?.message) ? responseBody.message.join(', ') : responseBody?.message || responseBody?.error || `İşlem başarısız (HTTP ${status}): ${statusText}`);
    this.name = 'ApiError';
  }

  get isNetworkError() { return this.status === 0; }
  get isAuthError() { return this.status === 401 || this.status === 403; }
  get isNotFound() { return this.status === 404; }
  get isServerError() { return this.status >= 500; }
  get isRateLimited() { return this.status === 429; }
}

// ─── Event emitter for global error handling ──────
type ErrorHandler = (error: ApiError) => void;
const errorHandlers: Set<ErrorHandler> = new Set();

export function onApiError(handler: ErrorHandler): () => void {
  errorHandlers.add(handler);
  return () => errorHandlers.delete(handler);
}

function emitApiError(error: ApiError) {
  errorHandlers.forEach(handler => {
    try { handler(error); } catch { }
  });
}

class ApiClient {
  private baseUrl: string;
  private tenantId: string | null = null;
  private accessToken: string | null = null;
  private retryConfig: RetryConfig;

  constructor(baseUrl: string = API_BASE_URL, retryConfig?: Partial<RetryConfig>) {
    this.baseUrl = baseUrl;
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  }

  setTenantId(tenantId: string) {
    this.tenantId = tenantId;
  }

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getRetryDelay(attempt: number): number {
    const delay = Math.min(
      this.retryConfig.baseDelay * Math.pow(2, attempt) + Math.random() * 500,
      this.retryConfig.maxDelay
    );
    return delay;
  }

  private buildUrlCandidates(endpoint: string): string[] {
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    // In browser, same-origin relative endpoints prevent CORS preflight and network blockage
    if (typeof window !== 'undefined') {
      const candidates: string[] = [];
      if (!normalizedEndpoint.startsWith('/api')) {
        candidates.push(`/api${normalizedEndpoint}`, `/api/v1${normalizedEndpoint}`, normalizedEndpoint);
      } else {
        candidates.push(normalizedEndpoint);
      }
      return [...new Set(candidates)];
    }

    const base = (this.baseUrl || '').replace(/\/$/, '');
    const root = base.replace(/\/api(?:\/v1)?$/, '');
    const hasApiPrefix = /\/api(?:\/v1)?$/.test(base);

    const prefixes: string[] = [];
    if (base) {
      prefixes.push(base);
      if (!hasApiPrefix) {
        prefixes.push(`${base}/api`, `${base}/api/v1`);
      }
      if (root && root !== base) {
        prefixes.push(`${root}/api`, `${root}/api/v1`);
      }
    } else {
      prefixes.push('', '/api', '/api/v1');
    }

    return [...new Set(prefixes.map((candidate) => `${candidate}${normalizedEndpoint}`))];
  }

  public async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    let lastError: ApiError | Error | null = null;
    const urlCandidates = this.buildUrlCandidates(endpoint);

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      for (let i = 0; i < urlCandidates.length; i++) {
        const url = urlCandidates[i];
        const isLastCandidate = i === urlCandidates.length - 1;

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
              ...(this.tenantId ? { 'x-tenant-id': this.tenantId } : {}),
              ...(this.accessToken ? { 'Authorization': `Bearer ${this.accessToken}` } : {}),
              ...options.headers,
            },
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            let responseBody;
            try { responseBody = await response.json(); } catch { }

            const apiError = new ApiError(response.status, response.statusText, `${endpoint} (${url})`, responseBody);

            // Try next URL candidate on 404 path mismatches.
            if (apiError.isNotFound && !isLastCandidate) {
              continue;
            }

            // Don't retry auth errors.
            if (apiError.isAuthError) {
              emitApiError(apiError);
              throw apiError;
            }

            if (
              attempt < this.retryConfig.maxRetries &&
              this.retryConfig.retryableStatuses.includes(response.status)
            ) {
              lastError = apiError;
              break;
            }

            emitApiError(apiError);
            throw apiError;
          }

          return response.json();
        } catch (error: any) {
          if (error instanceof ApiError) throw error;

          if (error.name === 'AbortError') {
            lastError = new ApiError(0, 'Request timeout', `${endpoint} (${url})`);
          } else {
            lastError = new ApiError(0, error.message || 'Network error', `${endpoint} (${url})`);
          }

          // On network-level errors, try the next URL candidate first.
          if (!isLastCandidate) {
            continue;
          }
        }
      }

      if (attempt < this.retryConfig.maxRetries && lastError) {
        const delay = this.getRetryDelay(attempt);
        console.warn(`[API] Retry ${attempt + 1}/${this.retryConfig.maxRetries} for ${endpoint} after ${delay}ms`);
        await this.sleep(delay);
        continue;
      }
    }

    if (lastError instanceof ApiError) {
      emitApiError(lastError);
      throw lastError;
    }
    throw lastError || new Error(`API request failed: ${endpoint}`);
  }

  private addTenantParam(params: Record<string, string> = {}): string {
    const searchParams = new URLSearchParams(params);
    if (this.tenantId) {
      searchParams.set('tenantId', this.tenantId);
    }
    return searchParams.toString();
  }

  // Analytics Endpoints
  async getDashboardStats(tenantId: string, period: string = '30d') {
    this.setTenantId(tenantId);
    const params = this.addTenantParam({ period });
    return this.request(`/analytics/dashboard-stats?${params}`);
  }

  async getPlatformPerformance(tenantId: string) {
    this.setTenantId(tenantId);
    const params = this.addTenantParam();
    return this.request(`/analytics/platform-performance?${params}`);
  }

  async getRecentOrders(tenantId: string, limit: number = 10) {
    this.setTenantId(tenantId);
    const params = this.addTenantParam({ limit: limit.toString() });
    return this.request(`/analytics/recent-orders?${params}`);
  }

  async getStockAlerts(tenantId: string) {
    this.setTenantId(tenantId);
    const params = this.addTenantParam();
    return this.request(`/analytics/stock-alerts?${params}`);
  }

  async getTopProducts(tenantId: string, limit: number = 10) {
    this.setTenantId(tenantId);
    const params = this.addTenantParam({ limit: limit.toString() });
    return this.request(`/analytics/top-products?${params}`);
  }

  async getAiInsights(tenantId: string) {
    this.setTenantId(tenantId);
    const params = this.addTenantParam();
    return this.request(`/analytics/ai-insights?${params}`);
  }

  async getPerformanceTrend(tenantId: string, metric: string = 'revenue', period: string = '30d') {
    this.setTenantId(tenantId);
    const params = this.addTenantParam({ metric, period });
    return this.request(`/analytics/performance-trend?${params}`);
  }

  async getSalesForecast(tenantId: string, days: number = 30) {
    this.setTenantId(tenantId);
    const params = this.addTenantParam({ days: days.toString() });
    return this.request(`/analytics/sales-forecast?${params}`);
  }

  async getCategoryPerformance(tenantId: string) {
    this.setTenantId(tenantId);
    const params = this.addTenantParam();
    return this.request(`/analytics/category-performance?${params}`);
  }

  // AI Advisor Endpoints
  async chatWithAdvisor(tenantId: string, message: string, history: any[] = []) {
    this.setTenantId(tenantId);
    return this.request('/ai-advisor/chat', {
      method: 'POST',
      body: JSON.stringify({
        tenantId,
        message,
        history,
      }),
    });
  }

  async getRecommendations(tenantId: string) {
    this.setTenantId(tenantId);
    const params = this.addTenantParam();
    return this.request(`/ai-advisor/recommendations?${params}`);
  }

  async getPerformanceScores(tenantId: string) {
    this.setTenantId(tenantId);
    const params = this.addTenantParam();
    return this.request(`/ai-advisor/performance-scores?${params}`);
  }

  // Dashboard Extended Endpoints
  async getAiSummary(tenantId: string) {
    this.setTenantId(tenantId);
    const params = this.addTenantParam();
    return this.request(`/analytics/ai-summary?${params}`);
  }

  async getMarketplaceHealth(tenantId: string) {
    this.setTenantId(tenantId);
    const params = this.addTenantParam();
    return this.request(`/analytics/marketplace-health?${params}`);
  }

  async getGoals(tenantId: string) {
    this.setTenantId(tenantId);
    const params = this.addTenantParam();
    return this.request(`/analytics/goals?${params}`);
  }

  async getActivityFeed(tenantId: string, limit: number = 12) {
    this.setTenantId(tenantId);
    const params = this.addTenantParam({ limit: limit.toString() });
    return this.request(`/analytics/activity-feed?${params}`);
  }

  async optimizeProduct(tenantId: string, productId: string) {
    this.setTenantId(tenantId);
    return this.request('/ai-advisor/optimize-product', {
      method: 'POST',
      body: JSON.stringify({
        tenantId,
        productId,
      }),
    });
  }

  async bulkAnalyze() {
    const params = this.addTenantParam();
    return this.request(`/ai-advisor/bulk-analyze?${params}`);
  }

  async getOrderStats(tenantId?: string) {
    if (tenantId) this.setTenantId(tenantId);
    const params = this.addTenantParam();
    return this.request(`/orders/stats?${params}`);
  }

  // Return Endpoints
  async getReturns(params: Record<string, string> = {}) {
    const query = this.addTenantParam(params);
    return this.request(`/returns?${query}`);
  }

  async getReturnStats() {
    const params = this.addTenantParam();
    return this.request(`/returns/stats?${params}`);
  }

  // Product Endpoints
  async getProducts(page: number = 1, limit: number = 20) {
    const params = this.addTenantParam({ page: page.toString(), limit: limit.toString() });
    return this.request(`/products?${params}`);
  }

  async getProductStats() {
    const params = this.addTenantParam();
    return this.request(`/products/stats?${params}`);
  }

  async getProduct(id: string) {
    return this.request(`/products/${id}`);
  }

  async getInventory(params: Record<string, any> = {}) {
    const query = this.addTenantParam(params);
    return this.request(`/inventory?${query}`);
  }

  async getInventoryStats() {
    const params = this.addTenantParam();
    return this.request(`/inventory/stats?${params}`);
  }

  async updateProduct(id: string, data: any) {
    return this.request(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Marketplace Endpoints
  async syncMarketplace(platform: string) {
    return this.request(`/marketplace/sync/${platform}`, {
      method: 'POST',
      body: JSON.stringify({
        tenantId: this.tenantId,
      }),
    });
  }

  async getIntegrations() {
    const params = this.addTenantParam();
    return this.request(`/marketplace/integrations?${params}`);
  }

  // Market Intelligence Endpoints
  async getCompetitors() {
    const params = this.addTenantParam();
    return this.request(`/market-intelligence/competitors?${params}`);
  }

  async getMarketIntelForecast(productId: string) {
    const params = this.addTenantParam();
    return this.request(`/market-intelligence/forecast/${productId}?${params}`);
  }

  async calculateOptimalPrice(productId: string, competitorProductId: string, rules: any) {
    return this.request('/market-intelligence/calculate-optimal-price', {
      method: 'POST',
      body: JSON.stringify({
        productId,
        competitorProductId,
        rules,
      }),
    });
  }

  // AI Tools Endpoints
  async generateImage(prompt: string, size?: string) {
    return this.request('/ai/generate-image', {
      method: 'POST',
      body: JSON.stringify({ prompt, size }),
    });
  }

  async removeBg(imageUrl: string) {
    return this.request('/ai/remove-bg', {
      method: 'POST',
      body: JSON.stringify({ imageUrl }),
    });
  }

  async upscale(imageUrl: string) {
    return this.request('/ai/upscale', {
      method: 'POST',
      body: JSON.stringify({ imageUrl }),
    });
  }

  async optimizeContent(title: string, description: string, platform: string) {
    return this.request('/ai/optimize-content', {
      method: 'POST',
      body: JSON.stringify({ title, description, platform }),
    });
  }

  async syncContent(productId: string, platform: string, data: any) {
    return this.request('/ai/sync-content', {
      method: 'POST',
      body: JSON.stringify({ productId, platform, data }),
    });
  }

  // ==================== GELİŞMİŞ AI İÇERİK ====================

  async deepAnalyzeContent(data: {
    title: string;
    description?: string;
    platform?: string;
    productId?: string;
    keywords?: string[];
    category?: string;
  }) {
    return this.request('/ai/content/analyze', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async bulkAnalyzeContent(productIds: string[], platform: string) {
    return this.request('/ai/content/bulk-analyze', {
      method: 'POST',
      body: JSON.stringify({ productIds, platform }),
    });
  }

  async getContentHealth() {
    return this.request('/ai/content/health');
  }

  async getAnalysisHistory(productId: string) {
    return this.request(`/ai/content/analysis-history/${productId}`);
  }

  async deepOptimizeContent(data: {
    title: string;
    description?: string;
    platform: string;
    tone?: string;
    productId?: string;
    keywords?: string[];
    category?: string;
    templateId?: string;
  }) {
    return this.request('/ai/content/optimize', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async generateProductDescription(data: {
    productName: string;
    keywords?: string[];
    platform: string;
    tone: string;
    category?: string;
    features?: string[];
    templateId?: string;
  }) {
    return this.request('/ai/content/generate-description', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async applyContentOptimization(optimizationId: string, syncToPlatform?: boolean) {
    return this.request('/ai/content/apply', {
      method: 'POST',
      body: JSON.stringify({ optimizationId, syncToPlatform }),
    });
  }

  async bulkApplyOptimizations(optimizationIds: string[], syncToPlatform?: boolean) {
    return this.request('/ai/content/bulk-apply', {
      method: 'POST',
      body: JSON.stringify({ optimizationIds, syncToPlatform }),
    });
  }

  async getOptimizationHistory(productId?: string) {
    const params = productId ? `?productId=${productId}` : '';
    return this.request(`/ai/content/optimization-history${params}`);
  }

  async createBatchOptimization(data: {
    name: string;
    productIds: string[];
    platform: string;
    tone?: string;
    config?: {
      autoApply?: boolean;
      autoSync?: boolean;
      skipHighScore?: boolean;
      minScoreThreshold?: number;
    };
  }) {
    return this.request('/ai/content/batch', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async listBatchJobs() {
    return this.request('/ai/content/batch');
  }

  async getBatchJobStatus(jobId: string) {
    return this.request(`/ai/content/batch/${jobId}`);
  }

  async getContentTemplates() {
    return this.request('/ai/content/templates');
  }

  async createContentTemplate(data: {
    name: string;
    description?: string;
    platform?: string;
    category?: string;
    tone?: string;
    titleTemplate?: string;
    descriptionTemplate?: string;
    promptTemplate?: string;
    variables?: Record<string, string>;
  }) {
    return this.request('/ai/content/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateContentTemplate(id: string, data: any) {
    return this.request(`/ai/content/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteContentTemplate(id: string) {
    return this.request(`/ai/content/templates/${id}`, {
      method: 'DELETE',
    });
  }

  async getContentRules(platform?: string) {
    const params = platform ? `?platform=${platform}` : '';
    return this.request(`/ai/content/rules${params}`);
  }

  async createContentRule(data: {
    platform: string;
    ruleType: string;
    ruleName: string;
    ruleValue: Record<string, any>;
  }) {
    return this.request('/ai/content/rules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteContentRule(id: string) {
    return this.request(`/ai/content/rules/${id}`, {
      method: 'DELETE',
    });
  }

  // Customer Endpoints
  async getCustomers(params: Record<string, string> = {}) {
    const query = this.addTenantParam(params);
    return this.request(`/customers?${query}`);
  }

  async getCustomer(id: string) {
    const params = this.addTenantParam();
    return this.request(`/customers/${id}?${params}`);
  }

  async updateCustomer(id: string, data: any) {
    return this.request(`/customers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ ...data, tenantId: this.tenantId }),
    });
  }

  async getCustomerStats() {
    const params = this.addTenantParam();
    return this.request(`/customers/stats?${params}`);
  }

  async getCustomerSegments() {
    const params = this.addTenantParam();
    return this.request(`/customers/segments?${params}`);
  }

  async getRFMAnalysis() {
    const params = this.addTenantParam();
    return this.request(`/customers/segmentation/rfm?${params}`);
  }

  // Store/Integration Endpoints
  async getStores() {
    const params = this.addTenantParam();
    return this.request(`/marketplace/stores?${params}`);
  }

  async connectStore(
    platform: string,
    credentials: Record<string, unknown>,
    marketplaceId?: string,
  ) {
    return this.request('/marketplace/connect', {
      method: 'POST',
      body: JSON.stringify({
        tenantId: this.tenantId,
        platform,
        marketplaceId,
        credentials: {
          ...credentials,
          ...(marketplaceId ? { marketplaceId } : {}),
        },
      }),
    });
  }

  async disconnectStore(storeId: string) {
    return this.request(`/marketplace/disconnect/${storeId}`, {
      method: 'POST',
      body: JSON.stringify({ tenantId: this.tenantId }),
    });
  }

  async syncStore(storeId: string, syncType: string = 'all') {
    return this.request(`/marketplace/sync-store/${storeId}`, {
      method: 'POST',
      body: JSON.stringify({ tenantId: this.tenantId, syncType }),
    });
  }

  async getIntegrationSyncStatus(integrationId: string) {
    const params = this.addTenantParam();
    return this.request(`/marketplace/sync-status/${integrationId}?${params}`);
  }

  async syncAllProducts() {
    return this.request('/marketplace/sync-all', {
      method: 'POST',
      body: JSON.stringify({ tenantId: this.tenantId }),
    });
  }

  async syncPlatformOrders(platform: string) {
    return this.request(`/marketplace/sync-orders/${platform}`, {
      method: 'POST',
      body: JSON.stringify({ tenantId: this.tenantId }),
    });
  }

  async syncAllOrders() {
    return this.request('/marketplace/sync-all-orders', {
      method: 'POST',
      body: JSON.stringify({ tenantId: this.tenantId }),
    });
  }

  // Campaign Endpoints
  async getCampaigns(params: Record<string, string> = {}) {
    const query = this.addTenantParam(params);
    return this.request(`/analytics/campaigns?${query}`);
  }

  async createCampaign(data: any) {
    return this.request('/analytics/campaigns', {
      method: 'POST',
      body: JSON.stringify({ ...data, tenantId: this.tenantId }),
    });
  }

  async updateCampaign(id: string, data: any) {
    return this.request(`/analytics/campaigns/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteCampaign(id: string) {
    return this.request(`/analytics/campaigns/${id}`, { method: 'DELETE' });
  }

  // Review Endpoints
  async getReviews(params: Record<string, string | number> = {}) {
    const query = this.addTenantParam(params as Record<string, string>);
    return this.request(`/reviews?${query}`);
  }

  async getReviewStats() {
    const params = this.addTenantParam();
    return this.request(`/reviews/stats?${params}`);
  }

  async syncReviews() {
    return this.request('/reviews/sync', {
      method: 'POST',
      body: JSON.stringify({ tenantId: this.tenantId }),
    });
  }

  async syncReviewsPlatform(platform: string) {
    return this.request(`/reviews/sync/${platform}`, {
      method: 'POST',
      body: JSON.stringify({ tenantId: this.tenantId }),
    });
  }

  async replyToReview(reviewId: string, reply: string) {
    return this.request(`/reviews/${reviewId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ reply }),
    });
  }

  async updateReviewStatus(reviewId: string, status: string) {
    return this.request(`/reviews/${reviewId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async bulkUpdateReviewStatus(reviewIds: string[], status: string) {
    return this.request('/reviews/bulk-status', {
      method: 'POST',
      body: JSON.stringify({ reviewIds, status }),
    });
  }

  // Pricing Endpoints
  async getPricingAnalysis(params: Record<string, string> = {}) {
    const query = this.addTenantParam(params);
    return this.request(`/market-intelligence/pricing-analysis?${query}`);
  }

  async getCompetitorPrices(productId: string) {
    const params = this.addTenantParam();
    return this.request(`/market-intelligence/competitor-prices/${productId}?${params}`);
  }

  async applyPriceRecommendation(productId: string, newPrice: number) {
    return this.request('/market-intelligence/apply-price', {
      method: 'POST',
      body: JSON.stringify({ productId, newPrice, tenantId: this.tenantId }),
    });
  }

  // Competitor Gap & Alerts
  async getCompetitorGap(productId: string) {
    const params = this.addTenantParam();
    return this.request(`/market-intelligence/competitor-gap/${productId}?${params}`);
  }

  async getCompetitorRecommendations(productId: string) {
    const params = this.addTenantParam();
    return this.request(`/market-intelligence/competitor-recommendations/${productId}?${params}`);
  }

  async getCompetitorAlerts(threshold: number = 5) {
    const params = this.addTenantParam({ priceGapPercent: String(threshold) });
    return this.request(`/market-intelligence/competitor-alerts?${params}`);
  }

  async runCompetitorSnapshot(platform?: string, limitPerStore?: number) {
    return this.request('/market-intelligence/snapshot', {
      method: 'POST',
      body: JSON.stringify({ tenantId: this.tenantId, platform, limitPerStore }),
    });
  }

  async generateCompetitorReport(days: number = 7) {
    return this.request('/market-intelligence/competitor-summary-report', {
      method: 'POST',
      body: JSON.stringify({ tenantId: this.tenantId, days }),
    });
  }

  // Pricing Rules
  async getPricingRules() {
    const params = this.addTenantParam();
    return this.request(`/market-intelligence/pricing-rules?${params}`);
  }

  async createPricingRule(data: Record<string, unknown>) {
    return this.request('/market-intelligence/pricing-rules', {
      method: 'POST',
      body: JSON.stringify({ ...data, tenantId: this.tenantId }),
    });
  }

  async deletePricingRule(ruleId: string) {
    const params = this.addTenantParam();
    return this.request(`/market-intelligence/pricing-rules/${ruleId}?${params}`, { method: 'DELETE' });
  }

  async bulkReprice(productIds?: string[]) {
    return this.request('/market-intelligence/bulk-reprice', {
      method: 'POST',
      body: JSON.stringify({ tenantId: this.tenantId, productIds }),
    });
  }

  // A/B Experiments
  async createExperiment(data: Record<string, unknown>) {
    return this.request('/market-intelligence/experiments', {
      method: 'POST',
      body: JSON.stringify({ ...data, tenantId: this.tenantId }),
    });
  }

  async getExperiments() {
    const params = this.addTenantParam();
    return this.request(`/market-intelligence/experiments?${params}`);
  }

  async evaluateExperiment(experimentId: string) {
    return this.request(`/market-intelligence/experiments/${experimentId}/evaluate`, {
      method: 'POST',
      body: JSON.stringify({ tenantId: this.tenantId }),
    });
  }

  async stopExperiment(experimentId: string) {
    return this.request(`/market-intelligence/experiments/${experimentId}/stop`, {
      method: 'POST',
      body: JSON.stringify({ tenantId: this.tenantId }),
    });
  }

  // Auto-Discovery
  async autoDiscoverCompetitors(platform?: string) {
    return this.request('/market-intelligence/auto-discover', {
      method: 'POST',
      body: JSON.stringify({ tenantId: this.tenantId, platform }),
    });
  }

  // Competitor Delete
  async deleteCompetitor(competitorId: string) {
    const params = this.addTenantParam();
    return this.request(`/market-intelligence/competitors/${competitorId}?${params}`, { method: 'DELETE' });
  }

  async deleteCompetitorProduct(competitorProductId: string) {
    const params = this.addTenantParam();
    return this.request(`/market-intelligence/competitor-products/${competitorProductId}?${params}`, { method: 'DELETE' });
  }

  // Shipping Endpoints
  async getShipments(params: Record<string, string> = {}) {
    const query = this.addTenantParam(params);
    return this.request(`/orders/shipments?${query}`);
  }

  async getShippingProviders() {
    const params = this.addTenantParam();
    return this.request(`/orders/shipping-providers?${params}`);
  }

  async trackShipment(trackingNumber: string) {
    return this.request(`/orders/track/${trackingNumber}`);
  }

  async calculateShipping(data: any) {
    return this.request('/orders/calculate-shipping', {
      method: 'POST',
      body: JSON.stringify({ ...data, tenantId: this.tenantId }),
    });
  }

  // Reports Endpoints
  async getReports(params: Record<string, string> = {}) {
    const query = this.addTenantParam(params);
    return this.request(`/reports?${query}`);
  }

  async generateReport(type: string, params: any) {
    return this.request('/reports/generate', {
      method: 'POST',
      body: JSON.stringify({ type, ...params, tenantId: this.tenantId }),
    });
  }

  async getScheduledReports() {
    const params = this.addTenantParam();
    return this.request(`/reports/scheduled?${params}`);
  }

  // Payments Endpoints
  async getPayments(params: Record<string, string> = {}) {
    const query = this.addTenantParam(params);
    return this.request(`/finance/payments?${query}`);
  }

  async getPaymentStats() {
    const params = this.addTenantParam();
    return this.request(`/finance/payment-stats?${params}`);
  }

  async getPendingPayments() {
    const params = this.addTenantParam();
    return this.request(`/finance/pending-payments?${params}`);
  }

  // Security Endpoints
  async getSecurityOverview() {
    const params = this.addTenantParam();
    return this.request(`/system/security-overview?${params}`);
  }

  async getLoginHistory() {
    const params = this.addTenantParam();
    return this.request(`/system/login-history?${params}`);
  }

  async getActiveSessions() {
    const params = this.addTenantParam();
    return this.request(`/system/active-sessions?${params}`);
  }

  async getApiKeys() {
    const params = this.addTenantParam();
    return this.request(`/system/api-keys?${params}`);
  }

  async createApiKey(name: string, permissions: string[]) {
    return this.request('/system/api-keys', {
      method: 'POST',
      body: JSON.stringify({ name, permissions, tenantId: this.tenantId }),
    });
  }

  async revokeApiKey(keyId: string) {
    return this.request(`/system/api-keys/${keyId}`, { method: 'DELETE' });
  }

  async revokeSession(sessionId: string) {
    return this.request(`/system/sessions/${sessionId}`, { method: 'DELETE' });
  }

  async toggle2FA(enabled: boolean) {
    return this.request('/system/2fa', {
      method: 'POST',
      body: JSON.stringify({ enabled, tenantId: this.tenantId }),
    });
  }

  // Automation Endpoints
  async getAutomations(params: Record<string, string> = {}) {
    const query = this.addTenantParam(params);
    return this.request(`/system/automations?${query}`);
  }

  async createAutomation(data: any) {
    return this.request('/system/automations', {
      method: 'POST',
      body: JSON.stringify({ ...data, tenantId: this.tenantId }),
    });
  }

  async updateAutomation(id: string, data: any) {
    return this.request(`/system/automations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async toggleAutomation(id: string, isActive: boolean) {
    return this.request(`/system/automations/${id}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ isActive }),
    });
  }

  async deleteAutomation(id: string) {
    return this.request(`/system/automations/${id}`, { method: 'DELETE' });
  }

  async getAutomationHistory(id: string) {
    return this.request(`/system/automations/${id}/history`);
  }

  // Bulk Actions Endpoints
  async executeBulkAction(action: string, productIds: string[], data: any) {
    return this.request('/products/bulk-action', {
      method: 'POST',
      body: JSON.stringify({ action, productIds, ...data, tenantId: this.tenantId }),
    });
  }

  async getBulkActionHistory() {
    const params = this.addTenantParam();
    return this.request(`/products/bulk-action-history?${params}`);
  }

  async rollbackBulkAction(bulkActionId: string) {
    return this.request(`/products/bulk-action/${bulkActionId}/rollback`, {
      method: 'POST',
      body: JSON.stringify({ tenantId: this.tenantId }),
    });
  }

  // SEO Endpoints
  async getSeoAnalysis(params: Record<string, string> = {}) {
    const query = this.addTenantParam(params);
    return this.request(`/analytics/seo-analysis?${query}`);
  }

  async optimizeSeo(productId: string) {
    return this.request('/ai/optimize-seo', {
      method: 'POST',
      body: JSON.stringify({ productId, tenantId: this.tenantId }),
    });
  }

  // Activity Endpoints
  async getActivityLog(params: Record<string, string> = {}) {
    const query = this.addTenantParam(params);
    return this.request(`/audit/activity-log?${query}`);
  }

  // Webhook Endpoints
  async getWebhooks() {
    const params = this.addTenantParam();
    return this.request(`/webhooks?${params}`);
  }

  async createWebhook(data: any) {
    return this.request('/webhooks', {
      method: 'POST',
      body: JSON.stringify({ ...data, tenantId: this.tenantId }),
    });
  }

  async updateWebhook(id: string, data: any) {
    return this.request(`/webhooks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteWebhook(id: string) {
    return this.request(`/webhooks/${id}`, { method: 'DELETE' });
  }

  async testWebhook(id: string) {
    return this.request(`/webhooks/${id}/test`, { method: 'POST' });
  }

  // Predictions Endpoints
  async getPredictions(params: Record<string, string> = {}) {
    const query = this.addTenantParam(params);
    return this.request(`/analytics/predictions?${query}`);
  }

  async getProductPrediction(productId: string) {
    return this.request(`/market-intelligence/forecast/${productId}`);
  }

  // Notifications Endpoint
  async getNotifications(params: Record<string, string> = {}) {
    const query = this.addTenantParam(params);
    return this.request(`/system/notifications?${query}`);
  }

  async markNotificationRead(id: string) {
    return this.request(`/system/notifications/${id}/read`, { method: 'POST' });
  }

  // Dashboard Layout
  async saveDashboardLayout(layout: any) {
    return this.request('/system/dashboard-layout', {
      method: 'POST',
      body: JSON.stringify({ layout, tenantId: this.tenantId }),
    });
  }

  async getDashboardLayout() {
    const params = this.addTenantParam();
    return this.request(`/system/dashboard-layout?${params}`);
  }

  // WhatsApp Endpoints
  async getWhatsAppData(tenantId: string) {
    this.setTenantId(tenantId);
    const params = this.addTenantParam();
    const [stats, messages, templates] = await Promise.all([
      this.request(`/whatsapp/stats?${params}`),
      this.request(`/whatsapp/messages?${params}`),
      this.request(`/whatsapp/templates?${params}`)
    ]);
    return { stats, messages, templates };
  }

  // Tasks Endpoints
  async getTasks(tenantId: string) {
    this.setTenantId(tenantId);
    const params = this.addTenantParam();
    return this.request(`/tasks?${params}`);
  }

  // Suppliers Endpoints
  async getSuppliers(tenantId: string) {
    this.setTenantId(tenantId);
    const params = this.addTenantParam();
    return this.request(`/suppliers?${params}`);
  }

  // Export endpoints
  async exportData(type: string, format: string = 'csv', params: Record<string, string> = {}) {
    const query = this.addTenantParam({ ...params, format });
    return this.request(`/reports/export/${type}?${query}`);
  }

  // System Performance
  async getSystemPerformance() {
    const params = this.addTenantParam();
    return this.request(`/system/performance?${params}`);
  }

  // Profitability
  async getProfitabilityData() {
    const params = this.addTenantParam();
    return this.request(`/analytics/profitability?${params}`);
  }

  // AB Testing
  async getAbTestingData() {
    const params = this.addTenantParam();
    return this.request(`/analytics/ab-testing?${params}`);
  }

  // Live Chat
  async getLiveChatData() {
    const params = this.addTenantParam();
    return this.request(`/system/live-chat?${params}`);
  }
}

export const apiClient = new ApiClient();
export default apiClient;
