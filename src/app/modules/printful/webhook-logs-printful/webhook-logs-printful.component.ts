import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { WebhookPrintfulService } from '../webhook-printful.service';

declare var $: any;

interface WebhookLog {
  id: number;
  event_type: string;
  order_id: string | null;
  event_data: any;
  processed: boolean;
  processing_error: string | null;
  received_at: string;
}

interface WebhookStats {
  event_type: string;
  total: number;
  processed: number;
  failed: number;
}

@Component({
  selector: 'app-webhook-logs-printful',
  templateUrl: './webhook-logs-printful.component.html',
  styleUrls: ['./webhook-logs-printful.component.scss']
})
export class WebhookLogsPrintfulComponent implements OnInit {

  // Logs
  logs: WebhookLog[] = [];
  filteredLogs: WebhookLog[] = [];
  isLoadingLogs: boolean = false;

  // Stats
  stats: WebhookStats[] = [];
  isLoadingStats: boolean = false;
  totalWebhooks: number = 0;
  totalProcessed: number = 0;
  totalFailed: number = 0;
  successRate: number = 0;

  // Filtros
  selectedEventType: string = '';
  selectedProcessedStatus: string = '';
  searchOrderId: string = '';
  eventTypes: string[] = [];

  // Modal
  selectedLog: WebhookLog | null = null;
  selectedLogJson: string = '';

  constructor(
    public webhookService: WebhookPrintfulService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.eventTypes = this.webhookService.getEventTypes();
    this.loadStats();
    this.loadLogs();
  }

  /**
   * Carga las estadísticas de webhooks
   */
  loadStats(): void {
    this.isLoadingStats = true;
    this.webhookService.getWebhookStats().subscribe({
      next: (resp: any) => {
        if (resp.success) {
          this.stats = resp.stats || [];
          this.calculateTotals();
        }
        this.isLoadingStats = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar estadísticas:', error);
        this.stats = [];
        this.isLoadingStats = false;
        this.cdr.detectChanges();
        this.showToast('Error al cargar estadísticas', 'error');
      }
    });
  }

  /**
   * Calcula los totales generales
   */
  calculateTotals(): void {
    this.totalWebhooks = this.stats.reduce((sum, stat) => sum + stat.total, 0);
    this.totalProcessed = this.stats.reduce((sum, stat) => sum + stat.processed, 0);
    this.totalFailed = this.stats.reduce((sum, stat) => sum + stat.failed, 0);
    this.successRate = this.totalWebhooks > 0 
      ? Math.round((this.totalProcessed / this.totalWebhooks) * 100) 
      : 0;
  }

  /**
   * Actualizar todos los datos (stats + logs)
   */
  refreshAllData(): void {
    this.loadStats();
    this.loadLogs();
  }

  /**
   * Carga los logs de webhooks
   */
  loadLogs(): void {
    this.isLoadingLogs = true;

    const filters: any = { limit: 100 };
    if (this.selectedEventType) filters.event_type = this.selectedEventType;
    if (this.selectedProcessedStatus) filters.processed = this.selectedProcessedStatus === 'true';

    this.webhookService.getWebhookLogs(filters).subscribe({
      next: (resp: any) => {
        if (resp.success) {
          this.logs = resp.logs || [];
          this.applySearchFilter();
        }
        this.isLoadingLogs = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar logs:', error);
        this.logs = [];
        this.filteredLogs = [];
        this.isLoadingLogs = false;
        this.cdr.detectChanges();
        this.showToast('Error al cargar logs', 'error');
      }
    });
  }

  /**
   * Aplica el filtro de búsqueda por order_id
   */
  applySearchFilter(): void {
    if (!this.searchOrderId.trim()) {
      this.filteredLogs = this.logs;
    } else {
      const search = this.searchOrderId.toLowerCase();
      this.filteredLogs = this.logs.filter(log => 
        log.order_id && log.order_id.toLowerCase().includes(search)
      );
    }
  }

