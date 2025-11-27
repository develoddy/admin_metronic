import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PrintfulService } from '../_services/printful.service';
import { ProductService } from '../../product/_services/product.service';
import { AnalyticsPrintfulService } from '../_services/analytics-printful.service';

interface DashboardStats {
  totalProducts: number;
  totalVariants: number;
  totalCategories: number;
  activeProducts: number;
  inactiveProducts: number;
  totalInventoryValue: number;
  averagePrice: number;
  priceRange: { min: number; max: number };
  categoriesDistribution: Array<{ name: string; count: number }>;
  lastSync: string | null;
  alerts: Array<{ type: string; message: string; count: number }>;
  topExpensive: Array<any>;
  topCheap: Array<any>;
}

@Component({
  selector: 'app-dashboard-printful',
  templateUrl: './dashboard-printful.component.html',
  styleUrls: ['./dashboard-printful.component.scss']
})
export class DashboardPrintfulComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Dashboard stats
  stats: DashboardStats = {
    totalProducts: 0,
    totalVariants: 0,
    totalCategories: 0,
    activeProducts: 0,
    inactiveProducts: 0,
    totalInventoryValue: 0,
    averagePrice: 0,
    priceRange: { min: 0, max: 0 },
    categoriesDistribution: [],
    lastSync: null,
    alerts: [],
    topExpensive: [],
    topCheap: []
  };

  loading = true;
  error = false;

  // Financial Analytics
  financialStats: any = null;
  topProfitableProducts: any[] = [];
  topLosingProducts: any[] = [];
  timelineData: any[] = [];
  loadingAnalytics = true;

  // Chart options for ApexCharts
  categoryChartOptions: any;
  statusChartOptions: any;
  revenueChartOptions: any;

  // Toast notification
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'info';

  constructor(
    private printfulService: PrintfulService,
    private productService: ProductService,
    private analyticsService: AnalyticsPrintfulService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDashboardStats();
    this.loadFinancialAnalytics();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboardStats(): void {
    this.loading = true;
    this.error = false;

    this.printfulService.getDashboardStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: any) => {
          if (resp.success) {
            this.stats = resp.data;
            this.initializeCharts();
            this.cd.detectChanges();
          } else {
            this.error = true;
            this.showToastNotification('Error al cargar estadísticas', 'error');
          }
          this.loading = false;
          this.cd.detectChanges();
        },
        error: (err) => {
          console.error('Error loading dashboard stats:', err);
          this.error = true;
          this.loading = false;
          this.showToastNotification('Error al cargar el dashboard', 'error');
        }
      });
  }

  initializeCharts(): void {
    // Category Distribution Chart (Bar Chart)
    this.categoryChartOptions = {
      series: [{
        name: 'Productos',
        data: this.stats.categoriesDistribution.map(c => c.count)
      }],
      chart: {
        type: 'bar',
        height: 350,
        toolbar: { show: false }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          borderRadius: 5
        }
      },
      dataLabels: {
        enabled: false
      },
      xaxis: {
        categories: this.stats.categoriesDistribution.map(c => c.name)
      },
      colors: ['#009ef7'],
      title: {
        text: 'Distribución por Categoría',
        align: 'center',
        style: {
          fontSize: '16px',
          fontWeight: 600
        }
      }
    };

    // Status Distribution Chart (Donut Chart)
    this.statusChartOptions = {
      series: [this.stats.activeProducts, this.stats.inactiveProducts],
      chart: {
        type: 'donut',
        height: 300
      },
      labels: ['Activos', 'Inactivos'],
      colors: ['#50cd89', '#f1416c'],
      dataLabels: {
        enabled: true,
        formatter: function(val: any, opts: any) {
          const count = opts.w.config.series[opts.seriesIndex];
          const percentage = val.toFixed(1);
          return count + ' (' + percentage + '%)';
        }
      },
      legend: {
        position: 'bottom'
      },
      title: {
        text: 'Estado del Catálogo',
        align: 'center',
        style: {
          fontSize: '16px',
          fontWeight: 600
        }
      }
    };
  }

  syncCatalog(): void {
    this.showToastNotification('Sincronizando catálogo...', 'info');

    this.printfulService.synPrintfulProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: any) => {
          this.showToastNotification('Sincronización completada', 'success');
          this.loadDashboardStats();
        },
        error: (err) => {
          console.error('Error syncing catalog:', err);
          this.showToastNotification('Error al sincronizar', 'error');
        }
      });
  }

  refreshDashboard(): void {
    this.showToastNotification('Actualizando dashboard...', 'info');
    this.loadDashboardStats();
  }

  getAlertIcon(type: string): string {
    const icons: any = {
      'no-variants': 'fa-exclamation-triangle',
      'low-stock': 'fa-box-open',
      'high-price': 'fa-dollar-sign',
      'no-category': 'fa-folder-open',
      'outdated': 'fa-clock'
    };
    return icons[type] || 'fa-info-circle';
  }

  getAlertClass(type: string): string {
    const classes: any = {
      'no-variants': 'warning',
      'low-stock': 'danger',
      'high-price': 'info',
      'no-category': 'warning',
      'outdated': 'secondary'
    };
    return classes[type] || 'info';
  }

  getAlertQueryParams(type: string): any {
    // Return query params based on alert type to filter products
    const params: any = {
      'no-variants': { filter: 'no-variants' },
      'low-stock': { state: '1' }, // state=1 means inactive
      'high-price': { filter: 'high-price' },
      'no-category': { filter: 'no-category' },
      'outdated': { filter: 'outdated' }
    };
    return params[type] || {};
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  }

  getProductImage(imagen: string | null): string {
    if (!imagen) {
      return 'assets/media/svg/files/blank-image.svg';
    }
    // Si la imagen ya tiene el dominio completo, usarla directamente
    if (imagen.startsWith('http://') || imagen.startsWith('https://')) {
      return imagen;
    }
    // Si es una ruta relativa, construir la URL completa
    return `http://127.0.0.1:3500/${imagen}`;
  }

  formatDate(date: string | null): string {
    if (!date) return 'Nunca';
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    return d.toLocaleDateString('es-ES');
  }

  loadFinancialAnalytics(): void {
    this.loadingAnalytics = true;

    // Cargar estadísticas financieras
    this.analyticsService.getFinancialStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.financialStats = response.stats;
            this.initializeRevenueChart();
          }
          this.cd.detectChanges();
        },
        error: (err) => {
          console.error('Error loading financial stats:', err);
        }
      });

    // Cargar top productos rentables
    this.analyticsService.getProductsRanking(5, 'profit')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.topProfitableProducts = response.ranking.filter(p => p.totalProfit > 0);
          }
          this.cd.detectChanges();
        },
        error: (err) => {
          console.error('Error loading profitable products:', err);
        }
      });

    // Cargar productos con pérdidas
    this.analyticsService.getProductsRanking(100, 'profit')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.topLosingProducts = response.ranking
              .filter(p => p.totalProfit < 0)
              .slice(0, 5);
          }
          this.cd.detectChanges();
        },
        error: (err) => {
          console.error('Error loading losing products:', err);
        }
      });

    // Cargar timeline
    this.analyticsService.getTimeline(30)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.timelineData = response.timeline;
            this.initializeRevenueChart();
          }
          this.loadingAnalytics = false;
          this.cd.detectChanges();
        },
        error: (err) => {
          console.error('Error loading timeline:', err);
          this.loadingAnalytics = false;
        }
      });
  }

  initializeRevenueChart(): void {
    if (!this.timelineData || this.timelineData.length === 0) return;

    const categories = this.timelineData.map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    });

    const revenueData = this.timelineData.map(d => d.revenue);
    const costData = this.timelineData.map(d => d.cost);
    const profitData = this.timelineData.map(d => d.profit);

    this.revenueChartOptions = {
      series: [
        {
          name: 'Ingresos',
          data: revenueData,
          color: '#50cd89'
        },
        {
          name: 'Costes',
          data: costData,
          color: '#f1416c'
        },
        {
          name: 'Beneficio',
          data: profitData,
          color: '#009ef7'
        }
      ],
      chart: {
        type: 'area',
        height: 350,
        toolbar: {
          show: false
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'smooth',
        width: 2
      },
      xaxis: {
        categories: categories,
        labels: {
          style: {
            colors: '#a1a5b7'
          }
        }
      },
      yaxis: {
        labels: {
          style: {
            colors: '#a1a5b7'
          },
          formatter: (value: number) => {
            return '€' + value.toFixed(2);
          }
        }
      },
      tooltip: {
        y: {
          formatter: (value: number) => {
            return '€' + value.toFixed(2);
          }
        }
      },
      grid: {
        borderColor: '#eff2f5'
      },
      legend: {
        position: 'top',
        horizontalAlign: 'right'
      }
    };
  }

  showToastNotification(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;

    setTimeout(() => {
      this.closeToast();
    }, 3000);
  }

  closeToast(): void {
    this.showToast = false;
  }
}
