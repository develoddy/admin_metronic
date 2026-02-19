import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { URL_SERVICIOS } from '../../../config/config';

export interface TrackingEvent {
  id: number;
  event: string;
  properties: any;
  session_id: string;
  user_id: string | null;
  tenant_id: number | null;
  module: string | null;
  source: string | null;
  user_agent: string | null;
  ip_address: string | null;
  timestamp: string;
  created_at: string;
}

export interface TrackingEventsFilters {
  module?: string;
  event?: string;
  source?: string;
  campaign?: string; // 🆕 UTM tracking
  medium?: string;   // 🆕 UTM tracking
  is_internal_access?: boolean; // 🆕 Admin vs Public differentiation
  session_id?: string;
  user_id?: string;
  tenant_id?: number;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export interface TrackingEventsResponse {
  success: boolean;
  events: TrackingEvent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class SaasTrackingEventsService {
  private apiUrl = `${URL_SERVICIOS}/admin/saas/tracking-events`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener lista de eventos con filtros y paginación
   */
  getTrackingEvents(filters: TrackingEventsFilters = {}): Observable<TrackingEventsResponse> {
    let params = new HttpParams();

    // Agregar filtros a params
    if (filters.module) {
      params = params.set('module', filters.module);
    }
    if (filters.event) {
      params = params.set('event', filters.event);
    }
    if (filters.source) {
      params = params.set('source', filters.source);
    }
    if (filters.campaign) {
      params = params.set('campaign', filters.campaign);
    }
    if (filters.medium) {
      params = params.set('medium', filters.medium);
    }
    if (filters.is_internal_access !== undefined) {
      params = params.set('is_internal_access', String(filters.is_internal_access));
    }
    if (filters.session_id) {
      params = params.set('session_id', filters.session_id);
    }
    if (filters.user_id) {
      params = params.set('user_id', filters.user_id);
    }
    if (filters.tenant_id) {
      params = params.set('tenant_id', filters.tenant_id.toString());
    }
    if (filters.date_from) {
      params = params.set('date_from', filters.date_from);
    }
    if (filters.date_to) {
      params = params.set('date_to', filters.date_to);
    }
    if (filters.page) {
      params = params.set('page', filters.page.toString());
    }
    if (filters.limit) {
      params = params.set('limit', filters.limit.toString());
    }

    const headers = this.getAuthHeaders();
    return this.http.get<TrackingEventsResponse>(this.apiUrl, { headers, params });
  }

  /**
   * Obtener lista de módulos únicos
   */
  getUniqueModules(): Observable<{ success: boolean; modules: string[] }> {
    const headers = this.getAuthHeaders();
    return this.http.get<{ success: boolean; modules: string[] }>(
      `${this.apiUrl}/modules`,
      { headers }
    );
  }

  /**
   * Obtener lista de eventos únicos
   */
  getUniqueEvents(): Observable<{ success: boolean; events: string[] }> {
    const headers = this.getAuthHeaders();
    return this.http.get<{ success: boolean; events: string[] }>(
      `${this.apiUrl}/event-types`,
      { headers }
    );
  }

  /**
   * Exportar eventos a CSV
   */
  exportToCSV(filters: TrackingEventsFilters = {}): Observable<Blob> {
    let params = new HttpParams();

    // Agregar filtros a params (igual que en getTrackingEvents)
    if (filters.module) params = params.set('module', filters.module);
    if (filters.event) params = params.set('event', filters.event);
    if (filters.source) params = params.set('source', filters.source);
    if (filters.campaign) params = params.set('campaign', filters.campaign);
    if (filters.medium) params = params.set('medium', filters.medium);
    if (filters.is_internal_access !== undefined) params = params.set('is_internal_access', String(filters.is_internal_access));
    if (filters.session_id) params = params.set('session_id', filters.session_id);
    if (filters.user_id) params = params.set('user_id', filters.user_id);
    if (filters.tenant_id) params = params.set('tenant_id', filters.tenant_id.toString());
    if (filters.date_from) params = params.set('date_from', filters.date_from);
    if (filters.date_to) params = params.set('date_to', filters.date_to);

    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/export`, {
      headers,
      params,
      responseType: 'blob'
    });
  }

  /**
   * Eliminar eventos por source (LEGACY - mantener para compatibilidad)
   * ⚠️ Solo debe usarse en testing para limpiar eventos internos
   */
  deleteEventsBySource(source: string): Observable<{ success: boolean; deleted: number; message: string }> {
    const headers = this.getAuthHeaders();
    return this.http.delete<{ success: boolean; deleted: number; message: string }>
      (`${this.apiUrl}/by-source/${source}`,
      { headers }
    );
  }

  /**
   * 🆕 Eliminar eventos de tests internos (is_internal_access=true)
   * Sistema UTM tracking - Protege eventos públicos
   * ⚠️ Solo para development: limpiar tests antes de lanzar MVP
   */
  deleteInternalAccessEvents(): Observable<{ success: boolean; deleted: number; message: string }> {
    const headers = this.getAuthHeaders();
    return this.http.delete<{ success: boolean; deleted: number; message: string }>
      (`${this.apiUrl}/internal-access`,
      { headers }
    );
  }

  /**
   * Headers con autenticación
   */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    });
  }
}
