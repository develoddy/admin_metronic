/**
 * Analytics Models & Interfaces
 * Sprint 6F - Frontend Integration
 * @version 1.0.0
 */

/**
 * Metric Types
 */
export type MetricType = 'daily' | 'weekly' | 'monthly' | 'yearly';

/**
 * Export Formats
 */
export type ExportFormat = 'csv' | 'excel';

/**
 * Analytics Cache Model
 */
export interface AnalyticsCache {
  id: number;
  metricType: MetricType;
  date: string;
  revenue: number;
  costs: number;
  profit: number;
  margin: number;
  orderCount: number;
  syncedCount: number;
  pendingCount: number;
  shippedCount: number;
  deliveredCount: number;
  failedCount: number;
  successRate: number;
  avgFulfillmentTime: number;
  avgOrderValue: number;
  productCosts?: Record<string, number>;
  customerStats?: any;
  paymentMethods?: Record<string, number>;
  topProducts?: TopProduct[];
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Product Analytics Model
 */
export interface ProductAnalytics {
  id: number;
  productId: number;
  date: string;
  unitsSold: number;
  revenue: number;
  printfulCost: number;
  profit: number;
  margin: number;
  orderCount: number;
  failedCount?: number;
  avgPrice: number;
  topVariants?: any[];
  customerSegment?: any;
  metadata?: Record<string, any>;
  product?: ProductInfo;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Product Info (from backend)
 */
export interface ProductInfo {
  id: number;
  titulo: string;
  slug: string;
  imagen: string;
  categoria?: string;
}

/**
 * Top Product
 */
export interface TopProduct {
  productId: number;
  title: string;
  units: number;
  revenue: number;
}

/**
 * Formatted Metric (from backend formatMetric function)
 */
export interface FormattedMetric {
  date: string;
  revenue: number;
  costs: number;
  profit: number;
  margin: number;
  orders: number; // Mapped from orderCount
  successRate: number;
  avgOrderValue: number;
  avgFulfillmentTime: number;
}

/**
 * Dashboard Summary
 */
export interface DashboardSummary {
  current: {
    daily: FormattedMetric | null;
    weekly: FormattedMetric | null;
    monthly: FormattedMetric | null;
  };
  trends: {
    revenue: number;
    profit: number;
    orders: number;
    successRate: number;
  };
  topProducts: TopProduct[];
  lastUpdated: string;
}

/**
 * Metrics Response
 */
export interface MetricsResponse {
  success: boolean;
  data: AnalyticsCache[];
  count: number;
}

/**
 * Single Metric Response
 */
export interface SingleMetricResponse {
  success: boolean;
  data: AnalyticsCache;
}

/**
 * Dashboard Response
 */
export interface DashboardResponse {
  success: boolean;
  data: DashboardSummary;
}

/**
 * Product Analytics Response
 */
export interface ProductAnalyticsResponse {
  success: boolean;
  data: ProductAnalytics[];
  count: number;
}

/**
 * Top Products Response
 */
export interface TopProductsResponse {
  success: boolean;
  data: TopProductWithDetails[];
  count: number;
}

export interface TopProductWithDetails {
  productId: number;
  product: ProductInfo;
  totalUnits: number;
  totalRevenue: number;
  totalProfit: number;
  avgMargin: number;
}

/**
 * Costs Data
 */
export interface CostsData {
  totalCosts: number;
  totalShipping: number;
  totalTax: number;
  orderCosts: Record<string, OrderCost>;
  productCosts: Record<string, number>;
  ordersProcessed: number;
  webhooksAnalyzed: number;
}

export interface OrderCost {
  cost: number;
  shipping: number;
  tax: number;
  currency: string;
  items: OrderItem[];
  receivedAt: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

/**
 * Costs Response
 */
export interface CostsResponse {
  success: boolean;
  data: CostsData;
}

/**
 * Sale Costs
 */
export interface SaleCosts {
  saleId: number;
  revenue: number;
  printfulCost: number;
  shippingCost: number;
  tax: number;
  totalCost: number;
  profit: number;
  margin: number;
  currency: string;
  itemCount: number;
}

/**
 * Product Cost Average
 */
export interface ProductCostAverage {
  productId: number;
  avgCost: number;
  minCost: number;
  maxCost: number;
  totalOrders: number;
  totalQuantity: number;
  daysAnalyzed: number;
}

/**
 * Comparison Data
 */
export interface MetricsComparison {
  current: AggregatedMetrics;
  previous: AggregatedMetrics;
  changes: {
    revenue: number;
    profit: number;
    orders: number;
    successRate: number;
    avgOrderValue: number;
  };
}

export interface AggregatedMetrics {
  revenue: number;
  costs: number;
  profit: number;
  margin: number;
  orderCount: number;
  successRate: number;
  avgOrderValue: number;
}

/**
 * Calculate Request
 */
export interface CalculateRequest {
  type: MetricType;
  date?: string;
}

/**
 * Recalculate Request
 */
export interface RecalculateRequest {
  startDate: string;
  endDate: string;
}

/**
 * Compare Request
 */
export interface CompareRequest {
  type: MetricType;
  currentStart: string;
  currentEnd: string;
  previousStart: string;
  previousEnd: string;
}

/**
 * Export Request
 */
export interface ExportRequest {
  type?: MetricType;
  startDate: string;
  endDate: string;
  format?: ExportFormat;
  limit?: number;
}

/**
 * Failed Order (Retry Queue)
 */
export interface FailedOrder {
  id: number;
  saleId: number;
  errorType: string;
  errorCode: string;
  errorMessage: string;
  status: string;
  attemptCount: number;
  maxAttempts: number;
  nextRetryAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Failed Orders Response
 */
export interface FailedOrdersResponse {
  success: boolean;
  data: FailedOrder[];
  count: number;
}

/**
 * Retry Stats
 */
export interface RetryStats {
  byStatus: Record<string, number>;
  byErrorType: Record<string, number>;
  total: number;
}

/**
 * Executive Report
 */
export interface ExecutiveReport {
  success: boolean;
  data: {
    period: {
      startDate: string;
      endDate: string;
    };
    metrics: any;
    products: any;
    costs: any;
    fulfillment: any;
    generatedAt: string;
  };
}

/**
 * API Response (generic)
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

/**
 * Date Range Filter
 */
export interface DateRangeFilter {
  startDate: Date | string;
  endDate: Date | string;
}

/**
 * Chart Data Point
 */
export interface ChartDataPoint {
  x: string | number;
  y: number;
}

/**
 * KPI Card Data
 */
export interface KPICard {
  title: string;
  value: number | string;
  suffix?: string;
  prefix?: string;
  trend?: number;
  subtitle?: string;
  icon?: string;
  iconColor?: string;
  color?: string;
  loading?: boolean;
}
