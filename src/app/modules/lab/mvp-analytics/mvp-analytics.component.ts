import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { 
  MicroSaasAnalyticsService, 
  MicroSaasKPIs,
  AllAnalyticsSummary 
} from '../_services/micro-saas-analytics.service';
import { environment } from '../../../../environments/environment';

/**
 * MVP Analytics Component
 * 
 * Intelligent dashboard with KPIs, scores and automated recommendations
 * for all active micro-SaaS.
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
   * Load analytics for all micro-SaaS
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
        this.error = 'Error loading analytics';
        this.isLoading = false;
        this.cd.detectChanges();
      }
    });
  }

  /**
   * Filter analytics by criteria
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
   * Change period
   */
  changePeriod(period: '7d' | '30d' | '90d' | 'all'): void {
    this.selectedPeriod = period;
    this.loadAnalytics();
  }

  /**
   * Change filter
   */
  changeFilter(filter: 'all' | 'high' | 'medium' | 'low'): void {
    this.selectedFilter = filter;
    this.cd.detectChanges();
  }

  /**
   * View details of an MVP
   */
  viewDetails(moduleKey: string): void {
    this.router.navigate(['/lab/analytics', moduleKey]);
  }

  /**
   * Open MVP wizard in new tab
   * Adds ?internal=true to bypass status='testing' validation
   */
  openWizard(moduleKey: string, event?: Event): void {
    // Prevent click propagation to card
    if (event) {
      event.stopPropagation();
    }
    
    // Build wizard URL with authorized internal access
    // This allows opening modules with status='testing' from Admin Panel
    const wizardUrl = `${environment.URL_MVP_HUB}/preview/${moduleKey}?internal=true`;
    
    // Open in new tab
    window.open(wizardUrl, '_blank');
    
    console.log(`🚀 Opening internal wizard: ${wizardUrl}`);
  }

  /**
   * Reload data
   */
  refresh(): void {
    this.loadAnalytics();
  }

  /**
   * Get CSS class by score
   */
  getScoreClass(score: number): string {
    return this.analyticsService.getScoreColor(score);
  }

  /**
   * Get CSS class by badge action
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
   * Format trend
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
   * Get recommendation icon
   */
  getRecommendationIcon(action: string): string {
    return this.analyticsService.getRecommendationIcon(action);
  }

  /**
   * Get period label
   */
  getPeriodLabel(period: string): string {
    const labels = {
      '7d': 'Last 7 days',
      '30d': 'Last 30 days',
      '90d': 'Last 90 days',
      'all': 'All time'
    };
    
    return labels[period] || labels['30d'];
  }
}
