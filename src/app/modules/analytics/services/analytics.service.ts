import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { finalize, map, catchError } from 'rxjs/operators';
import { AuthService } from '../../auth';
import { URL_SERVICIOS } from 'src/app/config/config';
import {
  DashboardResponse,
  MetricsResponse,
  SingleMetricResponse,
  ProductAnalyticsResponse,
  TopProductsResponse,
  CostsResponse,
  ApiResponse,
  CalculateRequest,
  RecalculateRequest,
  CompareRequest,
  ExportRequest,
  FailedOrdersResponse,
  RetryStats,
  ExecutiveReport,
  MetricType,
  SaleCosts,
  ProductCostAverage,
  MetricsComparison
} from '../models/analytics.models';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {

  isLoading$: Observable<boolean>;
  isLoadingSubject: BehaviorSubject<boolean>;

  private API_URL = `${URL_SERVICIOS}/analytics`;

  constructor(
    private http: HttpClient,
    public authService: AuthService
  ) {
    this.isLoadingSubject = new BehaviorSubject<boolean>(false);
    this.isLoading$ = this.isLoadingSubject.asObservable();
  }

  /**
   * Get HTTP headers with auth token
   */
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({ 'token': this.authService.token });
  }

  /**
   * Handle HTTP errors
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      return of(result as T);
    };
  }

  /**
   * DASHBOARD & SUMMARY
   */

  /**
   * Get dashboard summary
   */
  getDashboard(): Observable<DashboardResponse> {
    this.isLoadingSubject.next(true);
    const url = `${this.API_URL}/dashboard`;
    return this.http.get<DashboardResponse>(url, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false)),
      catchError(this.handleError<DashboardResponse>('getDashboard', { success: false, data: null as any }))
    );
  }

  /**
   * Get latest metric by type
   */
  getLatestMetric(type: MetricType): Observable<SingleMetricResponse> {
    this.isLoadingSubject.next(true);
    const url = `${this.API_URL}/latest/${type}`;
    return this.http.get<SingleMetricResponse>(url, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false)),
      catchError(this.handleError<SingleMetricResponse>('getLatestMetric'))
    );
  }

  /**
   * METRICS
   */

  /**
   * Get metrics by type and date range
   */
  getMetrics(type: MetricType, startDate?: string, endDate?: string): Observable<MetricsResponse> {
    this.isLoadingSubject.next(true);
    let url = `${this.API_URL}/metrics?type=${type}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;

    return this.http.get<MetricsResponse>(url, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false)),
      catchError(this.handleError<MetricsResponse>('getMetrics', { success: false, data: [], count: 0 }))
    );
  }

  /**
   * Calculate metrics manually
   */
  calculateMetrics(request: CalculateRequest): Observable<ApiResponse> {
    this.isLoadingSubject.next(true);
    const url = `${this.API_URL}/calculate`;
    return this.http.post<ApiResponse>(url, request, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false)),
      catchError(this.handleError<ApiResponse>('calculateMetrics'))
    );
  }

  /**
   * Recalculate metrics for date range
   */
  recalculateMetrics(request: RecalculateRequest): Observable<ApiResponse> {
    this.isLoadingSubject.next(true);
    const url = `${this.API_URL}/recalculate`;
    return this.http.post<ApiResponse>(url, request, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false)),
      catchError(this.handleError<ApiResponse>('recalculateMetrics'))
    );
  }

  /**
   * Compare metrics between two periods
   */
  compareMetrics(request: CompareRequest): Observable<ApiResponse<MetricsComparison>> {
    this.isLoadingSubject.next(true);
    const url = `${this.API_URL}/compare`;
    return this.http.post<ApiResponse<MetricsComparison>>(url, request, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false)),
      catchError(this.handleError<ApiResponse<MetricsComparison>>('compareMetrics'))
    );
  }

  /**
   * PRODUCTS
   */

  /**
   * Get product analytics
   */
  getProductAnalytics(productId?: number, startDate?: string, endDate?: string, limit?: number): Observable<ProductAnalyticsResponse> {
    this.isLoadingSubject.next(true);
    let url = `${this.API_URL}/products?`;
    if (productId) url += `productId=${productId}&`;
    if (startDate) url += `startDate=${startDate}&`;
    if (endDate) url += `endDate=${endDate}&`;
    if (limit) url += `limit=${limit}`;

    return this.http.get<ProductAnalyticsResponse>(url, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false)),
      catchError(this.handleError<ProductAnalyticsResponse>('getProductAnalytics', { success: false, data: [], count: 0 }))
    );
  }

  /**
   * Get top products by revenue
   */
  getTopProducts(startDate: string, endDate: string, limit: number = 10): Observable<TopProductsResponse> {
    this.isLoadingSubject.next(true);
    const url = `${this.API_URL}/top-products?startDate=${startDate}&endDate=${endDate}&limit=${limit}`;
    return this.http.get<TopProductsResponse>(url, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false)),
      catchError(this.handleError<TopProductsResponse>('getTopProducts', { success: false, data: [], count: 0 }))
    );
  }

  /**
   * Get product average cost
   */
  getProductCost(productId: number, days: number = 30): Observable<ApiResponse<ProductCostAverage>> {
    this.isLoadingSubject.next(true);
    const url = `${this.API_URL}/product-cost/${productId}?days=${days}`;
    return this.http.get<ApiResponse<ProductCostAverage>>(url, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false)),
      catchError(this.handleError<ApiResponse<ProductCostAverage>>('getProductCost'))
    );
  }

  /**
   * COSTS
   */

  /**
   * Get costs for date range
   */
  getCosts(startDate: string, endDate: string): Observable<CostsResponse> {
    this.isLoadingSubject.next(true);
    const url = `${this.API_URL}/costs?startDate=${startDate}&endDate=${endDate}`;
    return this.http.get<CostsResponse>(url, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false)),
      catchError(this.handleError<CostsResponse>('getCosts'))
    );
  }

  /**
   * Get sale costs
   */
  getSaleCosts(saleId: number): Observable<ApiResponse<SaleCosts>> {
    this.isLoadingSubject.next(true);
    const url = `${this.API_URL}/sale-costs/${saleId}`;
    return this.http.get<ApiResponse<SaleCosts>>(url, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false)),
      catchError(this.handleError<ApiResponse<SaleCosts>>('getSaleCosts'))
    );
  }

  /**
   * Sync missing costs from Printful
   */
  syncCosts(limit: number = 50): Observable<ApiResponse> {
    this.isLoadingSubject.next(true);
    const url = `${this.API_URL}/sync-costs`;
    return this.http.post<ApiResponse>(url, { limit }, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false)),
      catchError(this.handleError<ApiResponse>('syncCosts'))
    );
  }

  /**
   * CACHE MANAGEMENT
   */

  /**
   * Invalidate cache
   */
  invalidateCache(type?: MetricType, startDate?: string, endDate?: string): Observable<ApiResponse> {
    this.isLoadingSubject.next(true);
    let url = `${this.API_URL}/cache?`;
    if (type) url += `type=${type}&`;
    if (startDate) url += `startDate=${startDate}&`;
    if (endDate) url += `endDate=${endDate}`;

    return this.http.delete<ApiResponse>(url, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false)),
      catchError(this.handleError<ApiResponse>('invalidateCache'))
    );
  }

  /**
   * Clean old cache
   */
  cleanCache(daysToKeep: number = 90): Observable<ApiResponse> {
    this.isLoadingSubject.next(true);
    const url = `${this.API_URL}/clean-cache`;
    return this.http.post<ApiResponse>(url, { daysToKeep }, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false)),
      catchError(this.handleError<ApiResponse>('cleanCache'))
    );
  }

  /**
   * EXPORTS & REPORTS
   */

  /**
   * Export metrics to CSV/Excel
   */
  exportMetrics(request: ExportRequest): Observable<Blob> {
    this.isLoadingSubject.next(true);
    const url = `${this.API_URL}/export/metrics`;
    return this.http.post(url, request, {
      headers: this.getHeaders(),
      responseType: 'blob'
    }).pipe(
      finalize(() => this.isLoadingSubject.next(false)),
      catchError(() => of(new Blob()))
    );
  }

  /**
   * Export products to CSV/Excel
   */
  exportProducts(request: ExportRequest): Observable<Blob> {
    this.isLoadingSubject.next(true);
    const url = `${this.API_URL}/export/products`;
    return this.http.post(url, request, {
      headers: this.getHeaders(),
      responseType: 'blob'
    }).pipe(
      finalize(() => this.isLoadingSubject.next(false)),
      catchError(() => of(new Blob()))
    );
  }

  /**
   * Export costs report
   */
  exportCosts(startDate: string, endDate: string): Observable<Blob> {
    this.isLoadingSubject.next(true);
    const url = `${this.API_URL}/export/costs`;
    return this.http.post(url, { startDate, endDate }, {
      headers: this.getHeaders(),
      responseType: 'blob'
    }).pipe(
      finalize(() => this.isLoadingSubject.next(false)),
      catchError(() => of(new Blob()))
    );
  }

  /**
   * Export fulfillment report
   */
  exportFulfillment(request: ExportRequest): Observable<Blob> {
    this.isLoadingSubject.next(true);
    const url = `${this.API_URL}/export/fulfillment`;
    return this.http.post(url, request, {
      headers: this.getHeaders(),
      responseType: 'blob'
    }).pipe(
      finalize(() => this.isLoadingSubject.next(false)),
      catchError(() => of(new Blob()))
    );
  }

  /**
   * Export failed orders report
   */
  exportFailures(errorType?: string, status?: string, limit?: number): Observable<Blob> {
    this.isLoadingSubject.next(true);
    const url = `${this.API_URL}/export/failures`;
    return this.http.post(url, { errorType, status, limit }, {
      headers: this.getHeaders(),
      responseType: 'blob'
    }).pipe(
      finalize(() => this.isLoadingSubject.next(false)),
      catchError(() => of(new Blob()))
    );
  }

  /**
   * Get executive report
   */
  getExecutiveReport(startDate: string, endDate: string): Observable<ExecutiveReport> {
    this.isLoadingSubject.next(true);
    const url = `${this.API_URL}/reports/executive`;
    return this.http.post<ExecutiveReport>(url, { startDate, endDate }, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false)),
      catchError(this.handleError<ExecutiveReport>('getExecutiveReport'))
    );
  }

  /**
   * Clean old export files
   */
  cleanExports(days: number = 7): Observable<ApiResponse> {
    this.isLoadingSubject.next(true);
    const url = `${this.API_URL}/export/clean`;
    return this.http.post<ApiResponse>(url, { days }, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false)),
      catchError(this.handleError<ApiResponse>('cleanExports'))
    );
  }

  /**
   * UTILITY METHODS
   */

  /**
   * Download blob as file
   */
  downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Format currency
   */
  formatCurrency(value: number, currency: string = '€'): string {
    return `${currency}${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  }

  /**
   * Format percentage
   */
  formatPercentage(value: number): string {
    return `${value.toFixed(2)}%`;
  }

  /**
   * Calculate trend
   */
  calculateTrend(current: number, previous: number): number {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }
}
