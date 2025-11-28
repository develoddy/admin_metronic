import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../../auth';
import { URL_SERVICIOS } from 'src/app/config/config';

// Interfaces
export interface StockStats {
  totalSynced: number;
  active: number;
  discontinued: number;
  outOfStock: number;
  lastSync: string;
}

export interface DiscontinuedProduct {
  id: number;
  title: string;
  idProduct: string;
  portada: string;
  updatedAt: string;
}

export interface PriceChange {
  productId: number;
  productTitle: string;
  variantId: number;
  variantName: string;
  oldPrice: number;
  newPrice: number;
  difference: number;
  percentageChange: string;
  currency: string;
  changeType: 'increase' | 'decrease';
}

export interface SyncResult {
  success: boolean;
  message: string;
  stats: {
    total: number;
    updated: number;
    discontinued: number;
    priceChanges: number;
    errors: any[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class StockSyncPrintfulService {

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
   * Sincronizar stock completo
   */
  syncStock(): Observable<SyncResult> {
    const headers = this.getHeaders();
    return this.http.get<SyncResult>(
      `${URL_SERVICIOS}/printful/stock/sync`,
      { headers }
    );
  }

  /**
   * Obtener productos discontinuados
   */
  getDiscontinuedProducts(): Observable<{ success: boolean; count: number; products: DiscontinuedProduct[] }> {
    const headers = this.getHeaders();
    return this.http.get<{ success: boolean; count: number; products: DiscontinuedProduct[] }>(
      `${URL_SERVICIOS}/printful/stock/discontinued`,
      { headers }
    );
  }

  /**
   * Detectar cambios de precio
   */
  getPriceChanges(): Observable<{ success: boolean; count: number; changes: PriceChange[] }> {
    const headers = this.getHeaders();
    return this.http.get<{ success: boolean; count: number; changes: PriceChange[] }>(
      `${URL_SERVICIOS}/printful/stock/price-changes`,
      { headers }
    );
  }

  /**
   * Actualizar producto específico
   */
  updateProduct(id: number): Observable<{ success: boolean; message: string; updatedVariants: number }> {
    const headers = this.getHeaders();
    return this.http.post<{ success: boolean; message: string; updatedVariants: number }>(
      `${URL_SERVICIOS}/printful/stock/update/${id}`,
      {},
      { headers }
    );
  }

  /**
   * Obtener estadísticas de stock
   */
  getStockStats(): Observable<{ success: boolean; stats: StockStats }> {
    const headers = this.getHeaders();
    return this.http.get<{ success: boolean; stats: StockStats }>(
      `${URL_SERVICIOS}/printful/stock/stats`,
      { headers }
    );
  }
}
