import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CustomerContext } from '../../models/customer-context.model';
import { AdminChatService } from '../../services/admin-chat.service';
import { PrintfulRealTimeService } from '../../services/printful-realtime.service';
import { Router } from '@angular/router';

/**
 * CustomerContextPanelComponent
 * Panel lateral que muestra información contextual del cliente:
 * - Resumen general (stats, tipo de usuario)
 * - Pedidos activos con detalles
 * - Historial de devoluciones
 * 
 * FASE 2A: Integrado con PrintfulRealTimeService para tracking y delays
 */
@Component({
  selector: 'app-customer-context-panel',
  templateUrl: './customer-context-panel.component.html',
  styleUrls: ['./customer-context-panel.component.scss']
})
export class CustomerContextPanelComponent implements OnChanges, OnDestroy {
  
  @Input() context: CustomerContext | null = null;
  @Input() conversationId: number | null = null;
  @Input() conversation: any = null; // Conversación completa para enviar mensajes
  @Input() aiAssistantData: any = null; // ✅ FASE 2B: Datos del panel inteligente
  
  // ✅ FASE 2B: Outputs para comunicación con conversation-detail
  @Output() templateSelected = new EventEmitter<number>();
  @Output() templateInserted = new EventEmitter<void>();
  @Output() templateSent = new EventEmitter<void>();
  
  activeTab: 'overview' | 'orders' | 'returns' | 'tracking' | 'assistant' = 'overview';

  // FASE 2A: Control de tracking y Printful
  selectedOrderForTracking: any = null;
  loadingPrintfulData: boolean = false;
  printfulDataCache: Map<number, any> = new Map();

  private destroy$ = new Subject<void>();

  constructor(
    private chat: AdminChatService,
    private router: Router,
    private cd: ChangeDetectorRef,
    private printfulService: PrintfulRealTimeService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['context'] && changes['context'].currentValue) {
      // Reset al tab overview cuando cambia el contexto (solo si no hay intent activo)
      if (!this.hasActiveIntent()) {
        this.activeTab = 'overview';
      }
      this.selectedOrderForTracking = null;
      
      // FASE 2A: Cargar datos de Printful para órdenes activas
      this.loadPrintfulDataForOrders();
      
      this.cd.detectChanges();
    }

