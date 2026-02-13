import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import {
  SaasTrackingEventsService,
  TrackingEvent,
  TrackingEventsFilters
} from '../_services/saas-tracking-events.service';
import { environment } from '../../../../environments/environment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-tracking-events',
  templateUrl: './tracking-events.component.html',
  styleUrls: ['./tracking-events.component.scss']
})
export class TrackingEventsComponent implements OnInit {
  
  // Environment
  isProduction = environment.production;
  
  // Data
  events: TrackingEvent[] = [];
  isLoading = false;
  error: string | null = null;
  
  // Paginación
  currentPage = 1;
  totalPages = 1;
  totalEvents = 0;
  limit = 50;
  
  // Filtros
  filters: TrackingEventsFilters = {
    page: 1,
    limit: 50
  };
  
  // Opciones de filtro
  availableModules: string[] = [];
  availableEvents: string[] = [];
  
  // UI State
  expandedEventId: number | null = null;
  isExporting = false;
  
  constructor(
    private trackingService: SaasTrackingEventsService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadFilterOptions();
    this.loadEvents();
  }

  /**
   * Cargar opciones de filtros
   */
  loadFilterOptions(): void {
    // Cargar módulos únicos
    this.trackingService.getUniqueModules().subscribe({
      next: (response) => {
        if (response.success) {
          this.availableModules = response.modules;
          this.cd.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error loading modules:', err);
      }
    });

    // Cargar eventos únicos
    this.trackingService.getUniqueEvents().subscribe({
      next: (response) => {
        if (response.success) {
          this.availableEvents = response.events;
          this.cd.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error loading events:', err);
      }
    });
  }

  /**
   * Cargar eventos con filtros actuales
   */
  loadEvents(): void {
    this.isLoading = true;
    this.error = null;
    
    this.filters.page = this.currentPage;
    this.filters.limit = this.limit;

    this.trackingService.getTrackingEvents(this.filters).subscribe({
      next: (response) => {
        if (response.success) {
          this.events = response.events;
          this.totalEvents = response.total;
          this.totalPages = response.totalPages;
          this.currentPage = response.page;
        }
        this.isLoading = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error loading events:', err);
        this.error = 'Error al cargar los eventos. Por favor intenta nuevamente.';
        this.isLoading = false;
        this.cd.detectChanges();
      }
    });
  }

  /**
   * Aplicar filtros
   */
  applyFilters(): void {
    this.currentPage = 1;
    this.loadEvents();
  }

  /**
   * Limpiar filtros
   */
  clearFilters(): void {
    this.filters = {
      page: 1,
      limit: 50
    };
    this.currentPage = 1;
    this.loadEvents();
  }

  /**
   * Cambiar página
   */
  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadEvents();
    }
  }

  /**
   * Toggle expandir/colapsar JSON de properties
   */
  toggleExpand(eventId: number): void {
    this.expandedEventId = this.expandedEventId === eventId ? null : eventId;
  }

  /**
   * Verificar si un evento está expandido
   */
  isExpanded(eventId: number): boolean {
    return this.expandedEventId === eventId;
  }

  /**
   * Formatear properties como JSON legible
   */
  formatProperties(properties: any): string {
    try {
      return JSON.stringify(properties, null, 2);
    } catch (e) {
      return String(properties);
    }
  }

  /**
   * Obtener snippet corto de properties
   */
  getPropertiesSnippet(properties: any): string {
    try {
      const json = JSON.stringify(properties);
      return json.length > 100 ? json.substring(0, 100) + '...' : json;
    } catch (e) {
      return String(properties);
    }
  }

  /**
   * Exportar a CSV
   */
  exportToCSV(): void {
    this.isExporting = true;
    
    this.trackingService.exportToCSV(this.filters).subscribe({
      next: (blob) => {
        // Crear enlace de descarga
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Nombre del archivo con fecha
        const date = new Date().toISOString().split('T')[0];
        link.download = `tracking-events-${date}.csv`;
        
        link.click();
        window.URL.revokeObjectURL(url);
        
        this.isExporting = false;
      },
      error: (err) => {
        console.error('Error exporting CSV:', err);
        this.error = 'Error al exportar CSV. Por favor intenta nuevamente.';
        this.isExporting = false;
      }
    });
  }

