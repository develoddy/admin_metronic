import { Injectable } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { URL_SERVICIOS } from 'src/app/config/config';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from '../../auth';

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
