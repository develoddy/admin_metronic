import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import {
  SaasTrackingEventsService,
  TrackingEvent,
  TrackingEventsFilters
} from '../_services/saas-tracking-events.service';

@Component({
  selector: 'app-tracking-events',
  templateUrl: './tracking-events.component.html',
  styleUrls: ['./tracking-events.component.scss']
})
export class TrackingEventsComponent implements OnInit {
  
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
}
