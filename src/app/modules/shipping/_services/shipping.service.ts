import { Injectable } from '@angular/core';
import { finalize, tap } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { URL_SERVICIOS } from 'src/app/config/config';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from '../../auth';

/**
 * ⚠️ DEPRECATED: Este servicio está obsoleto.
 * 
 * Motivo: El módulo Shipping es redundante con la integración de Printful.
 * La información de tracking (trackingNumber, carrier, shippedAt) se almacena 
 * directamente en la tabla Sales y es actualizada por los webhooks de Printful.
 * 
 * Reemplazo: Use el módulo Admin-Sales para ver toda la información de envíos.
 * - Los datos de tracking están disponibles en Sales.trackingNumber, Sales.carrier, Sales.shippedAt
 * - Los webhooks de Printful actualizan estos campos automáticamente
 * - El componente sale-detail en Admin-Sales muestra esta información
 * 
 * @deprecated Use Admin-Sales module instead. Tracking info is stored in Sales table.
 */
@Injectable({
  providedIn: 'root'
})
export class ShippingService {

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.loadingSubject.asObservable();

  

  constructor(private http: HttpClient, private _auth: AuthService) {}
  
  /**
   * Get authorization headers
   */
  private getAuthHeaders() {
    const headers = new HttpHeaders({ 'token': this._auth.token || '' });
    return { headers };
  }

  /**
   * Listado de envíos
   * @param params Query params opcionales
   */
  getShipments(params: any = {}) {
    this.loadingSubject.next(true);
    const url = `${URL_SERVICIOS}/shipping`;
    return this.http.get<any>(url, { params, ...this.getAuthHeaders() })
      .pipe(finalize(() => this.loadingSubject.next(false)));
  }

  /**
   * Obtener un envío por ID
   */
  getShipmentById(id: number) {
    this.loadingSubject.next(true);
    const url = `${URL_SERVICIOS}/shipping/${id}`;
    return this.http.get<any>(url, { ...this.getAuthHeaders() })
      .pipe(finalize(() => this.loadingSubject.next(false)));
  }

  // getShipmentById(id: number | string): Observable<any> {
  //     const url = `${URL_SERVICIOS}/shipping/${id}`;
  //     return this.http.get<any>(url, this.getAuthHeaders()).pipe(
  //       tap(resp => {
  //         if (resp && resp.sale) {
  //           this.loadingSubject.next(resp.sale);
  //         }
  //       })
  //     );
  //   }

  /**
   * Actualizar un envío
   */
  updateShipment(id: number, payload: any) {
    this.loadingSubject.next(true);
    const url = `${URL_SERVICIOS}/shipping/${id}`;
    return this.http.patch<any>(url, payload, { ...this.getAuthHeaders() })
      .pipe(finalize(() => this.loadingSubject.next(false)));
  }

  /**
   * Obtener todos los envíos de una venta específica
   */
  getShipmentsBySaleId(saleId: number) {
    this.loadingSubject.next(true);
    const url = `${URL_SERVICIOS}/shipping/by-sale/${saleId}`;
    return this.http.get<any>(url, { ...this.getAuthHeaders() })
      .pipe(finalize(() => this.loadingSubject.next(false)));
  }
}
