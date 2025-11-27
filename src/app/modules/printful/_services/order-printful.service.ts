import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from '../../auth';

interface OrdersResponse {
  success: boolean;
  orders: any[];
  paging: {
    total: number;
    offset: number;
    limit: number;
  };
}

interface OrderResponse {
  success: boolean;
  order: any;
}

interface ShipmentsResponse {
  success: boolean;
  shipments: any[];
}

interface EstimateResponse {
  success: boolean;
  costs: any;
}

@Injectable({
  providedIn: 'root'
})
export class OrderPrintfulService {
  private apiUrl = `${environment.URL_SERVICIOS}/printful`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Get all orders with optional filters
   */
  getOrders(status?: string, limit: number = 100, offset: number = 0): Observable<OrdersResponse> {
    console.log('📦 OrderPrintfulService: Obteniendo órdenes', { status, limit, offset });

    const headers = new HttpHeaders({ 'token': this.authService.token });

    let params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<OrdersResponse>(`${this.apiUrl}/orders`, { 
      params,
      headers
    });
  }

  /**
   * Get order by ID
   */
  getOrderById(id: number): Observable<OrderResponse> {
    console.log(`📦 OrderPrintfulService: Obteniendo orden ${id}`);
    
    const headers = new HttpHeaders({ 'token': this.authService.token });
    
    return this.http.get<OrderResponse>(`${this.apiUrl}/orders/${id}`, { headers });
  }

  /**
   * Sync order status from Printful
   */
  syncOrderStatus(id: number): Observable<OrderResponse> {
    console.log(`🔄 OrderPrintfulService: Sincronizando estado de orden ${id}`);
    
    const headers = new HttpHeaders({ 'token': this.authService.token });
    
    return this.http.get<OrderResponse>(`${this.apiUrl}/orders/${id}/sync`, { headers });
  }

  /**
   * Cancel order
   */
  cancelOrder(id: number): Observable<OrderResponse> {
    console.log(`❌ OrderPrintfulService: Cancelando orden ${id}`);
    
    const headers = new HttpHeaders({ 'token': this.authService.token });
    
    return this.http.delete<OrderResponse>(`${this.apiUrl}/orders/${id}`, { headers });
  }

  /**
   * Retry failed order
   */
  retryOrder(id: number): Observable<OrderResponse> {
    console.log(`🔄 OrderPrintfulService: Reintentando orden ${id}`);
    
    const headers = new HttpHeaders({ 'token': this.authService.token });
    
    return this.http.post<OrderResponse>(`${this.apiUrl}/orders/${id}/retry`, {}, { headers });
  }

  /**
   * Get order shipments
   */
  getOrderShipments(id: number): Observable<ShipmentsResponse> {
    console.log(`📦 OrderPrintfulService: Obteniendo envíos de orden ${id}`);
    
    const headers = new HttpHeaders({ 'token': this.authService.token });
    
    return this.http.get<ShipmentsResponse>(`${this.apiUrl}/orders/${id}/shipments`, { headers });
  }

  /**
   * Estimate order costs before creating
   */
  estimateOrderCosts(orderData: any): Observable<EstimateResponse> {
    console.log('💰 OrderPrintfulService: Estimando costos de orden');
    
    const headers = new HttpHeaders({ 'token': this.authService.token });
    
    return this.http.post<EstimateResponse>(`${this.apiUrl}/orders/estimate-costs`, orderData, { headers });
  }
}
