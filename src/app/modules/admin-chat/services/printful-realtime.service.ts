import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { URL_SERVICIOS } from 'src/app/config/config';
import { AuthService } from '../../auth';
import {
  PrintfulOrderFull,
  TrackingInfo,
  TimelineEvent,
  PrintfulStatus
} from '../models/customer-context.model';

/**
 * PrintfulRealTimeService
 * 
 * Servicio para consultar datos de Printful en tiempo real
 * sin pasar por cache de BD local.
 * 
 * FASE 2A - Sprint 2
 */
@Injectable({
  providedIn: 'root'
})
export class PrintfulRealTimeService {

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Headers con token de autenticación
   */
  private getAuthHeaders(): { headers: HttpHeaders } {
    return {
      headers: new HttpHeaders({
        'token': this.authService.token || ''
      })
    };
  }

  /**
   * ========================================
   * 1. OBTENER ESTADO DE ORDEN EN TIEMPO REAL
   * ========================================
   * 
   * Consulta Printful API directamente para obtener
   * el estado más actualizado de una orden.
   * 
   * @param printfulOrderId ID de la orden en Printful (ej: "135447992")
   * @returns Observable<PrintfulOrderFull | null>
   */
  getOrderStatus(printfulOrderId: string): Observable<PrintfulOrderFull | null> {
    if (!printfulOrderId) {
      console.warn('[PrintfulRealTime] printfulOrderId vacío');
      return of(null);
    }

    console.log(`[PrintfulRealTime] 🔄 Consultando orden ${printfulOrderId} en tiempo real...`);

    const url = `${URL_SERVICIOS}/printful/orders/${printfulOrderId}`;

    return this.http.get<any>(url, this.getAuthHeaders()).pipe(
      map(resp => {
        if (resp && resp.success && resp.data) {
          console.log(`[PrintfulRealTime] ✅ Orden ${printfulOrderId} obtenida:`, resp.data.status);
          return this.mapPrintfulOrder(resp.data);
        }
        console.warn('[PrintfulRealTime] ⚠️ Respuesta sin datos válidos');
        return null;
      }),
      catchError(err => {
        console.error('[PrintfulRealTime] ❌ Error al obtener orden:', err);
        return of(null);
      })
    );
  }

  /**
   * ========================================
   * 2. OBTENER TRACKING ACTUALIZADO
   * ========================================
   * 
   * Consulta información de tracking desde Printful.
   * Si la orden tiene múltiples shipments, devuelve el primero.
   * 
   * @param printfulOrderId ID de la orden en Printful
   * @returns Observable<TrackingInfo | null>
   */
  getTracking(printfulOrderId: string): Observable<TrackingInfo | null> {
    if (!printfulOrderId) {
      return of(null);
    }

    console.log(`[PrintfulRealTime] 📍 Consultando tracking de orden ${printfulOrderId}...`);

    const url = `${URL_SERVICIOS}/printful/orders/${printfulOrderId}/shipments`;

    return this.http.get<any>(url, this.getAuthHeaders()).pipe(
      map(resp => {
        if (resp && resp.success && resp.data && resp.data.length > 0) {
          const firstShipment = resp.data[0];
          console.log('[PrintfulRealTime] ✅ Tracking obtenido:', firstShipment.tracking_number);
          
          return {
            trackingNumber: firstShipment.tracking_number || '',
            trackingUrl: firstShipment.tracking_url || '',
            carrier: firstShipment.carrier || '',
            service: firstShipment.service || '',
            shipped_at: firstShipment.shipped_at || null,
            delivered_at: firstShipment.delivered_at || null,
            lastUpdate: firstShipment.shipped_at || null,
            currentLocation: null, // Printful no provee esto directamente
            events: [] // Aquí se pueden mapear eventos si existen
          } as TrackingInfo;
        }
        
        console.warn('[PrintfulRealTime] ⚠️ Sin datos de tracking disponibles');
        return null;
      }),
      catchError(err => {
        console.error('[PrintfulRealTime] ❌ Error al obtener tracking:', err);
        return of(null);
      })
    );
  }

