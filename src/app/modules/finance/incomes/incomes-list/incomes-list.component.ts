import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { FinanceService } from '../../services/finance.service';
import { AlertService } from '../../services/alert.service';
import { Income, BankAccount, INCOME_CATEGORIES } from '../../interfaces/finance.interface';

@Component({
  selector: 'app-incomes-list',
  templateUrl: './incomes-list.component.html',
  styleUrls: ['../../../../../assets/css/finance/incomes/_incomes-list.scss']
})
export class IncomesListComponent implements OnInit {
  incomes: Income[] = [];
  bankAccounts: BankAccount[] = [];
  loading = true;
  categories = INCOME_CATEGORIES;
  categoryFilter: 'all' | 'real' | 'internal_transfer' = 'all';
  
  // Advanced filters
  showAdvancedFilters = false;
  selectedBankAccountFilter: number | null = null;
  dateFromFilter: string = '';
  dateToFilter: string = '';
  amountMinFilter: number | null = null;
  amountMaxFilter: number | null = null;
  recurrentFilter: 'all' | 'recurring' | 'one-time' = 'all';

  constructor(
    private financeService: FinanceService,
    private router: Router,
    private cd: ChangeDetectorRef,
    private alertService: AlertService
  ) {
    console.log('💰 [IncomesList] Constructor called');
  }

  ngOnInit(): void {
    console.log('💰 [IncomesList] ngOnInit called');
    this.loadIncomes();
    this.loadBankAccounts();
  }

  loadIncomes(): void {
    console.log('💰 [IncomesList] Loading incomes...');
    this.loading = true;
    this.financeService.getIncomes().subscribe({
      next: (response) => {
        console.log('💰 [IncomesList] Response:', response);
        this.incomes = response.data || [];
        console.log('  ✅ Loaded', this.incomes.length, 'incomes');
        this.loading = false;
        console.log('  loading:', this.loading);
        this.cd.detectChanges();
      },
      error: (error) => {
        console.error('❌ [IncomesList] Error:', error);
        this.loading = false;
        this.cd.detectChanges();
      }
    });
  }

  loadBankAccounts(): void {
    this.financeService.getBankAccounts().subscribe({
      next: (response) => {
        this.bankAccounts = response.data || [];
        console.log('🏦 Loaded', this.bankAccounts.length, 'bank accounts');
        this.cd.detectChanges();
      },
      error: (error) => {
        console.error('Error loading bank accounts:', error);
      }
    });
  }

  createIncome(): void {
    this.router.navigate(['/finance/incomes/new']);
  }

  editIncome(id: number): void {
    this.router.navigate(['/finance/incomes/edit', id]);
  }

  deleteIncome(income: Income): void {
    this.alertService.confirmDelete(income.description || 'este ingreso').then((result) => {
      if (result.isConfirmed) {
        this.financeService.deleteIncome(income.id).subscribe({
          next: () => {
            this.alertService.deleted('Ingreso');
            this.loadIncomes();
          },
          error: (error) => {
            console.error('Error deleting income:', error);
            this.alertService.error('Error al eliminar', 'No se pudo eliminar el ingreso. Intenta nuevamente.');
          }
        });
      }
    });
  }

  getTotalIncome(): number {
    let filteredIncomes = this.incomes;
    
    if (this.categoryFilter === 'real') {
      filteredIncomes = this.incomes.filter(i => i.category !== 'internal_transfer');
    } else if (this.categoryFilter === 'internal_transfer') {
      filteredIncomes = this.incomes.filter(i => i.category === 'internal_transfer');
    }
    
    return filteredIncomes.reduce((sum, income) => sum + parseFloat(income.amount.toString()), 0);
  }

  getMonthlyRecurringIncome(): number {
    let filteredIncomes = this.incomes;
    
    if (this.categoryFilter === 'real') {
      filteredIncomes = this.incomes.filter(i => i.category !== 'internal_transfer');
    } else if (this.categoryFilter === 'internal_transfer') {
      filteredIncomes = this.incomes.filter(i => i.category === 'internal_transfer');
    }
    
    return filteredIncomes
      .filter(income => income.is_recurring && income.recurrence_type === 'monthly')
      .reduce((sum, income) => sum + parseFloat(income.amount.toString()), 0);
  }

  setCategoryFilter(filter: 'all' | 'real' | 'internal_transfer'): void {
    this.categoryFilter = filter;
    this.cd.detectChanges();
  }

  getFilteredIncomes(): Income[] {
    let filtered = [...this.incomes];
    
    // Category filter
    if (this.categoryFilter === 'real') {
      filtered = filtered.filter(i => i.category !== 'internal_transfer');
    } else if (this.categoryFilter === 'internal_transfer') {
      filtered = filtered.filter(i => i.category === 'internal_transfer');
    }
    
    // Bank account filter
    if (this.selectedBankAccountFilter) {
      filtered = filtered.filter(i => i.bank_account_id === this.selectedBankAccountFilter);
    }
    
    // Date range filter
    if (this.dateFromFilter) {
      filtered = filtered.filter(i => i.date >= this.dateFromFilter);
    }
    if (this.dateToFilter) {
      filtered = filtered.filter(i => i.date <= this.dateToFilter);
    }
    
    // Amount range filter
    if (this.amountMinFilter !== null) {
      filtered = filtered.filter(i => parseFloat(i.amount.toString()) >= this.amountMinFilter!);
    }
    if (this.amountMaxFilter !== null) {
      filtered = filtered.filter(i => parseFloat(i.amount.toString()) <= this.amountMaxFilter!);
    }
    
    // Recurrent filter
    if (this.recurrentFilter === 'recurring') {
      filtered = filtered.filter(i => i.is_recurring);
    } else if (this.recurrentFilter === 'one-time') {
      filtered = filtered.filter(i => !i.is_recurring);
    }
    
    return filtered;
  }

  getCategoryLabel(category: string): string {
    const cat = this.categories.find(c => c.value === category);
    return cat ? cat.label : category;
  }

  getCategoryIcon(category: string): string {
    const icons: { [key: string]: string } = {
      salary: 'bi-briefcase-fill',
      business: 'bi-building',
      freelance: 'bi-person-workspace',
      investment: 'bi-graph-up-arrow',
      rental: 'bi-house-fill',
      other: 'bi-cash-coin'
    };
    return icons[category] || 'bi-cash-coin';
  }

  getBankAccountName(bankAccountId: number): string {
    if (!bankAccountId) return 'Sin cuenta';
    const account = this.bankAccounts.find(acc => acc.id === bankAccountId);
    return account ? `${account.name} - ${account.bank_name || ''}`.trim() : 'Cargando...';
  }
  
  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }
  
  clearAdvancedFilters(): void {
    this.selectedBankAccountFilter = null;
    this.dateFromFilter = '';
    this.dateToFilter = '';
    this.amountMinFilter = null;
    this.amountMaxFilter = null;
    this.recurrentFilter = 'all';
    this.cd.detectChanges();
  }
  
  hasActiveFilters(): boolean {
    return !!this.selectedBankAccountFilter || 
           !!this.dateFromFilter || 
           !!this.dateToFilter || 
           this.amountMinFilter !== null || 
           this.amountMaxFilter !== null ||
           this.recurrentFilter !== 'all';
  }

  formatCurrency(amount: number | string): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(numAmount);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