  /**
   * Obtener rango de páginas para paginación
   */
  getPageRange(): number[] {
    const range: number[] = [];
    const maxPagesToShow = 5;
    
    let start = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let end = Math.min(this.totalPages, start + maxPagesToShow - 1);
    
    // Ajustar start si estamos cerca del final
    if (end - start < maxPagesToShow - 1) {
      start = Math.max(1, end - maxPagesToShow + 1);
    }
    
    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    
    return range;
  }

  /**
   * Formatear fecha
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  /**
   * Copiar session_id al clipboard
   */
  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      // Mostrar feedback visual (opcional)
      console.log('Copied to clipboard:', text);
    }).catch(err => {
      console.error('Error copying to clipboard:', err);
    });
  }

  /**
   * Limpiar eventos de tests internos (source='admin')
   * ⚠️ Solo disponible en development para limpiar pruebas
   * NO afecta eventos públicos (source='preview')
   */
  async clearAdminEvents(): Promise<void> {
    // Modal de confirmación profesional con SweetAlert2
    const result = await Swal.fire({
      title: '🧹 Limpiar Tests Internos',
      html: `
        <div class="text-start">
          <p class="mb-3">
            Estás a punto de <strong>eliminar TODOS los eventos</strong> con <code>source="admin"</code>.
          </p>
          
          <div class="alert alert-warning" style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 12px; margin-bottom: 15px;">
            <div style="display: flex; align-items: start;">
              <i class="fas fa-shield-alt" style="color: #ff9800; margin-right: 10px; margin-top: 2px;"></i>
              <div>
                <strong>Protección de datos públicos:</strong>
                <ul style="margin: 8px 0 0 0; padding-left: 20px; font-size: 13px;">
                  <li>Los eventos con <code>source="preview"</code> permanecerán <strong>intactos</strong></li>
                  <li>Solo se eliminarán tus pruebas internas del Admin Panel</li>
                  <li>Las métricas de usuarios reales NO serán afectadas</li>
                </ul>
              </div>
            </div>
          </div>

          <p class="text-muted" style="font-size: 13px;">
            <i class="fas fa-info-circle"></i>
            Esta acción es útil para limpiar eventos de prueba antes de lanzar un MVP al público.
          </p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '<i class="fas fa-broom me-1"></i> Sí, limpiar tests',
      cancelButtonText: '<i class="fas fa-times me-1"></i> Cancelar',
      confirmButtonColor: '#ff9800',
      cancelButtonColor: '#6c757d',
      width: '550px',
      customClass: {
        confirmButton: 'btn btn-warning',
        cancelButton: 'btn btn-secondary'
      }
    });
    
    if (!result.isConfirmed) {
      return;
    }

    this.isLoading = true;
    this.error = null;
    
    this.trackingService.deleteEventsBySource('admin').subscribe({
      next: (response) => {
        if (response.success) {
          // Modal de éxito
          Swal.fire({
            title: '✅ Tests Limpiados',
            html: `
              <div class="text-center">
                <p class="mb-2">
                  Se eliminaron <strong>${response.deleted} eventos</strong> de tests internos.
                </p>
                <p class="text-muted" style="font-size: 13px;">
                  Los datos de usuarios reales (source="preview") permanecen seguros.
                </p>
              </div>
            `,
            icon: 'success',
            timer: 3000,
            showConfirmButton: false,
            timerProgressBar: true
          });
          this.loadEvents(); // Recargar lista
        } else {
          this.error = 'No se pudieron eliminar los eventos';
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error('❌ Error deleting admin events:', err);
        
        // Modal de error
        Swal.fire({
          title: '❌ Error',
          html: `
            <p>No se pudieron eliminar los eventos de tests internos.</p>
            <p class="text-muted" style="font-size: 13px;">
              ${err.error?.message || 'Por favor intenta nuevamente.'}
            </p>
          `,
          icon: 'error',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#dc3545'
        });
        
        this.error = 'Error al eliminar eventos. Por favor intenta nuevamente.';
        this.isLoading = false;
        this.cd.detectChanges();
      }
    });
  }
}
