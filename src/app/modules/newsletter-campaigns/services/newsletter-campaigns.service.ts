import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/modules/auth/_services/auth.service';

// Interfaces
export interface NewsletterSubscriber {
  id: number;
  email: string;
  session_id?: string;
  source: 'home' | 'footer' | 'checkout' | 'campaign_import' | 'admin';
  ip_address?: string;
  user_agent?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  status: 'subscribed' | 'unsubscribed' | 'bounced';
  email_verified: boolean;
  verification_token?: string;
  notified_campaign: boolean;
  coupon_sent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewsletterStats {
  total: number;
  verified: number;
  unsubscribed: number;
  bounced: number;
  by_source: { [key: string]: number };
  by_date: { [key: string]: number };
  conversion_rate: number;
  recent_campaigns?: any[];
}

export interface NewsletterCampaign {
  id?: number;
  name: string;
  subject: string;
  html_body: string;
  filters?: {
    source?: string;
    verified?: boolean;
    dateFrom?: string;
    dateTo?: string;
  };
  status?: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed';
  scheduled_at?: Date;
  sent_at?: Date;
  total_recipients?: number;
  sent_count?: number;
  delivered_count?: number;
  failed_count?: number;
  test_emails?: string[];
}

export interface CampaignResult {
  status: number;
  message: string;
  data?: {
    campaign_id?: number;
    sent: number;
    failed: number;
    total: number;
    test?: boolean;
    count?: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class NewsletterCampaignsService {
  private API_URL = environment.URL_SERVICIOS || 'http://localhost:3500/api';
  
  // Observable para progreso de campaña
  private campaignProgressSubject = new BehaviorSubject<any>(null);
  public campaignProgress$ = this.campaignProgressSubject.asObservable();

  constructor(
    private http: HttpClient,
    private _authService: AuthService
  ) {}

  /**
   * Obtener estadísticas generales
   */
  getStats(): Observable<NewsletterStats> {
    const headers = new HttpHeaders({ 'token': this._authService.token || '' });
    return this.http.get<any>(`${this.API_URL}/newsletter/admin/stats`, { headers }).pipe(
      map(response => response.data || response)
    );
  }

  /**
   * Obtener lista de suscriptores con paginación y filtros
   */
  getSubscribers(page = 1, limit = 50, filters?: any): Observable<any> {
    const headers = new HttpHeaders({ 'token': this._authService.token || '' });
    const params: any = { page, limit, ...filters };
    return this.http.get<any>(`${this.API_URL}/newsletter/admin/subscribers`, { headers, params }).pipe(
      map(response => response.data || response)
    );
  }

  /**
   * Exportar suscriptores a CSV
   */
  exportSubscribers(): Observable<Blob> {
    const headers = new HttpHeaders({ 'token': this._authService.token || '' });
    return this.http.get(`${this.API_URL}/newsletter/admin/export`, {
      headers,
      responseType: 'blob'
    });
  }

  /**
   * Obtener lista de campañas
   */
  getCampaigns(page = 1, limit = 20, status?: string): Observable<any> {
    const headers = new HttpHeaders({ 'token': this._authService.token || '' });
    const params: any = { page, limit };
    if (status) params.status = status;
    
    return this.http.get<any>(`${this.API_URL}/newsletter/admin/campaigns`, { headers, params }).pipe(
      map(response => response.data || response)
    );
  }

  /**
   * Crear campaña (sin enviar)
   */
  createCampaign(campaignData: NewsletterCampaign): Observable<any> {
    const headers = new HttpHeaders({ 
      'token': this._authService.token || '',
      'Content-Type': 'application/json'
    });
    return this.http.post<any>(
      `${this.API_URL}/newsletter/admin/campaigns/create`,
      {
        name: campaignData.name,
        subject: campaignData.subject,
        htmlBody: campaignData.html_body,
        filters: campaignData.filters
      },
      { headers }
    );
  }

  /**
   * Enviar campaña de newsletter
   */
  sendCampaign(campaignData: NewsletterCampaign): Observable<CampaignResult> {
    const headers = new HttpHeaders({ 
      'token': this._authService.token || '',
      'Content-Type': 'application/json'
    });
    return this.http.post<CampaignResult>(
      `${this.API_URL}/newsletter/admin/campaigns/send`,
      {
        name: campaignData.name,
        subject: campaignData.subject,
        htmlBody: campaignData.html_body,
        filters: campaignData.filters
      },
      { headers }
    );
  }

  /**
   * Enviar emails de prueba
   */
  sendTestEmails(subject: string, htmlBody: string, testEmails: string[]): Observable<CampaignResult> {
    const headers = new HttpHeaders({ 
      'token': this._authService.token || '',
      'Content-Type': 'application/json'
    });
    return this.http.post<CampaignResult>(
      `${this.API_URL}/newsletter/admin/campaigns/send-test`,
      {
        subject,
        htmlBody,
        testEmails
      },
      { headers }
    );
  }

  /**
   * Preview de campaña
   */
  previewCampaign(htmlBody: string): Observable<{ status: number; html: string }> {
    const headers = new HttpHeaders({ 
      'token': this._authService.token || '',
      'Content-Type': 'application/json'
    });
    return this.http.post<any>(
      `${this.API_URL}/newsletter/admin/campaigns/preview`,
      { htmlBody },
      { headers }
    );
  }

  /**
   * Actualizar progreso de campaña (para UI)
   */
  updateCampaignProgress(progress: any) {
    this.campaignProgressSubject.next(progress);
  }

  /**
   * Resetear progreso de campaña
   */
  resetCampaignProgress() {
    this.campaignProgressSubject.next(null);
  }

  /**
   * Obtener resumen de destinatarios según filtros
   */
  getRecipientsCount(filters?: any): Observable<{ count: number }> {
    // Usar el endpoint de subscribers con filtros para obtener el count
    return this.getSubscribers(1, 1, filters).pipe(
      map(response => ({
        count: response.pagination?.total || 0
      }))
    );
  }
}
