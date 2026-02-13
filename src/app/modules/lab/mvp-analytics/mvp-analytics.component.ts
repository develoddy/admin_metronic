import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { 
  MicroSaasAnalyticsService, 
  MicroSaasKPIs,
  AllAnalyticsSummary 
} from '../_services/micro-saas-analytics.service';

/**
 * MVP Analytics Component
 * 
 * Dashboard inteligente con KPIs, scores y recomendaciones automáticas
 * para todos los micro-SaaS activos.
 * 
 * @author Claude (GitHub Copilot)
 * @date 2026-02-09
 */

@Component({
  selector: 'app-mvp-analytics',
  templateUrl: './mvp-analytics.component.html',
  styleUrls: ['./mvp-analytics.component.scss']
})
export class MvpAnalyticsComponent implements OnInit {
  
  isLoading = false;
  error: string | null = null;
  
  // Data
  analytics: MicroSaasKPIs[] = [];
  summary: AllAnalyticsSummary | null = null;
  
  // Filtros
  selectedPeriod: '7d' | '30d' | '90d' | 'all' = '30d';
  selectedFilter: 'all' | 'high' | 'medium' | 'low' = 'all';
  searchTerm = '';
  
  // UI State
  viewMode: 'grid' | 'list' = 'grid';

  constructor(
    private analyticsService: MicroSaasAnalyticsService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAnalytics();
  }

  /**
   * Cargar analytics de todos los micro-SaaS
   */
  loadAnalytics(): void {
    this.isLoading = true;
    this.error = null;
    
    this.analyticsService.getAllAnalytics(this.selectedPeriod).subscribe({
      next: (response) => {
        if (response.success) {
          this.analytics = response.analytics;
          this.summary = response.summary;
        }
        this.isLoading = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error loading analytics:', err);
        this.error = 'Error al cargar analytics';
        this.isLoading = false;
        this.cd.detectChanges();
      }
    });
  }

  /**
   * Filtrar analytics según criterios
   */
  get filteredAnalytics(): MicroSaasKPIs[] {
    let filtered = this.analytics;
    
    // Filtro por score
    if (this.selectedFilter !== 'all') {
      filtered = filtered.filter(a => {
        if (this.selectedFilter === 'high') return a.healthScore >= 70;
        if (this.selectedFilter === 'medium') return a.healthScore >= 40 && a.healthScore < 70;
        if (this.selectedFilter === 'low') return a.healthScore < 40;
        return true;
      });
    }
    
    // Filtro por búsqueda
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(a => 
        a.moduleKey.toLowerCase().includes(term) ||
        a.moduleName.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }

  /**
   * Cambiar período
   */
  changePeriod(period: '7d' | '30d' | '90d' | 'all'): void {
    this.selectedPeriod = period;
    this.loadAnalytics();
  }

  /**
   * Cambiar filtro
   */
  changeFilter(filter: 'all' | 'high' | 'medium' | 'low'): void {
    this.selectedFilter = filter;
    this.cd.detectChanges();
  }

  /**
   * Ver detalles de un MVP
   */
  viewDetails(moduleKey: string): void {
    this.router.navigate(['/lab/analytics', moduleKey]);
  }

  /**
   * Recargar datos
   */
  refresh(): void {
    this.loadAnalytics();
  }

  /**
   * Obtener clase CSS según score
   */
  getScoreClass(score: number): string {
    return this.analyticsService.getScoreColor(score);
  }

  /**
   * Obtener clase CSS según badge action
   */
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

  /**
   * Formatear trend
   */
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

  /**
   * Obtener icono de recomendación
   */
  getRecommendationIcon(action: string): string {
    return this.analyticsService.getRecommendationIcon(action);
  }

  /**
   * Obtener label de período
   */
  getPeriodLabel(period: string): string {
    const labels = {
      '7d': 'Últimos 7 días',
      '30d': 'Últimos 30 días',
      '90d': 'Últimos 90 días',
      'all': 'Todo el tiempo'
    };
    
    return labels[period] || labels['30d'];
  }
}
