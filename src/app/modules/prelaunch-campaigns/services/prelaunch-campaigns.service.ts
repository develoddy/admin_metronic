import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { AuthService } from 'src/app/modules/auth/_services/auth.service';

// Interfaces
export interface PrelaunchSubscriber {
  id: number;
  email: string;
  session_id: string;
  source: string;
  ip_address?: string;
  user_agent?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  status: 'pending' | 'subscribed' | 'unsubscribed';
  email_verified: boolean;
  verification_token?: string;
  notified_launch: boolean;
  coupon_sent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PrelaunchStats {
  total: number;
  verified: number;
  pending: number;
  unsubscribed: number;
  notified: number;
  by_source: { [key: string]: number };
  by_date: { [key: string]: number };
  conversion_rate: number;
}

export interface LaunchCampaignConfig {
  coupon_discount: string;
  coupon_expiry_days: string;
  featured_products: Array<{
    name: string;
    price: string;
    image: string;
  }>;
  preview_only?: boolean;
}

export interface LaunchCampaignResult {
  success: boolean;
  sent: number;
  errors: number;
  total: number;
  message?: string;
  error?: string;
}

export interface PrelaunchConfig {
  enabled: boolean;
  launch_date?: Date | string | null;
  updated_at: Date;
  updated_by?: number;
}

export interface PrelaunchStatusResponse {
  status: number;
  enabled: boolean;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PrelaunchCampaignsService {
  private API_URL = environment.URL_SERVICIOS;
  
  // Observable para progreso en tiempo real
  private campaignProgressSubject = new BehaviorSubject<any>(null);
  public campaignProgress$ = this.campaignProgressSubject.asObservable();

  constructor(
    private http: HttpClient,
    private _authService: AuthService
  ) {}

  /**
   * Obtener estadísticas generales de prelaunch
   */
  getStats(): Observable<PrelaunchStats> {
    return this.http.get<any>(`${this.API_URL}/prelaunch/stats`).pipe(
      map(response => response.data || response)
    );
  }

  /**
   * Obtener lista de todos los suscriptores
   */
  getSubscribers(filters?: any): Observable<PrelaunchSubscriber[]> {
    const params = filters ? { params: filters } : {};
    return this.http.get<any>(`${this.API_URL}/prelaunch/admin/subscribers`, params).pipe(
      map(response => {
        // Asegurarse de que siempre retorne un array
        const data = response.data || response;
        return Array.isArray(data) ? data : [];
      })
    );
  }

  /**
   * Obtener suscriptor por ID
   */
  getSubscriberById(id: number): Observable<PrelaunchSubscriber> {
    return this.http.get<any>(`${this.API_URL}/prelaunch/subscribers/${id}`).pipe(
      map(response => response.data || response)
    );
  }

  /**
   * Desuscribir manualmente un email
   */
  unsubscribeEmail(email: string): Observable<any> {
    return this.http.post(`${this.API_URL}/prelaunch/unsubscribe`, { email });
  }

  /**
   * Enviar campaña de lanzamiento
   * Este es el endpoint principal que reemplaza el script
   */
  launchCampaign(config: LaunchCampaignConfig): Observable<LaunchCampaignResult> {
    return this.http.post<any>(
      `${this.API_URL}/prelaunch/admin/campaigns/launch`,
      config
    ).pipe(
      map(response => ({
        success: response.status === 200 && (response.data?.total > 0 || !response.warning),
        message: response.message,
        sent: response.data?.sent || 0,
        errors: response.data?.errors || 0,
        total: response.data?.total || 0,
        error: response.error || response.warning
      }))
    );
  }

  /**
   * Obtener preview del email de lanzamiento
   */
  getEmailPreview(config: LaunchCampaignConfig): Observable<{ html: string }> {
    return this.http.post<{ html: string }>(
      `${this.API_URL}/prelaunch/admin/campaigns/preview`,
      config
    );
  }

  /**
   * Reenviar email de verificación
   */
  resendVerification(email: string): Observable<any> {
    return this.http.post(`${this.API_URL}/prelaunch/admin/resend-verification`, { email });
  }

  /**
   * Exportar suscriptores a CSV
   */
  exportSubscribers(filters?: any): Observable<Blob> {
    const params = filters ? { params: filters } : {};
    return this.http.get(`${this.API_URL}/prelaunch/admin/export`, {
      ...params,
      responseType: 'blob'
    });
  }

  /**
   * Obtener historial de campañas enviadas
   */
  getCampaignHistory(): Observable<any[]> {
    return this.http.get<any>(`${this.API_URL}/prelaunch/admin/campaigns/history`).pipe(
      map(response => response.data || response)
    );
  }

  /**
   * Actualizar progreso de campaña (para WebSocket en el futuro)
   */
  updateCampaignProgress(progress: any) {
    this.campaignProgressSubject.next(progress);
  }

  // ============================================================================
  //                    MÉTODOS DE CONFIGURACIÓN PRE-LAUNCH MODE
  // ============================================================================

  /**
   * Obtener configuración actual del pre-launch mode
   */
  getPrelaunchConfig(): Observable<PrelaunchConfig> {
    const headers = new HttpHeaders({ 'token': this._authService.token || '' });
    return this.http.get<any>(`${this.API_URL}/prelaunch/config`, { headers }).pipe(
      map(response => response.data || response)
    );
  }

  /**
   * Actualizar configuración del pre-launch mode
   */
  updatePrelaunchConfig(enabled: boolean, launchDate?: Date | string | null): Observable<PrelaunchConfig> {
    const headers = new HttpHeaders({ 'token': this._authService.token || '' });
    const payload: any = { enabled };
    
    // Solo incluir launch_date en el payload si se proporciona
    if (launchDate !== undefined) {
      payload.launch_date = launchDate;
    }
    
    return this.http.put<any>(`${this.API_URL}/prelaunch/config`, payload, { headers }).pipe(
      map(response => response.data || response)
    );
  }

  /**
   * Obtener estado del pre-launch mode (endpoint público)
   */
  getPrelaunchStatus(): Observable<boolean> {
    return this.http.get<PrelaunchStatusResponse>(`${this.API_URL}/prelaunch/status`).pipe(
      map(response => response.enabled || false)
    );
  }
}
