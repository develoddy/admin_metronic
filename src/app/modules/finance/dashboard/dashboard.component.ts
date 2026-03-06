import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FinanceService } from '../services/finance.service';
import { FinancialSummary, InternalTransfersSummary } from '../interfaces/finance.interface';
import {
  EXPENSE_CATEGORY_ICONS,
  INCOME_CATEGORY_ICONS,
  ACCOUNT_TYPE_ICONS,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  getCategoryBadgeClass
} from '../interfaces/finance.interface';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Data
  financialSummary: FinancialSummary | null = null;
  internalTransfersSummary: InternalTransfersSummary | null = null;
  isLoading = false;
  error: string | null = null;
  selectedMonth: string;

  constructor(
    public financeService: FinanceService,
    private cd: ChangeDetectorRef
  ) {
    console.log('🔧 DashboardComponent constructor called');
    this.selectedMonth = this.financeService.getCurrentMonth();
    console.log('  Selected month:', this.selectedMonth);
  }

  ngOnInit(): void {
    console.log('🔧 DashboardComponent ngOnInit called');
    this.loadFinancialDashboard();
    this.loadInternalTransfers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga el dashboard financiero
   */
  loadFinancialDashboard(): void {
    console.log('🔧 loadFinancialDashboard started');
    console.log('  Selected month:', this.selectedMonth);
    this.isLoading = true;
    this.error = null;

    this.financeService.getFinancialDashboard(this.selectedMonth)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('📊 Financial dashboard response:', response);
          
          if (response.success && response.data) {
            this.financialSummary = response.data;
            this.isLoading = false; // ← IMPORTANTE: Actualizar ANTES de change detection
            
            console.log('  ✅ Dashboard loaded successfully');
            console.log('  DTI:', this.financialSummary.debtInfo.debtToIncomeRatio);
            console.log('  Debt Burden:', this.financialSummary.debtInfo.debtBurden);
            console.log('  Monthly Income:', this.financialSummary.debtInfo.monthlyIncome);
            console.log('  Health Status:', this.financialSummary.healthStatus.status);
            console.log('  isLoading:', this.isLoading);
            
            // Force change detection
            this.cd.detectChanges();
            console.log('  🔄 Change detection triggered');
          } else {
            this.error = response.message || 'Error al cargar el dashboard';
            this.isLoading = false;
            console.warn('  ⚠️ Response not successful:', response);
            this.cd.detectChanges();
          }
        },
        error: (err) => {
          console.error('❌ Error loading financial dashboard:', err);
          console.error('  Error details:', JSON.stringify(err, null, 2));
          this.error = 'Error al cargar el dashboard financiero: ' + (err.message || JSON.stringify(err));
          this.isLoading = false;
          this.cd.detectChanges();
        }
      });
  }

  /**
   * Carga el resumen de transferencias internas
   */
  loadInternalTransfers(): void {
    console.log('🔄 loadInternalTransfers started');
    console.log('  Selected month:', this.selectedMonth);

    this.financeService.getInternalTransfers(this.selectedMonth)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('📊 Internal transfers response:', response);
          
          if (response.success && response.data) {
            this.internalTransfersSummary = response.data;
            console.log('  ✅ Internal transfers loaded successfully');
            console.log('  Total Transferred:', this.internalTransfersSummary.totalTransferred);
            console.log('  Transfer Count:', this.internalTransfersSummary.transferCount);
            this.cd.detectChanges();
          } else {
            console.warn('  ⚠️ Internal transfers response not successful:', response);
          }
        },
        error: (err) => {
          console.error('❌ Error loading internal transfers:', err);
          // No mostramos error al usuario, solo logueamos
        }
      });
  }

  /**
   * Cambia el mes seleccionado y recarga los datos
   */
  onMonthChange(): void {
    this.loadFinancialDashboard();
    this.loadInternalTransfers();
  }

  /**
   * Obtiene el color del badge según el estado de salud
   */
  getHealthBadgeClass(): string {
    if (!this.financialSummary) return 'badge-secondary';
    
    const status = this.financialSummary.healthStatus.status;
    const classMap = {
      'VERDE': 'badge-success',
      'AMARILLO': 'badge-warning',
      'ROJO': 'badge-danger'
    };
    
    return classMap[status] || 'badge-secondary';
  }

  /**
   * Obtiene el color de la barra de progreso según el health score
   */
  getProgressBarClass(): string {
    if (!this.financialSummary) return 'bg-secondary';
    
    const score = this.financialSummary.healthStatus.healthScore;
    if (score >= 80) return 'bg-success';
    if (score >= 60) return 'bg-warning';
    return 'bg-danger';
  }

  /**
   * Formatea moneda
   */
  formatCurrency(amount: number, currency: string = 'EUR'): string {
    return this.financeService.formatCurrency(amount, currency);
  }

  /**
   * Formatea porcentaje
   */
  formatPercentage(value: number): string {
    return `${value.toFixed(2)}%`;
  }

  /**
   * Obtiene el icono de tipo de cuenta
   */
  getAccountTypeIcon(accountType: string): string {
    return ACCOUNT_TYPE_ICONS[accountType] || 'bi-bank';
  }

  /**
   * Obtiene el color según el tipo de cuenta
   */
  getAccountTypeColor(accountType: string): string {
    const colorMap: { [key: string]: string } = {
      checking: 'primary',
      savings: 'success',
      credit: 'warning',
      investment: 'info',
      other: 'secondary'
    };
    return colorMap[accountType] || 'secondary';
  }

  /**
   * Obtiene la etiqueta del tipo de cuenta
   */
  getAccountTypeLabel(accountType: string): string {
    const labelMap: { [key: string]: string } = {
      checking: 'Cuenta Corriente',
      savings: 'Ahorro',
      credit: 'Crédito',
      investment: 'Inversión',
      other: 'Otra'
    };
    return labelMap[accountType] || accountType;
  }

  /**
   * Obtiene el icono de una categoría
   */
  getCategoryIcon(category: string, type: 'expense' | 'income' = 'expense'): string {
    if (type === 'expense') {
      return EXPENSE_CATEGORY_ICONS[category] || 'bi-three-dots';
    } else {
      return INCOME_CATEGORY_ICONS[category] || 'bi-cash-coin';
    }
  }

  /**
   * Obtiene la etiqueta de una categoría
   */
  getCategoryLabel(category: string, type: 'expense' | 'income' = 'expense'): string {
    const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    const found = categories.find(c => c.value === category);
    return found ? found.label : category;
  }

  /**
   * Obtiene la clase de badge para una categoría
   */
  getCategoryBadgeClass(category: string, type: 'expense' | 'income' | 'debt' = 'expense'): string {
    return getCategoryBadgeClass(category, type);
  }

  /**
   * Obtiene las top N categorías ordenadas por monto total
   */
  getTopCategories(
    categories: { [key: string]: { total: number; count: number; essential: number; nonEssential: number } },
    limit: number = 3
  ): Array<{ key: string; value: { total: number; count: number; essential: number; nonEssential: number } }> {
    return Object.entries(categories)
      .map(([key, value]) => ({ key, value }))
      .sort((a, b) => b.value.total - a.value.total)
      .slice(0, limit);
  }

  /**
   * Obtiene las rutas de transferencias como array
   */
  getTransferRoutes(): Array<{ route: string; data: any }> {
    if (!this.internalTransfersSummary || !this.internalTransfersSummary.transferRoutes) {
      return [];
    }
    return Object.entries(this.internalTransfersSummary.transferRoutes)
      .map(([route, data]) => ({ route, data }));
  }

  /**
   * Calcula el dinero comprometido (transferencias internas del mes)
   * Este dinero está reservado para gastos planificados
   */
  getCommittedMoney(): number {
    if (!this.internalTransfersSummary) {
      return 0;
    }
    return this.internalTransfersSummary.totalTransferred || 0;
  }

  /**
   * Calcula el dinero disponible real
   * Balance total - dinero comprometido = dinero realmente disponible
   */
  getAvailableMoney(): number {
    if (!this.financialSummary) {
      return 0;
    }
    const totalBalance = this.financialSummary.summary.totalBankBalance || 0;
    const committed = this.getCommittedMoney();
    return totalBalance - committed;
  }
}
