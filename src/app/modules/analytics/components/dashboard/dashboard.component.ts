import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AnalyticsService } from '../../services/analytics.service';
import { DashboardSummary, MetricType, KPICard } from '../../models/analytics.models';

@Component({
  selector: 'app-analytics-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Data
  dashboard: DashboardSummary | null = null;
  kpiCards: KPICard[] = [];
  metricsData: any[] = [];
  
  // UI State
  selectedPeriod: MetricType = 'daily';
  loading$ = this.analyticsService.isLoading$;
  errorMessage: string = '';
  loadingCharts: boolean = false;

  // Period Options
  periodOptions = [
    { value: 'daily', label: 'Diario' },
    { value: 'weekly', label: 'Semanal' },
    { value: 'monthly', label: 'Mensual' },
    { value: 'yearly', label: 'Anual' }
  ];

  constructor(
    private analyticsService: AnalyticsService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
    this.loadMetrics();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load dashboard data
   */
  loadDashboard(): void {
    this.errorMessage = '';
    
    this.analyticsService.getDashboard()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dashboard = response.data;
          this.buildKPICards(response.data);
        },
        error: (error) => {
          console.error('Error loading dashboard:', error);
          this.errorMessage = 'Error al cargar el dashboard. Por favor, intente nuevamente.';
          this.snackBar.open('Error al cargar datos del dashboard', 'Cerrar', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  /**
   * Build KPI cards from dashboard data
   */
  private buildKPICards(data: DashboardSummary): void {
    // Seleccionar métrica según período seleccionado
    const current = this.selectedPeriod === 'daily' ? data.current.daily : 
                    this.selectedPeriod === 'weekly' ? data.current.weekly : 
                    data.current.monthly;
    
    if (!current) {
      this.kpiCards = [];
      return;
    }

    const trends = data.trends;

    this.kpiCards = [
      {
        title: 'Ingresos Totales',
        value: this.analyticsService.formatCurrency(current.revenue || 0),
        icon: 'attach_money',
        trend: trends.revenue || 0,
        subtitle: this.getTrendLabel(trends.revenue || 0)
      },
      {
        title: 'Ganancia Neta',
        value: this.analyticsService.formatCurrency(current.profit || 0),
        icon: 'trending_up',
        trend: trends.profit || 0,
        subtitle: `Margen: ${this.analyticsService.formatPercentage(current.margin || 0)}`
      },
      {
        title: 'Órdenes Totales',
        value: (current.orders || 0).toString(),
        icon: 'shopping_cart',
        trend: trends.orders || 0,
        subtitle: this.getTrendLabel(trends.orders || 0)
      },
      {
        title: 'Valor Promedio',
        value: this.analyticsService.formatCurrency(current.avgOrderValue || 0),
        icon: 'account_balance_wallet',
        trend: 0,
        subtitle: 'Por orden'
      },
      {
        title: 'Tasa de Éxito',
        value: this.analyticsService.formatPercentage(current.successRate || 0),
        icon: 'check_circle',
        trend: trends.successRate || 0,
        subtitle: `${current.orders || 0} órdenes`
      },
      {
        title: 'Tiempo Fulfillment',
        value: this.formatTime(current.avgFulfillmentTime || 0),
        icon: 'schedule',
        trend: 0,
        subtitle: 'Promedio'
      }
    ];
  }

  /**
   * Handle period change
   */
  onPeriodChange(): void {
    this.loadDashboard();
    this.loadMetrics();
  }

  /**
   * Load metrics for charts
   */
  loadMetrics(): void {
    this.loadingCharts = true;
    
    // Calcular rango de fechas según el período seleccionado
    const endDate = new Date();
    const startDate = new Date();
    
    switch (this.selectedPeriod) {
      case 'daily':
        startDate.setDate(endDate.getDate() - 30); // Últimos 30 días
        break;
      case 'weekly':
        startDate.setDate(endDate.getDate() - 90); // Últimas 12 semanas
        break;
      case 'monthly':
        startDate.setMonth(endDate.getMonth() - 12); // Últimos 12 meses
        break;
      case 'yearly':
        startDate.setFullYear(endDate.getFullYear() - 5); // Últimos 5 años
        break;
    }

    this.analyticsService.getMetrics(this.selectedPeriod, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.metricsData = response.data || [];
          this.loadingCharts = false;
        },
        error: (error) => {
          console.error('Error loading metrics:', error);
          this.metricsData = [];
          this.loadingCharts = false;
          this.snackBar.open('Error al cargar métricas para gráficas', 'Cerrar', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  /**
   * Refresh dashboard data
   */
  refreshDashboard(): void {
    this.loadDashboard();
    this.loadMetrics();
    this.snackBar.open('Dashboard actualizado', 'Cerrar', {
      duration: 2000,
      panelClass: ['success-snackbar']
    });
  }

  /**
   * Get trend label
   */
  private getTrendLabel(trend: number): string {
    if (trend > 0) return `+${this.analyticsService.formatPercentage(trend)} vs anterior`;
    if (trend < 0) return `${this.analyticsService.formatPercentage(trend)} vs anterior`;
    return 'Sin cambios';
  }

  /**
   * Format time in hours
   */
  private formatTime(hours: number): string {
    if (hours < 1) return `${Math.round(hours * 60)} min`;
    if (hours < 24) return `${hours.toFixed(1)} hrs`;
    const days = Math.floor(hours / 24);
    const remainingHours = Math.round(hours % 24);
    return `${days}d ${remainingHours}h`;
  }

  /**
   * Get trend icon
   */
  getTrendIcon(trend: number): string {
    if (trend > 0) return 'arrow_upward';
    if (trend < 0) return 'arrow_downward';
    return 'remove';
  }

  /**
   * Get trend class
   */
  getTrendClass(trend: number): string {
    if (trend > 0) return 'trend-up';
    if (trend < 0) return 'trend-down';
    return 'trend-neutral';
  }

  /**
   * Check if has top products
   */
  hasTopProducts(): boolean {
    return this.dashboard?.topProducts && this.dashboard.topProducts.length > 0;
  }

  /**
   * Format currency
   */
  formatCurrency(value: number): string {
    return this.analyticsService.formatCurrency(value);
  }
}
