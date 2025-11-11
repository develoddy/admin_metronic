import { Injectable } from '@angular/core';
import { finalize, map } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { URL_SERVICIOS } from 'src/app/config/config';
import { AuthService } from '../../auth';

@Injectable({
  providedIn: 'root'
})
export class ReceiptService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient, private _auth: AuthService) {}

  /**
   * Obtiene cabecera de autorización
   */
  private getAuthHeaders() {
    const headers = new HttpHeaders({ 'token': this._auth.token || '' });
    return { headers };
  }

  /**
   * 🧾 Obtener lista de recibos
   * @param params filtros opcionales
   */
  getReceipts(params: any = {}) {
    this.loadingSubject.next(true);
    const url = `${URL_SERVICIOS}/receipts`;
    return this.http.get<any>(url, { params, ...this.getAuthHeaders() })
      .pipe(finalize(() => this.loadingSubject.next(false)));
  }

  /**
   * 🧾 Obtener recibo por ID
   * @param id identificador del recibo
   */
  getReceiptById(id: number) {
    this.loadingSubject.next(true);
    const url = `${URL_SERVICIOS}/receipts/${id}`;
    return this.http.get<any>(url, { ...this.getAuthHeaders() })
      .pipe(finalize(() => this.loadingSubject.next(false)));
  }

  /**
   * 🧾 Crear nuevo recibo
   * @param payload datos del recibo
   */
  createReceipt(payload: any) {
    this.loadingSubject.next(true);
    const url = `${URL_SERVICIOS}/receipts`;
    return this.http.post<any>(url, payload, { ...this.getAuthHeaders() })
      .pipe(finalize(() => this.loadingSubject.next(false)));
  }

  /**
   * 🧾 Actualizar recibo existente
   * @param id ID del recibo
   * @param payload datos a actualizar
   */
  updateReceipt(id: number, payload: any) {
    this.loadingSubject.next(true);
    const url = `${URL_SERVICIOS}/receipts/${id}`;
    return this.http.patch<any>(url, payload, { ...this.getAuthHeaders() })
      .pipe(finalize(() => this.loadingSubject.next(false)));
  }

  /**
   * 🧾 Obtener recibos por ID de venta
   * @param saleId ID de la venta
   */
  getReceiptsBySaleId(saleId: number) {
    this.loadingSubject.next(true);
    const url = `${URL_SERVICIOS}/receipts/by-sale/${saleId}`;
    return this.http.get<any>(url, { ...this.getAuthHeaders() })
      .pipe(finalize(() => this.loadingSubject.next(false)));
  }

  /**
   * Descargar recibo en PDF
   * @param id 
   * @returns 
   */
  downloadReceipt(id: number) {
    return this.http.get(`${URL_SERVICIOS}/receipts/${id}/pdf`, { 
      responseType: 'blob', 
      ...this.getAuthHeaders() 
    });
  }
}
