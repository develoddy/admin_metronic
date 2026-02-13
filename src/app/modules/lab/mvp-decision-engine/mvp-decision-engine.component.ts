import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { 
  MicroSaasAnalyticsService, 
  MicroSaasKPIs 
} from '../_services/micro-saas-analytics.service';

/**
 * MVP Decision Engine Component
 * 
 * Vista detallada de un Module con motor de decisiones para:
 * - Validar y activar (status = live)
 * - Archivar (status = archived)
 * - Continuar validación (status = testing)
 * 
 * Nota: Ya no existe "conversión a módulo" - un Module con status=testing ES el MVP.
 * 
 * @author Claude (GitHub Copilot)
 * @date 2026-02-13
 */

@Component({
  selector: 'app-mvp-decision-engine',
  templateUrl: './mvp-decision-engine.component.html',
  styleUrls: ['./mvp-decision-engine.component.scss']
})
export class MvpDecisionEngineComponent implements OnInit {
  
  moduleKey: string = '';
  isLoading = false;
  error: string | null = null;
  
  // Data
  analytics: MicroSaasKPIs | null = null;
  
  // Period selector
  selectedPeriod: '7d' | '30d' | '90d' | 'all' = '30d';
  
  // Decision actions
  isExecutingDecision = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private analyticsService: MicroSaasAnalyticsService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.moduleKey = params['moduleKey'];
      if (this.moduleKey) {
        this.loadAnalytics();
      }
    });
  }

  /**
   * Cargar analytics del MVP
   */
  loadAnalytics(): void {
    this.isLoading = true;
    this.error = null;
    
    this.analyticsService.getModuleAnalytics(this.moduleKey, this.selectedPeriod).subscribe({
      next: (response) => {
        if (response.success) {
          this.analytics = response.analytics;
        } else {
          this.error = 'No se encontraron datos para este MVP';
        }
        this.isLoading = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error loading analytics:', err);
        this.error = 'Error al cargar analytics del MVP';
        this.isLoading = false;
        this.cd.detectChanges();
      }
    });
  }

  /**
   * Cambiar período
   */
  changePeriod(period: '7d' | '30d' | '90d' | 'all'): void {
    this.selectedPeriod = period;
    this.loadAnalytics();
  }

  /**
   * Ejecutar decisión: Validar y Activar (cambiar status a live)
   */
  async createModule(): Promise<void> {
    const result = await Swal.fire({
      title: '✅ Validar y Activar Módulo',
      html: `
        <p class="mb-3">¿Estás seguro de validar y activar <strong>${this.analytics?.moduleName}</strong>?</p>
        <p class="text-muted small">El módulo cambiará su status de "testing" a "live".</p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, activar módulo',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d'
    });

    if (!result.isConfirmed) return;

    this.isExecutingDecision = true;
    
    // Usar executeDecision con action 'validate' para cambiar status a 'live'
    this.analyticsService.executeDecision(
      this.moduleKey,
      'validate',
      'Módulo validado y activado desde motor de decisiones'
    ).subscribe({
      next: (response) => {
        if (response.success) {
          Swal.fire({
            icon: 'success',
            title: '✅ Módulo Activado',
            html: `
              <p>El módulo <strong>${this.analytics?.moduleName}</strong> ha sido activado exitosamente.</p>
              <p class="text-muted small">Ahora puedes configurarlo en la gestión de módulos.</p>
            `,
            confirmButtonText: 'Ver Módulo',
            showCancelButton: true,
            cancelButtonText: 'Continuar aquí'
          }).then((result) => {
            if (result.isConfirmed) {
              // Navegar a la edición del módulo en lab/modules
              this.router.navigate(['/lab/modules/edit', this.moduleKey]);
            } else {
              this.loadAnalytics(); // Recargar datos
            }
          });
        }
        this.isExecutingDecision = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error validating module:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.error?.message || 'Error al validar el módulo'
        });
        this.isExecutingDecision = false;
        this.cd.detectChanges();
      }
    });
  }

  /**
   * Ejecutar decisión: Continuar Validación
   */
  async continueValidation(): Promise<void> {
    const result = await Swal.fire({
      title: '⏸️ Continuar Validación',
      html: `
        <p class="mb-3">El MVP <strong>${this.analytics?.moduleName}</strong> continuará en fase de validación.</p>
        <p class="text-muted small">Se seguirá recolectando datos de tracking para evaluar su performance.</p>
      `,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Continuar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#007bff'
    });

    if (!result.isConfirmed) return;

    this.isExecutingDecision = true;

    this.analyticsService.executeDecision(
      this.moduleKey, 
      'continue',
      'Decisión manual: continuar recolectando datos'
    ).subscribe({
      next: (response) => {
        if (response.success) {
          Swal.fire({
            icon: 'success',
            title: '✅ Decisión Registrada',
            text: 'El MVP continuará en fase de validación.',
            timer: 2000,
            showConfirmButton: false
          });
          this.loadAnalytics();
        }
        this.isExecutingDecision = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error executing decision:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al registrar la decisión'
        });
        this.isExecutingDecision = false;
        this.cd.detectChanges();
      }
    });
  }

  /**
   * Ejecutar decisión: Archivar MVP
   */
  async archiveMVP(): Promise<void> {
    const result = await Swal.fire({
      title: '🗄️ Archivar MVP',
      html: `
        <p class="mb-3">¿Estás seguro de archivar <strong>${this.analytics?.moduleName}</strong>?</p>
        <p class="text-danger small">Esta acción marcará el MVP como archivado y dejará de aparecer en el dashboard principal.</p>
      `,
      icon: 'warning',
      input: 'textarea',
      inputLabel: 'Motivo del archivo (opcional)',
      inputPlaceholder: 'Ej: Performance insuficiente, pivote de producto...',
      showCancelButton: true,
      confirmButtonText: 'Sí, archivar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    });

    if (!result.isConfirmed) return;

    this.isExecutingDecision = true;

    this.analyticsService.executeDecision(
      this.moduleKey,
      'archive',
      result.value || 'Archivado manualmente desde motor de decisiones'
    ).subscribe({
      next: (response) => {
        if (response.success) {
          Swal.fire({
            icon: 'success',
            title: '✅ MVP Archivado',
            text: 'El MVP ha sido archivado exitosamente.',
            timer: 2000,
            showConfirmButton: false
          }).then(() => {
            this.router.navigate(['/lab/analytics']);
          });
        }
        this.isExecutingDecision = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error archiving MVP:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al archivar el MVP'
        });
        this.isExecutingDecision = false;
        this.cd.detectChanges();
      }
    });
  }

  /**
   * Volver al listado
   */
  goBack(): void {
    this.router.navigate(['/lab/analytics']);
  }

  /**
   * Utilidades
   */
  getScoreClass(score: number): string {
    return this.analyticsService.getScoreColor(score);
  }

  getActionBadge(action: string): string {
    switch (action) {
      case 'validate':
        return 'badge-success';
      case 'continue':
        return 'badge-primary';
      case 'archive':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  }

  formatTrend(change: number): any {
    const sign = change > 0 ? '+' : '';
    const icon = change > 0 ? '📈' : change < 0 ? '📉' : '➖';
    const cssClass = change > 0 ? 'trend-up' : change < 0 ? 'trend-down' : 'trend-neutral';
    
    return {
      text: `${sign}${change}%`,
      class: cssClass,
      icon
    };
  }

  getRecommendationIcon(action: string): string {
    return this.analyticsService.getRecommendationIcon(action);
  }

  /**
   * Formatear tasa con contexto de datos insuficientes
   */
  formatRate(rate: number, context: 'conversion' | 'download' | 'retention' | 'feedback'): string {
    if (!this.analytics) return '0%';
    
    // Si hay datos insuficientes y la tasa es 0, mostrar N/A
    if (this.analytics.insufficient_data && rate === 0) {
      return 'N/A (poca data)';
    }
    
    // Si la tasa es 0 por falta de eventos base, mostrar contexto
    if (rate === 0) {
      switch (context) {
        case 'conversion':
          return this.analytics.wizard_starts === 0 ? 'N/A (sin starts)' : '0%';
        case 'download':
          return this.analytics.wizard_completions === 0 ? 'N/A (sin completions)' : '0%';
        case 'feedback':
          return this.analytics.total_feedback === 0 ? 'N/A (sin feedback)' : '0%';
        case 'retention':
          return this.analytics.totalSessions === 0 ? 'N/A (sin sesiones)' : '0%';
      }
    }
    
    return `${rate}%`;
  }
}
