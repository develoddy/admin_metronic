import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/modules/auth';

interface FinancialStats {
  totalOrders: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  averageMargin: number;
  byStatus: {
    draft: number;
    pending: number;
    fulfilled: number;
    canceled: number;
    failed: number;
  };
  totalShippingRevenue: number;
  totalShippingCost: number;
  totalProductRevenue: number;
  totalProductCost: number;
}

interface ProductRanking {
  variant_id: number;
  name: string;
  image: string;
  totalOrders: number;
  totalQuantity: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  averageMargin: string;
}

interface TimelineData {
  date: string;
  revenue: number;
  cost: number;
  profit: number;
  orders: number;
}

interface FinancialStatsResponse {
  success: boolean;
  stats: FinancialStats;
}

interface ProductsRankingResponse {
  success: boolean;
  ranking: ProductRanking[];
}

interface TimelineResponse {
  success: boolean;
  timeline: TimelineData[];
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsPrintfulService {
  private apiUrl = `${environment.URL_SERVICIOS}/printful/analytics`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'token': this.authService.token
    });
  }

  /**
   * Obtiene estadísticas financieras
   */
  getFinancialStats(startDate?: string, endDate?: string, status?: string): Observable<FinancialStatsResponse> {
    let params = new HttpParams();
    
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    if (status) params = params.set('status', status);

    return this.http.get<FinancialStatsResponse>(`${this.apiUrl}/financial`, {
      headers: this.getHeaders(),
      params: params
    });
  }

  /**
   * Obtiene ranking de productos por rentabilidad
   */
  getProductsRanking(limit: number = 10, sortBy: 'profit' | 'margin' | 'revenue' | 'quantity' = 'profit'): Observable<ProductsRankingResponse> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('sortBy', sortBy);

    return this.http.get<ProductsRankingResponse>(`${this.apiUrl}/products`, {
      headers: this.getHeaders(),
      params: params
    });
  }

  /**
   * Obtiene datos de timeline (ingresos y costes por día)
   */
  getTimeline(days: number = 30): Observable<TimelineResponse> {
    const params = new HttpParams().set('days', days.toString());

    return this.http.get<TimelineResponse>(`${this.apiUrl}/timeline`, {
      headers: this.getHeaders(),
      params: params
    });
  }
}