  /**
   * ========================================
   * 3. CANCELAR ORDEN
   * ========================================
   * 
   * Cancela una orden en Printful.
   * Solo funciona si el estado es 'draft'.
   * 
   * @param printfulOrderId ID de la orden en Printful
   * @param reason Motivo de cancelación
   * @returns Observable<{success: boolean, message: string}>
   */
  cancelOrder(printfulOrderId: string, reason: string = 'Cliente solicitó cancelación'): Observable<{success: boolean, message: string}> {
    if (!printfulOrderId) {
      return of({ success: false, message: 'ID de orden inválido' });
    }

    console.log(`[PrintfulRealTime] ✖️ Cancelando orden ${printfulOrderId}...`);

    const url = `${URL_SERVICIOS}/printful/orders/${printfulOrderId}`;
    const options = {
      headers: this.getAuthHeaders().headers,
      body: { reason }
    };

    return this.http.request<any>('DELETE', url, options).pipe(
      map(resp => {
        if (resp && resp.success) {
          console.log('[PrintfulRealTime] ✅ Orden cancelada exitosamente');
          return {
            success: true,
            message: 'Orden cancelada correctamente'
          };
        }
        return {
          success: false,
          message: resp?.message || 'Error al cancelar orden'
        };
      }),
      catchError(err => {
        const errorMsg = err.error?.message || err.message || 'Error desconocido';
        console.error('[PrintfulRealTime] ❌ Error al cancelar orden:', errorMsg);
        
        // Mensajes específicos según error de Printful
        if (errorMsg.includes('draft')) {
          return of({
            success: false,
            message: 'Solo se pueden cancelar órdenes en estado "draft"'
          });
        }
        
        return of({
          success: false,
          message: `Error: ${errorMsg}`
        });
      })
    );
  }

  /**
   * ========================================
   * 4. DETECTAR RETRASOS
   * ========================================
   * 
   * Determina si una orden está retrasada comparando
   * la fecha máxima de entrega con la fecha actual.
   * 
   * @param order Orden con campos maxDeliveryDate y printfulStatus
   * @returns boolean (true si está retrasada)
   */
  isDelayed(order: any): boolean {
    if (!order || !order.maxDeliveryDate) {
      return false;
    }

    // Si ya está fulfilled, no está retrasada
    if (order.printfulStatus === 'fulfilled') {
      return false;
    }

    const maxDate = new Date(order.maxDeliveryDate);
    const today = new Date();
    
    // Comparar solo fechas (sin hora)
    maxDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const isDelayed = today > maxDate;

    if (isDelayed) {
      const daysDelayed = Math.floor((today.getTime() - maxDate.getTime()) / (1000 * 60 * 60 * 24));
      console.warn(`[PrintfulRealTime] ⚠️ Orden #${order.id} retrasada ${daysDelayed} días`);
    }

    return isDelayed;
  }

