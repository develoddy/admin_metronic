/**
 * 🧪 EMAIL TESTING SERVICE
 * Servicio para comunicarse con la API de testing de emails
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { URL_SERVICIOS } from 'src/app/config/config';

interface Sale {
  saleId: number;
  transaction: string;
  total: string;
  country: string;
  locale: string;
  customer: string;
  email: string;
  createdAt: string;
  printfulId?: number;
}

interface SalesResponse {
  success: boolean;
  message: string;
  sales: Sale[];
}

interface EmailTestRequest {
  saleId: number;
  testEmail: string;
}

interface EmailTestResult {
  success: boolean;
  message: string;
  saleId: number;
  country: string;
  locale: string;
  emailSent: boolean;
  recipient: string;
  trackingNumber?: string;
  deliveredDate?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmailTestingService {

  private baseUrl = URL_SERVICIOS + '/email-testing';

  constructor(private http: HttpClient) { }

  /**
   * Obtener headers comunes para las peticiones
   */
  private getHeaders(): HttpHeaders {
    // Intentar obtener token de diferentes fuentes
    let token = localStorage.getItem('token') || 
                localStorage.getItem('authf649fc9a5f55') ||
                sessionStorage.getItem('token');
    
    console.log('🔑 [Email Testing] Token encontrado:', token ? 'SÍ' : 'NO');
    
    const headers: any = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      // Limpiar token si tiene Bearer ya incluido
      if (token.startsWith('Bearer ')) {
        token = token.substring(7);
      }
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return new HttpHeaders(headers);
  }

  /**
   * Obtener ventas disponibles para testing
   */
  getAvailableSales(): Observable<SalesResponse> {
    const url = `${this.baseUrl}/sales`;
    console.log('🔌 [Email Testing Service] Haciendo petición a:', url);
    console.log('🔌 [Email Testing Service] Headers:', this.getHeaders());
    
    return this.http.get<SalesResponse>(url, {
      headers: this.getHeaders()
    });
  }

  /**
   * Enviar email de prueba
   */
  sendTestEmail(emailType: string, request: EmailTestRequest): Observable<EmailTestResult> {
    return this.http.post<EmailTestResult>(`${this.baseUrl}/email/${emailType}`, request, {
      headers: this.getHeaders()
    });
  }

  /**
   * Método helper para probar email de impresión
   */
  sendPrintingEmail(saleId: number, testEmail: string): Observable<EmailTestResult> {
    return this.sendTestEmail('printing', { saleId, testEmail });
  }

  /**
   * Método helper para probar email de envío
   */
  sendShippedEmail(saleId: number, testEmail: string): Observable<EmailTestResult> {
    return this.sendTestEmail('shipped', { saleId, testEmail });
  }

  /**
   * Método helper para probar email de entrega
   */
  sendDeliveredEmail(saleId: number, testEmail: string): Observable<EmailTestResult> {
    return this.sendTestEmail('delivered', { saleId, testEmail });
  }

  /**
   * Validar email format
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Obtener información de país desde código
   */
  getCountryInfo(countryCode: string): { name: string; flag: string } {
    const countries: { [key: string]: { name: string; flag: string } } = {
      'es': { name: 'España', flag: '🇪🇸' },
      'fr': { name: 'Francia', flag: '🇫🇷' },
      'de': { name: 'Alemania', flag: '🇩🇪' },
      'it': { name: 'Italia', flag: '🇮🇹' }
    };
    
    return countries[countryCode] || { name: countryCode.toUpperCase(), flag: '🌍' };
  }

  /**
   * Formatear fecha para mostrar
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}