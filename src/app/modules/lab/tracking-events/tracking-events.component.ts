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
   * 🆕 Obtener campaign desde properties
   */
  getCampaign(event: TrackingEvent): string | null {
    try {
      return event.properties?.campaign || null;
    } catch (e) {
      return null;
    }
  }

  /**
   * 🆕 Obtener medium desde properties
   */
  getMedium(event: TrackingEvent): string | null {
    try {
      return event.properties?.medium || null;
    } catch (e) {
      return null;
    }
  }

  /**
   * 🆕 Obtener is_internal_access desde properties
   */
  getInternalAccess(event: TrackingEvent): boolean | null {
    try {
      return event.properties?.is_internal_access ?? null;
    } catch (e) {
      return null;
    }
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
   * 🆕 Limpiar eventos de tests internos (is_internal_access=true)
   * Sistema UTM tracking - Protege eventos públicos (is_internal_access=false)
   * ⚠️ Solo disponible en development para limpiar pruebas antes de lanzar MVP
   */
  async clearAdminEvents(): Promise<void> {
    // Modal de confirmación profesional con SweetAlert2
    const result = await Swal.fire({
      title: '🧹 Limpiar Tests Internos',
      html: `
        <div class="text-start">
          <p class="mb-3">
            Estás a punto de <strong>eliminar TODOS los eventos</strong> con <code>is_internal_access=true</code>.
          </p>
          
          <div class="alert alert-info" style="background: #e3f2fd; border: 1px solid #2196f3; border-radius: 8px; padding: 12px; margin-bottom: 15px;">
            <div style="display: flex; align-items: start;">
              <i class="fas fa-info-circle" style="color: #2196f3; margin-right: 10px; margin-top: 2px;"></i>
              <div style="font-size: 13px;">
                <strong>¿Qué se eliminará?</strong>
                <ul style="margin: 8px 0 0 0; padding-left: 20px;">
                  <li>Accesos con <code>?internal=true</code> (tus pruebas desde Admin Panel)</li>
                  <li>Eventos de navegación interna mientras configurabas el MVP</li>
                  <li>Simulaciones y tests previos al lanzamiento</li>
                </ul>
              </div>
            </div>
          </div>

          <div class="alert alert-success" style="background: #e8f5e9; border: 1px solid #4caf50; border-radius: 8px; padding: 12px; margin-bottom: 15px;">
            <div style="display: flex; align-items: start;">
              <i class="fas fa-shield-alt" style="color: #4caf50; margin-right: 10px; margin-top: 2px;"></i>
              <div style="font-size: 13px;">
                <strong>Protección de datos públicos:</strong>
                <ul style="margin: 8px 0 0 0; padding-left: 20px;">
                  <li>Los eventos con <code>is_internal_access=false</code> permanecerán <strong>intactos</strong></li>
                  <li>Toda data UTM (Twitter, Reddit, LinkedIn, etc.) se conserva</li>
                  <li>Las métricas de usuarios reales NO serán afectadas</li>
                </ul>
              </div>
            </div>
          </div>

          <p class="text-muted" style="font-size: 13px;">
            <i class="fas fa-lightbulb"></i>
            <strong>Caso de uso:</strong> Úsalo antes del Día 7 para tener analytics limpias al ejecutar las queries de validación.
          </p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '<i class="fas fa-broom me-1"></i> Sí, limpiar tests internos',
      cancelButtonText: '<i class="fas fa-times me-1"></i> Cancelar',
      confirmButtonColor: '#ff9800',
      cancelButtonColor: '#6c757d',
      width: '600px',
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
    
    // 🆕 Usar el nuevo endpoint que elimina por is_internal_access=true
    this.trackingService.deleteInternalAccessEvents().subscribe({
      next: (response) => {
        if (response.success) {
          // Modal de éxito
          Swal.fire({
            title: '✅ Tests Internos Limpiados',
            html: `
              <div class="text-center">
                <p class="mb-2">
                  Se eliminaron <strong>${response.deleted} eventos</strong> de tests internos.
                </p>
                <p class="text-success" style="font-size: 13px;">
                  <i class="fas fa-check-circle"></i>
                  Los datos de usuarios reales (<code>is_internal_access=false</code>) permanecen seguros.
                </p>
                <p class="text-muted" style="font-size: 12px; margin-top: 8px;">
                  Ahora tus analytics reflejan solo tráfico real con atribución UTM correcta.
                </p>
              </div>
            `,
            icon: 'success',
            timer: 4000,
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
        console.error('❌ Error deleting internal access events:', err);
        
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