  /**
   * ========================================
   * 5. GENERAR TIMELINE
   * ========================================
   * 
   * Genera un timeline visual del progreso de la orden.
   * Basado en el estado actual de Printful y fechas estimadas.
   * 
   * @param order Orden con campos printfulStatus, createdAt, minDeliveryDate, maxDeliveryDate
   * @param printfulData (Opcional) Datos completos de Printful con timestamps exactos
   * @returns TimelineEvent[]
   */
  generateTimeline(order: any, printfulData?: PrintfulOrderFull): TimelineEvent[] {
    const timeline: TimelineEvent[] = [];
    const status = order.printfulStatus || 'draft';

    // FASE 1: Creado
    timeline.push({
      phase: 'created',
      status: 'completed',
      label: 'Pedido Creado',
      timestamp: order.createdAt,
      description: 'Pedido recibido y registrado',
      icon: '✅',
      color: 'success'
    });

    // FASE 2: Confirmado (en Printful)
    const isConfirmed = ['pending', 'inprocess', 'fulfilled', 'partial'].includes(status);
    timeline.push({
      phase: 'confirmed',
      status: isConfirmed ? 'completed' : (status === 'draft' ? 'pending' : 'failed'),
      label: 'Confirmado en Printful',
      timestamp: printfulData?.updated ? new Date(printfulData.updated * 1000).toISOString() : null,
      description: isConfirmed ? 'Orden enviada a producción' : 'Esperando confirmación',
      icon: isConfirmed ? '✅' : '⏳',
      color: isConfirmed ? 'success' : 'warning'
    });

    // FASE 3: Producción
    const isInProduction = ['inprocess', 'fulfilled', 'partial'].includes(status);
    const isProductionPending = status === 'pending';
    timeline.push({
      phase: 'production',
      status: isInProduction ? 'completed' : (isProductionPending ? 'in-progress' : 'pending'),
      label: 'En Producción',
      timestamp: null,
      estimatedTime: isInProduction ? null : '3-5 días hábiles',
      description: isInProduction ? 'Producto impreso y empaquetado' : 'Esperando inicio de producción',
      icon: isInProduction ? '✅' : (isProductionPending ? '🔄' : '⏳'),
      color: isInProduction ? 'success' : (isProductionPending ? 'info' : 'secondary')
    });

    // FASE 4: Enviado
    const isShipped = status === 'fulfilled' || status === 'partial';
    const hasShipment = printfulData?.shipments && printfulData.shipments.length > 0;
    timeline.push({
      phase: 'shipped',
      status: isShipped ? 'completed' : 'pending',
      label: 'Enviado',
      timestamp: hasShipment ? printfulData.shipments[0].shipped_at : null,
      description: isShipped ? 'Paquete en tránsito' : 'Pendiente de envío',
      icon: isShipped ? '✅' : '⏳',
      color: isShipped ? 'success' : 'secondary'
    });

    // FASE 5: Entregado
    const minDate = order.minDeliveryDate ? new Date(order.minDeliveryDate).toLocaleDateString('es-ES') : null;
    const maxDate = order.maxDeliveryDate ? new Date(order.maxDeliveryDate).toLocaleDateString('es-ES') : null;
    const estimatedRange = (minDate && maxDate) ? `${minDate} - ${maxDate}` : null;

    timeline.push({
      phase: 'delivered',
      status: 'pending',
      label: 'Entregado',
      timestamp: null,
      estimatedTime: estimatedRange,
      description: estimatedRange ? `Entrega estimada: ${estimatedRange}` : 'Fecha de entrega pendiente',
      icon: '📦',
      color: 'secondary'
    });

    // Si está cancelada o fallida, marcar todo como failed
    if (status === 'canceled' || status === 'failed') {
      timeline.forEach(event => {
        if (event.status === 'pending') {
          event.status = 'failed';
          event.icon = '❌';
          event.color = 'danger';
        }
      });

      timeline.push({
        phase: 'failed',
        status: 'completed',
        label: status === 'canceled' ? 'Cancelado' : 'Fallido',
        timestamp: printfulData?.updated ? new Date(printfulData.updated * 1000).toISOString() : null,
        description: status === 'canceled' ? 'Orden cancelada' : 'Error en procesamiento',
        icon: '❌',
        color: 'danger'
      });
    }

    return timeline;
  }

  /**
   * ========================================
   * HELPERS PRIVADOS
   * ========================================
   */

  /**
   * Mapea respuesta de Printful API a nuestro modelo
   */
  private mapPrintfulOrder(data: any): PrintfulOrderFull {
    return {
      id: data.id?.toString() || '',
      external_id: data.external_id || '',
      status: data.status as PrintfulStatus,
      shipping: data.shipping || '',
      shipping_service_name: data.shipping_service_name || '',
      created: data.created || 0,
      updated: data.updated || 0,
      recipient: data.recipient || {},
      items: data.items || [],
      shipments: data.shipments || [],
      costs: data.costs || null,
      retail_costs: data.retail_costs || null,
      dashboard_url: data.dashboard_url || null,
      estimated_fulfillment: data.estimated_fulfillment || null
    };
  }

  /**
   * Calcula días de retraso
   */
  getDaysDelayed(order: any): number {
    if (!this.isDelayed(order)) {
      return 0;
    }

    const maxDate = new Date(order.maxDeliveryDate);
    const today = new Date();
    maxDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    return Math.floor((today.getTime() - maxDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Obtiene color según estado de Printful
   */
  getStatusColor(status: PrintfulStatus): string {
    const colorMap: Record<PrintfulStatus, string> = {
      'draft': 'warning',
      'pending': 'info',
      'failed': 'danger',
      'canceled': 'secondary',
      'onhold': 'warning',
      'inprocess': 'primary',
      'partial': 'info',
      'fulfilled': 'success'
    };

    return colorMap[status] || 'secondary';
  }

  /**
   * Traduce estado de Printful al español
   */
  translateStatus(status: PrintfulStatus): string {
    const translations: Record<PrintfulStatus, string> = {
      'draft': 'Borrador',
      'pending': 'Pendiente',
      'failed': 'Fallido',
      'canceled': 'Cancelado',
      'onhold': 'En Espera',
      'inprocess': 'En Producción',
      'partial': 'Parcial',
      'fulfilled': 'Completado'
    };

    return translations[status] || status;
  }
}
