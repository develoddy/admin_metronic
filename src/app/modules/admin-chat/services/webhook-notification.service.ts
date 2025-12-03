import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { Toaster } from 'ngx-toast-notifications';
import { AdminChatService } from './admin-chat.service';

/**
 * WebhookNotificationService
 * 
 * Escucha eventos de webhooks de Printful en tiempo real
 * y notifica al admin sobre cambios importantes.
 * 
 * FASE 2B - Sprint 2
 */

export interface PrintfulWebhookEvent {
  type: 'order_created' | 'order_updated' | 'package_shipped' | 'package_returned' | 'order_failed' | 'order_canceled';
  orderId: number;
  printfulOrderId: string;
  data: any;
  timestamp: string;
}

export interface OrderUpdateNotification {
  orderId: number;
  printfulOrderId: string;
  previousStatus: string;
  newStatus: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

@Injectable({
  providedIn: 'root'
})
export class WebhookNotificationService {

  // Subjects para emitir eventos
  private orderUpdated$ = new Subject<OrderUpdateNotification>();
  private packageShipped$ = new Subject<PrintfulWebhookEvent>();
  private orderFailed$ = new Subject<PrintfulWebhookEvent>();
  private orderCanceled$ = new Subject<PrintfulWebhookEvent>();

  // Estado
  private isListening = false;
  private notificationsEnabled = true;

  private socket: any;

  constructor(
    private chat: AdminChatService,
    private toaster: Toaster
  ) {
    console.log('[WebhookNotification] Servicio inicializado');
    // @ts-ignore
    this.socket = (this.chat as any).socket;
  }

  /**
   * Inicia escucha de webhooks de Printful
   */
  startListening(): void {
    if (this.isListening) {
      console.warn('[WebhookNotification] Ya está escuchando eventos');
      return;
    }

    console.log('[WebhookNotification] 🎧 Iniciando escucha de webhooks Printful...');

    // Obtener socket actualizado
    // @ts-ignore
    this.socket = (this.chat as any).socket;

    if (!this.socket) {
      console.error('[WebhookNotification] ❌ Socket no disponible');
      return;
    }

    this.listenToOrderUpdates();
    this.listenToShipmentEvents();
    this.listenToFailedOrders();
    this.listenToCanceledOrders();

    this.isListening = true;
  }

  /**
   * Detiene escucha de webhooks
   */
  stopListening(): void {
    console.log('[WebhookNotification] 🔇 Deteniendo escucha de webhooks...');
    
    this.socket.removeListener('printful:order:updated');
    this.socket.removeListener('printful:package:shipped');
    this.socket.removeListener('printful:order:failed');
    this.socket.removeListener('printful:order:canceled');

    this.isListening = false;
  }

  /**
   * Escucha actualizaciones de órdenes
   */
  private listenToOrderUpdates(): void {
    this.socket.on('printful:update', (event: any) => {
      console.log('[WebhookNotification] 📦 Printful update recibido:', event);

      const notification: OrderUpdateNotification = {
        orderId: event.orderId,
        printfulOrderId: event.printfulOrderId,
        previousStatus: event.previousStatus || 'unknown',
        newStatus: event.newStatus || event.status,
        message: this.buildUpdateMessage(event),
        priority: this.calculatePriority(event.newStatus || event.status)
      };

      this.orderUpdated$.next(notification);
      this.notifyAdmin(notification);

      // Emitir para insertar mensaje system en conversación
      this.insertSystemMessage({
        sender: 'system',
        label: 'Actualización Printful',
        message: `📦 Printful actualizó el pedido #${event.orderId}: ${this.translatePrintfulStatus(event.newStatus || event.status)}`,
        meta: {
          type: 'printful_update',
          saleId: event.orderId,
          printfulOrderId: event.printfulOrderId,
          printfulStatus: event.newStatus || event.status,
          trackingNumber: event.trackingNumber
        }
      });
    });
  }

  /**
   * Escucha eventos de envío de paquetes
   */
  private listenToShipmentEvents(): void {
    this.socket.on('printful:tracking_update', (event: any) => {
      console.log('[WebhookNotification] 📬 Tracking update recibido:', event);

      const webhookEvent: PrintfulWebhookEvent = {
        type: 'package_shipped',
        orderId: event.orderId,
        printfulOrderId: event.printfulOrderId,
        data: event,
        timestamp: new Date().toISOString()
      };

      this.packageShipped$.next(webhookEvent);
      
      if (this.notificationsEnabled) {
        this.toaster.open({
          text: `📬 Pedido #${event.orderId} enviado. Tracking: ${event.trackingNumber || 'N/A'}`,
          type: 'success',
          duration: 5000
        });
      }

      // Insertar mensaje system
      this.insertSystemMessage({
        sender: 'system',
        label: 'Envío Despachado',
        message: `🚚 El pedido #${event.orderId} ha sido despachado. Tracking: ${event.trackingNumber || 'N/A'}`,
        meta: {
          type: 'tracking_update',
          saleId: event.orderId,
          printfulOrderId: event.printfulOrderId,
          trackingNumber: event.trackingNumber,
          carrier: event.carrier,
          trackingUrl: event.trackingUrl
        }
      });
    });
  }

