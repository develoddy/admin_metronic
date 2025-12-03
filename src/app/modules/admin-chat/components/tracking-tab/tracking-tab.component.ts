import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PrintfulRealTimeService } from '../../services/printful-realtime.service';
import { PrintfulOrderFull, TimelineEvent } from '../../models/customer-context.model';

/**
 * TrackingTabComponent
 * 
 * Pestaña de tracking para órdenes de Printful
 * Muestra tracking number, estado actual, timeline y botones de acción
 * 
 * FASE 2A - Sprint 2.2
 */
@Component({
  selector: 'app-tracking-tab',
  templateUrl: './tracking-tab.component.html',
  styleUrls: ['./tracking-tab.component.scss']
})
export class TrackingTabComponent implements OnInit, OnDestroy {

  @Input() orderId!: number;
  @Input() printfulOrderId?: string;
  @Output() onRefresh = new EventEmitter<void>();

  // Estado del componente
  loading: boolean = false;
  error: string | null = null;
  
  // Datos de Printful
  printfulOrder: PrintfulOrderFull | null = null;
  timeline: TimelineEvent[] = [];
  
  // Control de tracking
  trackingNumber: string | null = null;
  trackingUrl: string | null = null;
  carrier: string | null = null;
  currentStatus: string = '';
  statusColor: string = 'secondary';
  
  // Retrasos
  isDelayed: boolean = false;
  daysDelayed: number = 0;

  private destroy$ = new Subject<void>();

  constructor(private printfulService: PrintfulRealTimeService) {}

  ngOnInit(): void {
    if (!this.orderId) {
      this.error = 'No se proporcionó orderId';
      return;
    }

    this.loadTrackingData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga datos de tracking desde Printful API
   */
  loadTrackingData(): void {
    if (!this.printfulOrderId) {
      this.error = 'Esta orden no tiene ID de Printful asociado';
      return;
    }

    this.loading = true;
    this.error = null;

    console.log(`[TrackingTab] Cargando tracking para orden #${this.orderId} (Printful: ${this.printfulOrderId})`);

    // Obtener estado de orden completo
    this.printfulService.getOrderStatus(this.printfulOrderId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (order) => {
          if (order) {
            this.printfulOrder = order;
            this.processOrderData(order);
            this.loadShipmentTracking();
          } else {
            this.error = 'No se pudo obtener información de la orden';
          }
          this.loading = false;
        },
        error: (err) => {
          console.error('[TrackingTab] Error al cargar orden:', err);
          this.error = 'Error al consultar Printful API';
          this.loading = false;
        }
      });
  }

  /**
   * Procesa datos de la orden de Printful
   */
  private processOrderData(order: PrintfulOrderFull): void {
    // Estado actual
    this.currentStatus = this.printfulService.translateStatus(order.status);
    this.statusColor = this.printfulService.getStatusColor(order.status);

    // Generar timeline
    this.timeline = this.printfulService.generateTimeline({ 
      printfulStatus: order.status,
      createdAt: new Date(order.created * 1000).toISOString(),
      minDeliveryDate: null,
      maxDeliveryDate: null
    }, order);

    console.log('[TrackingTab] Timeline generado:', this.timeline.length, 'eventos');
  }

  /**
   * Carga información de tracking del envío
   */
  private loadShipmentTracking(): void {
    if (!this.printfulOrderId) return;

    this.printfulService.getTracking(this.printfulOrderId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tracking) => {
          if (tracking) {
            this.trackingNumber = tracking.trackingNumber;
            this.trackingUrl = tracking.trackingUrl;
            this.carrier = tracking.carrier;
            console.log('[TrackingTab] Tracking obtenido:', this.trackingNumber);
          } else {
            console.log('[TrackingTab] Sin información de tracking disponible');
          }
        },
        error: (err) => {
          console.error('[TrackingTab] Error al obtener tracking:', err);
        }
      });
  }

  /**
   * Verifica si hay retraso
   */
  checkDelay(order: any): void {
    this.isDelayed = this.printfulService.isDelayed(order);
    if (this.isDelayed) {
      this.daysDelayed = this.printfulService.getDaysDelayed(order);
      console.warn('[TrackingTab] ⚠️ Orden retrasada:', this.daysDelayed, 'días');
    }
  }

  /**
   * Refresca el estado de la orden
   */
  refreshStatus(): void {
    console.log('[TrackingTab] 🔄 Refrescando estado...');
    this.loadTrackingData();
    this.onRefresh.emit();
  }

  /**
   * Abre tracking en sitio externo
   */
  openExternalTracking(): void {
    if (this.trackingUrl) {
      window.open(this.trackingUrl, '_blank');
      console.log('[TrackingTab] Abriendo tracking externo:', this.trackingUrl);
    } else {
      console.warn('[TrackingTab] No hay URL de tracking disponible');
    }
  }

  /**
   * Obtiene icono según fase del timeline
   */
  getPhaseIcon(phase: string): string {
    const icons: Record<string, string> = {
      'created': '✅',
      'confirmed': '✅',
      'production': '🔄',
      'shipped': '📦',
      'delivered': '🏠',
      'failed': '❌'
    };
    return icons[phase] || '⏳';
  }

  /**
   * Obtiene color según estado del timeline
   */
  getEventColor(status: 'completed' | 'in-progress' | 'pending' | 'failed'): string {
    const colors: Record<string, string> = {
      'completed': 'success',
      'in-progress': 'primary',
      'pending': 'secondary',
      'failed': 'danger'
    };
    return colors[status] || 'secondary';
  }

  /**
   * Formatea timestamp a fecha legible
   */
  formatDate(timestamp: string | null): string {
    if (!timestamp) return 'Pendiente';
    
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Fecha inválida';
    }
  }

  /**
   * Verifica si hay tracking disponible
   */
  hasTracking(): boolean {
    return !!this.trackingNumber && !!this.trackingUrl;
  }

  /**
   * Verifica si la orden está en tránsito
   */
  isInTransit(): boolean {
    return this.printfulOrder?.status === 'fulfilled' || this.printfulOrder?.status === 'partial';
  }

  /**
   * Obtiene mensaje de estado amigable
   */
  getStatusMessage(): string {
    if (!this.printfulOrder) return 'Cargando...';

    const status = this.printfulOrder.status;
    const messages: Record<string, string> = {
      'draft': 'Orden creada, esperando confirmación',
      'pending': 'Orden confirmada, en cola de producción',
      'failed': 'Error en procesamiento de la orden',
      'canceled': 'Orden cancelada',
      'onhold': 'Orden en espera (revisar con soporte)',
      'inprocess': 'Tu producto está siendo impreso',
      'partial': 'Envío parcial en tránsito',
      'fulfilled': 'Orden completada y enviada'
    };

    return messages[status] || 'Estado desconocido';
  }
}
