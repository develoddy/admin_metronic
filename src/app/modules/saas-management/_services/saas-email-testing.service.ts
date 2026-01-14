/**
 * 🧪 SAAS EMAIL TESTING SERVICE
 * Servicio para testing de emails del sistema de trials y suscripciones
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { URL_SERVICIOS } from 'src/app/config/config';

interface Tenant {
  id: number;
  name: string;
  email: string;
  module_key: string;
  plan: string;
  trial_ends_at: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  status: string;
  created_at: string;
}

interface TenantsResponse {
  success: boolean;
  tenants: Tenant[];
  total: number;
}

interface EmailTestResult {
  success: boolean;
  message: string;
  tenantId?: number;
  emailSent?: boolean;
  error?: string;
}

interface SMTPTestResult {
  success: boolean;
  message: string;
  config?: any;
}

interface CronTestResult {
  success: boolean;
  message: string;
  result?: any;
}

@Injectable({
  providedIn: 'root'
})
export class SaasEmailTestingService {

  private baseUrl = URL_SERVICIOS + '/saas-email-testing';

  constructor(private http: HttpClient) { }

  /**
   * Obtener headers comunes para las peticiones
   */
  private getHeaders(): HttpHeaders {
    let token = localStorage.getItem('token') || 
                localStorage.getItem('authf649fc9a5f55') ||
                sessionStorage.getItem('token');
    
    const headers: any = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      if (token.startsWith('Bearer ')) {
        token = token.substring(7);
      }
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return new HttpHeaders(headers);
  }

  /**
   * Obtener lista de tenants para testing
   */
  getTenants(): Observable<TenantsResponse> {
    const url = `${this.baseUrl}/tenants`;
    return this.http.get<TenantsResponse>(url, {
      headers: this.getHeaders()
    });
  }

  /**
   * Probar configuración SMTP
   */
  testSMTPConfiguration(): Observable<SMTPTestResult> {
    return this.http.get<SMTPTestResult>(`${this.baseUrl}/test-smtp`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Enviar email de bienvenida trial
   */
  sendTrialWelcomeEmail(tenantId: number): Observable<EmailTestResult> {
    return this.http.post<EmailTestResult>(
      `${this.baseUrl}/send-trial-welcome/${tenantId}`,
      {},
      { headers: this.getHeaders() }
    );
  }

  /**
   * Enviar email de trial por expirar
   */
  sendTrialExpiringEmail(tenantId: number): Observable<EmailTestResult> {
    return this.http.post<EmailTestResult>(
      `${this.baseUrl}/send-trial-expiring/${tenantId}`,
      {},
      { headers: this.getHeaders() }
    );
  }

  /**
   * Enviar email de trial expirado
   */
  sendTrialExpiredEmail(tenantId: number): Observable<EmailTestResult> {
    return this.http.post<EmailTestResult>(
      `${this.baseUrl}/send-trial-expired/${tenantId}`,
      {},
      { headers: this.getHeaders() }
    );
  }

  /**
   * Enviar email de pago exitoso
   */
  sendPaymentSuccessEmail(tenantId: number, amount?: number): Observable<EmailTestResult> {
    return this.http.post<EmailTestResult>(
      `${this.baseUrl}/send-payment-success/${tenantId}`,
      { amount },
      { headers: this.getHeaders() }
    );
  }

  /**
   * Enviar email de suscripción cancelada
   */
  sendSubscriptionCancelledEmail(tenantId: number): Observable<EmailTestResult> {
    return this.http.post<EmailTestResult>(
      `${this.baseUrl}/send-subscription-cancelled/${tenantId}`,
      {},
      { headers: this.getHeaders() }
    );
  }

  /**
   * Enviar email de acceso perdido
   */
  sendAccessLostEmail(tenantId: number): Observable<EmailTestResult> {
    return this.http.post<EmailTestResult>(
      `${this.baseUrl}/send-access-lost/${tenantId}`,
      {},
      { headers: this.getHeaders() }
    );
  }

  /**
   * Ejecutar cron de notificaciones de trial manualmente
   */
  runTrialNotificationsNow(): Observable<CronTestResult> {
    return this.http.post<CronTestResult>(
      `${this.baseUrl}/run-trial-notifications`,
      {},
      { headers: this.getHeaders() }
    );
  }
}
