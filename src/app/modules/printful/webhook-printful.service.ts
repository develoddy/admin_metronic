import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../auth';
import { URL_SERVICIOS } from '../../config/config';

@Injectable({
  providedIn: 'root'
})
export class WebhookPrintfulService {

  constructor(
    public http: HttpClient,
    public authService: AuthService,
  ) { }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'token': this.authService.token
    });
  }

  /**
   * Obtiene el historial de webhooks con filtros opcionales
   */
  getWebhookLogs(filters?: {
    event_type?: string;
    order_id?: string;
    processed?: boolean;
    limit?: number;
  }): Observable<any> {
    let params: any = {};
    if (filters) {
      if (filters.event_type) params.event_type = filters.event_type;
      if (filters.order_id) params.order_id = filters.order_id;
      if (filters.processed !== undefined) params.processed = filters.processed.toString();
      if (filters.limit) params.limit = filters.limit.toString();
    }

    const url = URL_SERVICIOS + '/printful/webhook/logs';
    return this.http.get(url, { headers: this.getHeaders(), params });
  }

  /**
   * Obtiene estadísticas de webhooks agrupadas por tipo de evento
   */
  getWebhookStats(): Observable<any> {
    const url = URL_SERVICIOS + '/printful/webhook/stats';
    return this.http.get(url, { headers: this.getHeaders() });
  }

  /**
   * Obtiene los tipos de eventos disponibles
   */
  getEventTypes(): string[] {
    return [
      'package_shipped',
      'package_returned',
      'order_failed',
      'order_canceled',
      'order_updated',
      'order_created',
      'product_synced',
      'stock_updated'
    ];
  }

  /**
   * Formatea el nombre del evento para mostrar
   */
  formatEventType(eventType: string): string {
    const translations: { [key: string]: string } = {
      'package_shipped': 'Paquete Enviado',
      'package_returned': 'Paquete Devuelto',
      'order_failed': 'Pedido Fallido',
      'order_canceled': 'Pedido Cancelado',
      'order_updated': 'Pedido Actualizado',
      'order_created': 'Pedido Creado',
      'product_synced': 'Producto Sincronizado',
      'stock_updated': 'Stock Actualizado'
    };
    return translations[eventType] || eventType;
  }

  /**
   * Obtiene el color del badge según el tipo de evento
   */
  getEventBadgeColor(eventType: string): string {
    const colors: { [key: string]: string } = {
      'package_shipped': 'success',
      'package_returned': 'warning',
      'order_failed': 'danger',
      'order_canceled': 'dark',
      'order_updated': 'info',
      'order_created': 'primary',
      'product_synced': 'success',
      'stock_updated': 'info'
    };
    return colors[eventType] || 'secondary';
  }

  /**
   * Formatea la fecha para mostrar
   */
  formatDate(date: string): string {
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
}