  /**
   * Escucha órdenes con retraso
   */
  private listenToFailedOrders(): void {
    this.socket.on('printful:delay', (event: any) => {
      console.warn('[WebhookNotification] ⚠️ Retraso detectado:', event);

      const webhookEvent: PrintfulWebhookEvent = {
        type: 'order_failed',
        orderId: event.orderId,
        printfulOrderId: event.printfulOrderId,
        data: event,
        timestamp: new Date().toISOString()
      };

      this.orderFailed$.next(webhookEvent);
      
      if (this.notificationsEnabled) {
        this.toaster.open({
          text: `⚠️ RETRASO: Pedido #${event.orderId} lleva ${event.daysDelayed || 0} días de retraso.`,
          type: 'warning',
          duration: 8000
        });
      }

      // Insertar mensaje system
      this.insertSystemMessage({
        sender: 'system',
        label: 'Retraso Detectado',
        message: `⚠️ El pedido #${event.orderId} presenta un retraso de ${event.daysDelayed || 0} días. Se requiere atención.`,
        meta: {
          type: 'delay_alert',
          saleId: event.orderId,
          printfulOrderId: event.printfulOrderId,
          daysDelayed: event.daysDelayed,
          expectedDate: event.expectedDate
        }
      });
    });
  }

  /**
   * Escucha órdenes canceladas
   */
  private listenToCanceledOrders(): void {
    // Podría escuchar eventos de cancelación si el backend los emite
    console.log('[WebhookNotification] Listener para cancelaciones no implementado');
  }

  /**
   * Notifica al admin sobre cambios importantes
   */
  private notifyAdmin(notification: OrderUpdateNotification): void {
    if (!this.notificationsEnabled) return;

    const priorityConfig = {
      low: { type: 'info', duration: 3000 },
      medium: { type: 'info', duration: 5000 },
      high: { type: 'warning', duration: 7000 },
      critical: { type: 'danger', duration: 10000 }
    };

    const config = priorityConfig[notification.priority];

    this.toaster.open({
      text: notification.message,
      type: config.type as any,
      duration: config.duration
    });
  }

  /**
   * Construye mensaje legible para notificación
   */
  private buildUpdateMessage(data: any): string {
    const statusMessages: Record<string, string> = {
      'draft': `📝 Pedido #${data.orderId} creado en Printful`,
      'pending': `⏳ Pedido #${data.orderId} confirmado, esperando producción`,
      'inprocess': `🖨️ Pedido #${data.orderId} en producción`,
      'fulfilled': `✅ Pedido #${data.orderId} completado y enviado`,
      'partial': `📦 Pedido #${data.orderId} enviado parcialmente`,
      'failed': `❌ ERROR: Pedido #${data.orderId} falló`,
      'canceled': `✖️ Pedido #${data.orderId} cancelado`,
      'onhold': `⚠️ Pedido #${data.orderId} en espera (revisar)`
    };

    return statusMessages[data.newStatus] || `🔄 Pedido #${data.orderId} actualizado: ${data.newStatus}`;
  }

  /**
   * Calcula prioridad de notificación
   */
  private calculatePriority(status: string): 'low' | 'medium' | 'high' | 'critical' {
    const priorities: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
      'draft': 'low',
      'pending': 'low',
      'inprocess': 'medium',
      'fulfilled': 'medium',
      'partial': 'high',
      'failed': 'critical',
      'canceled': 'high',
      'onhold': 'high'
    };

    return priorities[status] || 'medium';
  }

  /**
   * Traduce estado de Printful a español
   */
  private translatePrintfulStatus(status: string): string {
    const translations: Record<string, string> = {
      'draft': 'Borrador',
      'pending': 'Pendiente',
      'inprocess': 'En producción',
      'fulfilled': 'Completado',
      'partial': 'Parcialmente enviado',
      'failed': 'Fallido',
      'canceled': 'Cancelado',
      'onhold': 'En espera'
    };
    return translations[status] || status;
  }

  /**
   * Inserta mensaje system en la conversación actual (si está abierta)
   */
  private insertSystemMessage(message: any): void {
    // Este método se comunica con AdminChatService para insertar el mensaje
    // en la conversación abierta del cliente afectado
    console.log('[WebhookNotification] 💬 Insertando mensaje system:', message);
    
    // Emitir evento para que ConversationDetail lo capture
    this.chat.updateOrderInRealTime(message.meta.saleId, {
      systemMessage: message
    });
  }

  // ========================================
  // Observables públicos
  // ========================================

  /**
   * Observable para cambios en órdenes
   */
  onOrderUpdated(): Observable<OrderUpdateNotification> {
    return this.orderUpdated$.asObservable();
  }

  /**
   * Observable para paquetes enviados
   */
  onPackageShipped(): Observable<PrintfulWebhookEvent> {
    return this.packageShipped$.asObservable();
  }

  /**
   * Observable para órdenes fallidas
   */
  onOrderFailed(): Observable<PrintfulWebhookEvent> {
    return this.orderFailed$.asObservable();
  }

  /**
   * Observable para órdenes canceladas
   */
  onOrderCanceled(): Observable<PrintfulWebhookEvent> {
    return this.orderCanceled$.asObservable();
  }

  // ========================================
  // Configuración
  // ========================================

  /**
   * Habilita/deshabilita notificaciones toast
   */
  setNotificationsEnabled(enabled: boolean): void {
    this.notificationsEnabled = enabled;
    console.log(`[WebhookNotification] Notificaciones ${enabled ? 'activadas' : 'desactivadas'}`);
  }

  /**
   * Verifica si está escuchando
   */
  isCurrentlyListening(): boolean {
    return this.isListening;
  }

  /**
   * Obtiene estado de notificaciones
   */
  areNotificationsEnabled(): boolean {
    return this.notificationsEnabled;
  }
}
