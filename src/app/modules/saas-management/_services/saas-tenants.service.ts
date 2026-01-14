import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { URL_SERVICIOS } from '../../../config/config';

export interface TenantListItem {
  id: number;
  name: string;
  email: string;
  module_key: string;
  plan: string;
  status: 'trial' | 'active' | 'cancelled' | 'suspended' | 'expired';
  trial_ends_at: string;
  trial_extended: boolean;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  subscribed_at: string;
  cancelled_at: string;
  subscription_ends_at: string;
  created_at: string;
  updated_at: string;
}

export interface TenantsResponse {
  success: boolean;
  tenants: TenantListItem[];
  total: number;
}

export interface TenantActionResponse {
  success: boolean;
  message: string;
  tenant?: TenantListItem;
}

@Injectable({
  providedIn: 'root'
})
export class SaasTenantsService {
  private baseUrl = `${URL_SERVICIOS}/saas-admin`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Obtener lista de todos los tenants
   */
  getTenants(): Observable<TenantsResponse> {
    return this.http.get<TenantsResponse>(`${this.baseUrl}/tenants`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Obtener detalles de un tenant específico
   */
  getTenantById(tenantId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/tenants/${tenantId}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Extender trial de un tenant
   */
  extendTrial(tenantId: number, days: number): Observable<TenantActionResponse> {
    return this.http.post<TenantActionResponse>(
      `${this.baseUrl}/tenants/${tenantId}/extend-trial`,
      { days },
      { headers: this.getHeaders() }
    );
  }

  /**
   * Cancelar suscripción de un tenant
   */
  cancelSubscription(tenantId: number): Observable<TenantActionResponse> {
    return this.http.post<TenantActionResponse>(
      `${this.baseUrl}/tenants/${tenantId}/cancel-subscription`,
      {},
      { headers: this.getHeaders() }
    );
  }

  /**
   * Suspender cuenta de un tenant
   */
  suspendTenant(tenantId: number, reason?: string): Observable<TenantActionResponse> {
    return this.http.post<TenantActionResponse>(
      `${this.baseUrl}/tenants/${tenantId}/suspend`,
      { reason },
      { headers: this.getHeaders() }
    );
  }

  /**
   * Reactivar cuenta de un tenant
   */
  reactivateTenant(tenantId: number): Observable<TenantActionResponse> {
    return this.http.post<TenantActionResponse>(
      `${this.baseUrl}/tenants/${tenantId}/reactivate`,
      {},
      { headers: this.getHeaders() }
    );
  }

  /**
   * Cambiar plan de un tenant
   */
  changePlan(tenantId: number, newPlan: string): Observable<TenantActionResponse> {
    return this.http.post<TenantActionResponse>(
      `${this.baseUrl}/tenants/${tenantId}/change-plan`,
      { plan: newPlan },
      { headers: this.getHeaders() }
    );
  }

  /**
   * Agregar nota del admin a un tenant
   */
  addNote(tenantId: number, noteData: any): Observable<TenantActionResponse> {
    return this.http.post<TenantActionResponse>(
      `${this.baseUrl}/tenants/${tenantId}/notes`,
      noteData,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Obtener notas de un tenant
   */
  getTenantNotes(tenantId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/tenants/${tenantId}/notes`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Eliminar tenant (peligroso)
   */
  deleteTenant(tenantId: number): Observable<TenantActionResponse> {
    return this.http.delete<TenantActionResponse>(
      `${this.baseUrl}/tenants/${tenantId}`,
      { headers: this.getHeaders() }
    );
  }
}