  /**
   * Evento cuando cambia el filtro de tipo de evento
   */
  onEventTypeChange(): void {
    this.loadLogs();
  }

  /**
   * Evento cuando cambia el filtro de estado procesado
   */
  onProcessedStatusChange(): void {
    this.loadLogs();
  }

  /**
   * Evento cuando cambia el campo de búsqueda
   */
  onSearchChange(): void {
    this.applySearchFilter();
  }

  /**
   * Resetea todos los filtros
   */
  resetFilters(): void {
    this.selectedEventType = '';
    this.selectedProcessedStatus = '';
    this.searchOrderId = '';
    this.loadLogs();
  }

  /**
   * Abre el modal con el JSON del evento
   */
  viewEventData(log: WebhookLog): void {
    this.selectedLog = log;
    this.selectedLogJson = JSON.stringify(log.event_data, null, 2);
    $('#webhookJsonModal').modal('show');
  }

  /**
   * Copia el JSON al portapapeles
   */
  copyJsonToClipboard(): void {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      // Método moderno (funciona en HTTPS y localhost)
      navigator.clipboard.writeText(this.selectedLogJson)
        .then(() => {
          this.showToast('JSON copiado al portapapeles', 'success');
        })
        .catch(err => {
          console.error('Error al copiar:', err);
          this.fallbackCopyToClipboard();
        });
    } else {
      // Fallback para navegadores antiguos
      this.fallbackCopyToClipboard();
    }
  }

  /**
   * Método fallback para copiar al portapapeles
   */
  private fallbackCopyToClipboard(): void {
    const textArea = document.createElement('textarea');
    textArea.value = this.selectedLogJson;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        this.showToast('JSON copiado al portapapeles', 'success');
      } else {
        this.showToast('No se pudo copiar el JSON', 'error');
      }
    } catch (err) {
      console.error('Error al copiar:', err);
      this.showToast('Error al copiar el JSON', 'error');
    }
    
    document.body.removeChild(textArea);
  }

  /**
   * Cierra el modal de detalles
   */
  closeModal(): void {
    $('#webhookJsonModal').modal('hide');
    this.selectedLog = null;
    this.selectedLogJson = '';
  }

  /**
   * Obtiene el nombre formateado del evento
   */
  getEventName(eventType: string): string {
    return this.webhookService.formatEventType(eventType);
  }

  /**
   * Obtiene el color del badge para el evento
   */
  getEventBadgeColor(eventType: string): string {
    return this.webhookService.getEventBadgeColor(eventType);
  }

  /**
   * Formatea la fecha
   */
  formatDate(date: string): string {
    return this.webhookService.formatDate(date);
  }

  /**
   * Muestra un toast de notificación
   */
  showToast(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    const iconMap = {
      success: 'fa-check-circle',
      error: 'fa-exclamation-circle',
      warning: 'fa-exclamation-triangle',
      info: 'fa-info-circle'
    };

    const bgMap = {
      success: 'bg-success',
      error: 'bg-danger',
      warning: 'bg-warning',
      info: 'bg-info'
    };

    const toast = `
      <div class="toast-notification ${bgMap[type]}" style="position: fixed; top: 80px; right: 20px; z-index: 9999; min-width: 300px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); animation: slideInRight 0.3s ease-out;">
        <div style="display: flex; align-items: center; padding: 15px; color: white;">
          <i class="fas ${iconMap[type]} me-3" style="font-size: 20px;"></i>
          <span style="flex: 1; font-weight: 500;">${message}</span>
          <button onclick="this.closest('.toast-notification').remove()" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer; padding: 0; margin-left: 10px;">&times;</button>
        </div>
      </div>
    `;

    $('body').append(toast);

    setTimeout(() => {
      $('.toast-notification').fadeOut(300, function() {
        $(this).remove();
      });
    }, 5000);
  }
}