    // ✅ FASE 2B: Auto-abrir tab "Asistente IA" cuando llegan nuevos datos del intent
    if (changes['aiAssistantData'] && changes['aiAssistantData'].currentValue) {
      if (this.aiAssistantData && this.aiAssistantData.templates && this.aiAssistantData.templates.length > 0) {
        console.log('[CustomerContextPanel] 🤖 Intent detectado, abriendo tab Asistente IA...');
        this.activeTab = 'assistant';
        this.cd.detectChanges();
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setActiveTab(tab: 'overview' | 'orders' | 'returns' | 'tracking' | 'assistant'): void {
    console.log('[CustomerContextPanel] Cambiando tab a:', tab);
    this.activeTab = tab;
    this.cd.detectChanges();
  }

  // ✅ FASE 2B: Método para verificar si hay intent activo
  hasActiveIntent(): boolean {
    return this.aiAssistantData && this.aiAssistantData.templates && this.aiAssistantData.templates.length > 0;
  }

  // ✅ FASE 2B: Métodos del panel IA
  onTemplateSelect(index: number): void {
    this.templateSelected.emit(index);
  }

  onInsertTemplate(): void {
    this.templateInserted.emit();
  }

  onSendTemplate(): void {
    this.templateSent.emit();
  }

  getTemplateLabel(type: string): string {
    const labels: any = {
      'default': 'General',
      'tracking': 'Tracking',
      'delay': 'Retraso',
      'cancel': 'Cancelación',
      'return': 'Devolución'
    };
    return labels[type] || 'Plantilla';
  }

  isActive(tab: string): boolean {
    return this.activeTab === tab;
  }

  /**
   * Envía información del pedido al chat
   */
  sendOrderInfoToChat(order: any): void {
    console.log('[CustomerContextPanel] 📤 sendOrderInfoToChat llamado');
    console.log('[CustomerContextPanel] Order:', order);
    console.log('[CustomerContextPanel] conversation:', this.conversation);
    
    if (!order) {
      console.warn('[CustomerContextPanel] ⚠️ Order es null/undefined');
      return;
    }

    if (!this.conversation) {
      console.error('[CustomerContextPanel] ❌ conversation es null - no se puede enviar mensaje');
      return;
    }

    const message = this.buildOrderInfoMessage(order);
    console.log('[CustomerContextPanel] 📝 Mensaje construido:', message);
    
    this.chat.sendAgentMessage(this.conversation, message);
    console.log('[CustomerContextPanel] ✅ sendAgentMessage ejecutado');
    
    this.cd.detectChanges();
  }

  /**
   * Construye mensaje con información del pedido
   */
  private buildOrderInfoMessage(order: any): string {
    let message = `📦 Información de tu pedido #${order.id}:\n`;
    
    // Usar status si existe, sino usar printfulStatus
    const estado = order.status 
      ? this.translateStatus(order.status) 
      : this.translatePrintfulStatus(order.printfulStatus);
    
    message += `• Estado: ${estado}\n`;
    message += `• Monto: ${order.total || order.amount}€\n`;
    message += `• Fecha: ${this.formatDate(order.createdAt)}\n`;

    if (order.printfulOrderId) {
      message += `• Printful Order ID: ${order.printfulOrderId}\n`;
    }

    if (order.minDeliveryDate && order.maxDeliveryDate) {
      message += `• Entrega estimada: ${this.formatDate(order.minDeliveryDate)} - ${this.formatDate(order.maxDeliveryDate)}\n`;
    }

    if (order.printfulData?.trackingNumber) {
      message += `• Tracking: ${order.printfulData.trackingNumber}\n`;
    }

    return message.trim();
  }

  /**
   * Envía enlace del producto al chat
   */
  sendProductLink(product: any): void {
    if (!product) return;

    const message = `🛍️ ${product.title}\n💰 Precio: ${product.price_eur}€\n🔗 Ver producto: [enlace]`;
    this.chat.sendAgentMessage(this.conversationId, message);
  }

  /**
   * Abre el detalle de un pedido (navegación)
   */
  viewOrderDetail(orderId: number): void {
    this.router.navigate(['/sales/detail', orderId]);
  }

  /**
   * Abre el formulario de devolución
   */
  createReturn(): void {
    this.router.navigate(['/returns/create'], {
      queryParams: { email: this.context?.identifier }
    });
  }

  /**
   * Traduce estados de pedido al español
   */
  translateStatus(status: string): string {
    const translations: Record<string, string> = {
      'pending': 'Pendiente',
      'processing': 'En proceso',
      'shipped': 'Enviado',
      'delivered': 'Entregado',
      'completed': 'Completado',
      'canceled': 'Cancelado',
      'paid': 'Pagado',
      'confirmed': 'Confirmado'
    };
    return translations[status?.toLowerCase()] || status;
  }

  /**
   * Traduce estados de Printful
   */
  translatePrintfulStatus(status: string): string {
    const translations: Record<string, string> = {
      'draft': 'Borrador',
      'pending': 'Pendiente',
      'failed': 'Fallido',
      'canceled': 'Cancelado',
      'onhold': 'En espera',
      'inprocess': 'En proceso',
      'partial': 'Parcial',
      'fulfilled': 'Completado'
    };
    return translations[status?.toLowerCase()] || status;
  }

  /**
   * Formatea fechas
   */
  formatDate(date: string | Date): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  /**
   * Obtiene clase CSS según estado del pedido
   * Maneja tanto status regular como printfulStatus
   */
  getStatusClass(status: string): string {
    if (!status) return 'badge-secondary';
    
    const statusMap: Record<string, string> = {
      'pending': 'badge-warning',
      'processing': 'badge-info',
      'shipped': 'badge-primary',
      'delivered': 'badge-success',
      'completed': 'badge-success',
      'draft': 'badge-warning',
      'failed': 'badge-danger',
      'canceled': 'badge-danger',
      'onhold': 'badge-warning',
      'inprocess': 'badge-info',
      'fulfilled': 'badge-success',
      'paid': 'badge-success',
      'confirmed': 'badge-info'
    };
    return statusMap[status?.toLowerCase()] || 'badge-secondary';
  }

  /**
   * Obtiene clase CSS según estado de Printful
   */
  getPrintfulStatusClass(status: string): string {
    const statusMap: Record<string, string> = {
      'draft': 'badge-secondary',
      'pending': 'badge-warning',
      'failed': 'badge-danger',
      'canceled': 'badge-dark',
      'onhold': 'badge-warning',
      'inprocess': 'badge-info',
      'partial': 'badge-primary',
      'fulfilled': 'badge-success'
    };
    return statusMap[status?.toLowerCase()] || 'badge-secondary';
  }

  // ========================================
  // FASE 2A: Métodos de integración Printful
  // ========================================

  /**
   * Carga datos de Printful para todas las órdenes activas
   */
  private loadPrintfulDataForOrders(): void {
    if (!this.context?.activeOrders) return;

    const printfulOrders = this.context.activeOrders.filter(order => order.printfulOrderId);
    
    if (printfulOrders.length === 0) {
      console.log('[CustomerContextPanel] No hay órdenes con printfulOrderId');
      return;
    }

    console.log(`[CustomerContextPanel] 🔄 Cargando datos de Printful para ${printfulOrders.length} órdenes...`);

    // Cargar datos de cada orden (máximo 3 para no saturar)
    printfulOrders.slice(0, 3).forEach(order => {
      this.loadPrintfulDataForOrder(order);
    });
  }

  /**
   * Carga datos de Printful para una orden específica
   */
  loadPrintfulDataForOrder(order: any): void {
    if (!order?.printfulOrderId) {
      console.warn('[CustomerContextPanel] Orden sin printfulOrderId:', order?.id);
      return;
    }

    // Verificar cache
    if (this.printfulDataCache.has(order.id)) {
      console.log('[CustomerContextPanel] Usando cache para orden', order.id);
      return;
    }

    this.printfulService.getOrderStatus(order.printfulOrderId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (printfulData) => {
          if (printfulData) {
            this.printfulDataCache.set(order.id, printfulData);
            order.printfulData = printfulData;
            
            // Verificar retraso
            this.checkOrderDelay(order);
            
            console.log(`[CustomerContextPanel] ✅ Datos Printful cargados para orden #${order.id}`);
            this.cd.detectChanges();
          }
        },
        error: (err) => {
          console.error('[CustomerContextPanel] Error al cargar datos Printful:', err);
        }
      });
  }

  /**
   * Refresca datos de Printful para una orden
   */
  refreshPrintfulOrder(order: any): void {
    if (!order?.printfulOrderId) return;

    console.log(`[CustomerContextPanel] 🔄 Refrescando orden #${order.id}...`);
    this.loadingPrintfulData = true;

    this.printfulService.getOrderStatus(order.printfulOrderId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (printfulData) => {
          if (printfulData) {
            this.printfulDataCache.set(order.id, printfulData);
            order.printfulData = printfulData;
            order.printfulStatus = printfulData.status;
            
            this.checkOrderDelay(order);
            
            console.log(`[CustomerContextPanel] ✅ Orden #${order.id} refrescada`);
          }
          this.loadingPrintfulData = false;
          this.cd.detectChanges();
        },
        error: (err) => {
          console.error('[CustomerContextPanel] Error al refrescar:', err);
          this.loadingPrintfulData = false;
          this.cd.detectChanges();
        }
      });
  }

