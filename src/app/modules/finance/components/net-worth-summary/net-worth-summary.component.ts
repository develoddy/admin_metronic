import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FinanceService } from '../../services/finance.service';
import { FinanceAggregatorService } from '../../services/finance-aggregator.service';
import { NetWorth } from '../../interfaces/finance.interface';

@Component({
  selector: 'app-net-worth-summary',
  templateUrl: './net-worth-summary.component.html',
  styleUrls: ['./net-worth-summary.component.scss']
})
export class NetWorthSummaryComponent implements OnInit {
  netWorthData: NetWorth | null = null;
  metrics: any = null;
  recommendations: string[] = [];
  isLoading = true;
  error: string | null = null;

  constructor(
    private financeService: FinanceService,
    private aggregatorService: FinanceAggregatorService,
    private cd: ChangeDetectorRef
  ) {
    console.log('💎 [NetWorthSummary] Component constructor called');
  }

  ngOnInit(): void {
    console.log('💎 [NetWorthSummary] ngOnInit called');
    this.loadNetWorth();
  }

  loadNetWorth(): void {
    console.log('💎 [NetWorthSummary] loadNetWorth started, isLoading =', this.isLoading);
    this.isLoading = true;
    this.error = null;

    this.financeService.getNetWorth().subscribe({
      next: (response) => {
        console.log('💎 [NetWorthSummary] Response received:', response);
        if (response.success && response.data) {
          this.netWorthData = response.data;
          this.metrics = this.aggregatorService.calculateNetWorthMetrics(response.data);
          this.recommendations = this.aggregatorService.generateNetWorthRecommendations(this.metrics);
          this.isLoading = false;
          console.log('💎 [NetWorthSummary] Data loaded successfully, isLoading =', this.isLoading);
          this.cd.detectChanges(); // 🔧 Forzar detección de cambios
        } else {
          this.error = 'No se pudieron cargar los datos de patrimonio';
          this.isLoading = false;
          console.warn('💎 [NetWorthSummary] Invalid response format');
          this.cd.detectChanges();
        }
      },
      error: (err) => {
        console.error('💎 [NetWorthSummary] ERROR loading net worth:', err);
        console.error('   Status:', err.status);
        console.error('   Message:', err.message);
        console.error('   Error object:', err.error);
        this.error = 'Error al cargar patrimonio neto';
        this.isLoading = false;
        this.cd.detectChanges();
      }
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount);
  }

  getHealthStatusLabel(): string {
    if (!this.metrics) return '';
    
    const labels: { [key: string]: string } = {
      'excellent': 'Excelente',
      'good': 'Bueno',
      'fair': 'Regular',
      'poor': 'Mejorable'
    };
    
    return labels[this.metrics.healthStatus] || '';
  }

  getHealthIcon(): string {
    if (!this.metrics) return 'bi-dash-circle';
    
    const icons: { [key: string]: string } = {
      'excellent': 'bi-trophy-fill',
      'good': 'bi-check-circle-fill',
      'fair': 'bi-exclamation-circle-fill',
      'poor': 'bi-x-circle-fill'
    };
    
    return icons[this.metrics.healthStatus] || 'bi-dash-circle';
  }

  getPercentageChange(): number {
    // TODO: Calcular cambio porcentual cuando tengamos snapshots históricos
    return 0;
  }

  goToPatrimonioTab(): void {
    console.log('💎 [NetWorthSummary] Activating Patrimonio tab');
    
    // Activar el tab de Patrimonio usando Bootstrap tabs
    const patrimonioTab = document.querySelector('#patrimonio-tab') as HTMLElement;
    
    if (patrimonioTab) {
      // Click en el tab para activarlo
      patrimonioTab.click();
      
      // Scroll suave hasta el tab
      setTimeout(() => {
        const tabsContainer = document.querySelector('.nav-tabs') as HTMLElement;
        if (tabsContainer) {
          tabsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      console.warn('💎 [NetWorthSummary] Patrimonio tab not found in DOM');
    }
  }
}
