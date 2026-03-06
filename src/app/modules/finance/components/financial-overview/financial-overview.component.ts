import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FinancialOverview, FinancialSummary } from '../../interfaces/finance.interface';
import { FinanceAggregatorService } from '../../services/finance-aggregator.service';

@Component({
  selector: 'app-financial-overview',
  templateUrl: './financial-overview.component.html',
  styleUrls: ['../../../../../assets/css/finance/components/_financial-overview.scss']
})
export class FinancialOverviewComponent implements OnChanges {
  @Input() financialSummary: FinancialSummary | null = null;
  
  overview: FinancialOverview | null = null;

  constructor(private aggregatorService: FinanceAggregatorService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['financialSummary'] && this.financialSummary) {
      console.log('🔄 Generando Financial Overview...');
      console.log('  📊 Financial Summary recibido:', this.financialSummary);
      this.overview = this.aggregatorService.generateOverview(this.financialSummary);
      console.log('✅ Overview generado:', this.overview);
      console.log('  📢 Recomendaciones:', this.overview.recommendations.length);
      console.log('  📋 Deudas prioridad:', this.overview.debtPriority.length);
      console.log('  🏦 Cuentas bancarias:', this.overview.accountBreakdown.length);
      console.log('  📊 Categorías:', this.overview.categoryBreakdown.length);
    }
  }

  getStatusBadgeText(): string {
    if (!this.overview) return '';
    
    const statusMap = {
      'surplus': '✅ SUPERÁVIT MENSUAL',
      'deficit': '⚠ DÉFICIT MENSUAL',
      'balanced': '⚖ EQUILIBRIO AJUSTADO'
    };
    
    return statusMap[this.overview.status];
  }

  getStatusBadgeClass(): string {
    if (!this.overview) return 'badge-secondary';
    
    const classMap = {
      'surplus': 'badge-success',
      'deficit': 'badge-danger',
      'balanced': 'badge-warning'
    };
    
    return classMap[this.overview.statusColor];
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  getRecommendationClass(type: string): string {
    const classMap: { [key: string]: string } = {
      'alert': 'danger',
      'warning': 'warning',
      'success': 'success',
      'info': 'info'
    };
    return classMap[type] || 'secondary';
  }

  getRecommendationIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      'alert': 'bi bi-exclamation-triangle-fill',
      'warning': 'bi bi-exclamation-circle-fill',
      'success': 'bi bi-check-circle-fill',
      'info': 'bi bi-info-circle-fill'
    };
    return iconMap[type] || 'bi-info-circle';
  }

  hasCategory(category: string): boolean {
    if (!this.overview) return false;
    return this.overview.categoryBreakdown.some(cat => cat.category === category);
  }
}