  /**
   * Verifica si una orden está retrasada
   */
  checkOrderDelay(order: any): void {
    if (!order) return;

    order.isDelayed = this.printfulService.isDelayed(order);
    
    if (order.isDelayed) {
      order.daysDelayed = this.printfulService.getDaysDelayed(order);
      console.warn(`[CustomerContextPanel] ⚠️ Orden #${order.id} retrasada ${order.daysDelayed} días`);
    }
  }

  /**
   * Verifica si una orden está retrasada (método público)
   */
  isOrderDelayed(order: any): boolean {
    if (!order) return false;
    
    // Si ya fue calculado, usar valor cacheado
    if (order.isDelayed !== undefined) {
      return order.isDelayed;
    }
    
    // Calcular y cachear
    order.isDelayed = this.printfulService.isDelayed(order);
    if (order.isDelayed) {
      order.daysDelayed = this.printfulService.getDaysDelayed(order);
    }
    
    return order.isDelayed;
  }

  /**
   * Obtiene días de retraso de una orden
   */
  getDaysDelayed(order: any): number {
    if (!order) return 0;
    return order.daysDelayed || this.printfulService.getDaysDelayed(order);
  }

  /**
   * Abre tab de tracking para una orden específica
   */
  openTrackingTab(order: any): void {
    if (!order?.printfulOrderId) {
      console.warn('[CustomerContextPanel] Orden sin printfulOrderId');
      return;
    }

    console.log('[CustomerContextPanel] Abriendo tracking para orden', order.id);
    this.selectedOrderForTracking = order;
    this.setActiveTab('tracking');
  }

  /**
   * Verifica si una orden tiene tracking disponible
   */
  hasTracking(order: any): boolean {
    return !!(order?.printfulData?.shipments && order.printfulData.shipments.length > 0);
  }

  /**
   * Verifica si la tab de tracking debe mostrarse
   */
  shouldShowTrackingTab(): boolean {
    return !!this.selectedOrderForTracking?.printfulOrderId;
  }

  /**
   * Abre tracking externo en nueva pestaña
   */
  openExternalTracking(order: any): void {
    if (!order?.printfulOrderId) return;

    this.printfulService.getTracking(order.printfulOrderId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tracking) => {
          if (tracking?.trackingUrl) {
            window.open(tracking.trackingUrl, '_blank');
            console.log('[CustomerContextPanel] Abriendo tracking externo');
          } else {
            console.warn('[CustomerContextPanel] No hay URL de tracking disponible');
          }
        },
        error: (err) => {
          console.error('[CustomerContextPanel] Error al obtener tracking:', err);
        }
      });
  }

  /**
   * Verifica si una orden es de Printful
   */
  isPrintfulOrder(order: any): boolean {
    return !!order?.printfulOrderId;
  }

  /**
   * Obtiene el estado traducido de Printful
   */
  getPrintfulStatusLabel(status: string): string {
    return this.printfulService.translateStatus(status as any);
  }

  /**
   * Callback cuando se refresca desde TrackingTabComponent
   */
  onTrackingRefresh(): void {
    if (this.selectedOrderForTracking) {
      this.refreshPrintfulOrder(this.selectedOrderForTracking);
    }
  }
}
