import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { URL_SERVICIOS } from 'src/app/config/config';
import { AuthService } from '../../auth';

@Injectable({ providedIn: 'root' })
export class AdminSalesService {
  private salesSubject = new BehaviorSubject<any[]>([]);
  public sales$ = this.salesSubject.asObservable();

  private selectedSaleSubject = new BehaviorSubject<any>(null);
  public selectedSale$ = this.selectedSaleSubject.asObservable();

  constructor(private http: HttpClient, private _auth: AuthService) { }

  private getAuthHeaders() {
    const headers = new HttpHeaders({ 'token': this._auth.token || '' });
    return { headers };
  }

  getSales(params: any = {}): Observable<any> {
    const url = `${URL_SERVICIOS}/sales/list`;
    return this.http.get<any>(url, { params, ...this.getAuthHeaders() }).pipe(
      tap(resp => {
        if (resp && resp.success) {
          this.salesSubject.next(resp.sales || resp.sales || []);
        }
      })
    );
  }

  getSaleById(id: number | string): Observable<any> {
    const url = `${URL_SERVICIOS}/sales/show/${id}`;
    return this.http.get<any>(url, this.getAuthHeaders()).pipe(
      tap(resp => {
        if (resp && resp.sale) {
          this.selectedSaleSubject.next(resp.sale);
        }
      })
    );
  }

  selectSale(sale: any) {
    this.selectedSaleSubject.next(sale);
  }
}
