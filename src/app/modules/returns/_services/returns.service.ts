import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { finalize, map } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';


import { URL_SERVICIOS } from 'src/app/config/config';
import { AuthService } from '../../auth';

@Injectable({
  providedIn: 'root'
})
export class ReturnsService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient, private _auth: AuthService) {}

  /**
   * Get authorization headers
   * @returns 
   */
  private getAuthHeaders() {
    const headers = new HttpHeaders({ 'token': this._auth.token || '' });
    return { headers };
  }
  /**
   * Get list of returns
   * @param params 
   * @returns 
   */
  getReturns(params: any = {}) {
    this.loadingSubject.next(true);
    const url = `${URL_SERVICIOS}/returns`;
    return this.http.get<any>(url, { params, ...this.getAuthHeaders() })
      .pipe(finalize(() => this.loadingSubject.next(false)));
  }

  /**
   * Get return by ID
   * @param id 
   * @returns 
   */
  getReturnById(id: number) {
    this.loadingSubject.next(true);
    const url = `${URL_SERVICIOS}/returns/${id}`;
    return this.http.get<any>(url, { ...this.getAuthHeaders() })
      .pipe(finalize(() => this.loadingSubject.next(false)));
  }

  /**
   * Create a new return
   * @param payload 
   * @returns 
   */
  createReturn(payload: any) {
    this.loadingSubject.next(true);
    const url = `${URL_SERVICIOS}/returns`;
    return this.http.post<any>(url, payload, { ...this.getAuthHeaders() })
      .pipe(finalize(() => this.loadingSubject.next(false)));
  }

  /**
   * Update an existing return
   * @param id 
   * @param payload 
   * @returns 
   */
  updateReturn(id: number, payload: any) {
    this.loadingSubject.next(true);
    const url = `${URL_SERVICIOS}/returns/${id}`;
    return this.http.patch<any>(url, payload, { ...this.getAuthHeaders() })
      .pipe(finalize(() => this.loadingSubject.next(false)));
  }

  /**
   * Get returns by sale ID
   * @param saleId 
   * @returns 
   */
  getReturnsBySaleId(saleId: number) {
    this.loadingSubject.next(true);
    const url = `${URL_SERVICIOS}/returns/by-sale/${saleId}`;
    return this.http.get<any>(url, { ...this.getAuthHeaders() })
      .pipe(finalize(() => this.loadingSubject.next(false)));
  }

  /**
   * Check if there are returns for a specific search value
   * @param searchValue 
   * @returns 
   */
  hasReturns(searchValue: string) {
    this.loadingSubject.next(true);
    const url = `${URL_SERVICIOS}/returns/has`;
    const params = { q: searchValue }; // query params

    return this.http.get<{ hasReturns: boolean }>(url, { params, ...this.getAuthHeaders() })
      .pipe(finalize(() => this.loadingSubject.next(false)));
  }
}
