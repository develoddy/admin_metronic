import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FinanceService } from '../../services/finance.service';
import { AlertService } from '../../services/alert.service';
import { Expense, BankAccount, EXPENSE_CATEGORIES, EXPENSE_CATEGORY_ICONS, getCategoryBadgeClass } from '../../interfaces/finance.interface';

interface ExpensesByAccount {
  account: BankAccount;
  expenses: Expense[];
  total: number;
  essential: number;
  nonEssential: number;
  initialBalance: number; // Balance al inicio del periodo
  finalBalance: number; // Balance después de todos los gastos
}

@Component({
  selector: 'app-expenses-list',
  templateUrl: './expenses-list.component.html',
  styleUrls: ['./expenses-list.component.scss']
})
export class ExpensesListComponent implements OnInit {
  expenses: Expense[] = [];
  bankAccounts: BankAccount[] = [];
  expensesByAccount: ExpensesByAccount[] = [];
  loading = true;
  categories = EXPENSE_CATEGORIES;
  selectedAccountId: number | null = null;
  viewMode: 'byAccount' | 'all' = 'byAccount';
  categoryFilter: 'all' | 'real' | 'internal_transfer' = 'all';
  
  // Advanced filters
  showAdvancedFilters = false;
  selectedBankAccountFilter: number | null = null;
  dateFromFilter: string = '';
  dateToFilter: string = '';
  amountMinFilter: number | null = null;
  amountMaxFilter: number | null = null;
  essentialFilter: 'all' | 'essential' | 'non-essential' = 'all';

  constructor(
    private financeService: FinanceService,
    private router: Router,
    private route: ActivatedRoute,
    private cd: ChangeDetectorRef,
    private alertService: AlertService
  ) {
    console.log('💳 [ExpensesList] Constructor called');
  }

  ngOnInit(): void {
    console.log('💳 [ExpensesList] ngOnInit called');
    
    // Check for query param to filter by account
    this.route.queryParams.subscribe(params => {
      if (params['bank_account_id']) {
        this.selectedAccountId = +params['bank_account_id'];
      }
    });
    
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    Promise.all([
      this.financeService.getBankAccounts().toPromise(),
      this.financeService.getExpenses().toPromise()
    ]).then(([accountsResponse, expensesResponse]) => {
      this.bankAccounts = accountsResponse.data || [];
      this.expenses = expensesResponse.data || [];
      this.organizeExpensesByAccount();
      this.loading = false;
      console.log('  loading:', this.loading);
      this.cd.detectChanges();
    }).catch(error => {
      console.error('❌ [ExpensesList] Error:', error);
      this.loading = false;
      this.cd.detectChanges();
    });
  }

  organizeExpensesByAccount(): void {
    this.expensesByAccount = this.bankAccounts.map(account => {
      // Filtrar gastos según categoryFilter
      let accountExpenses = this.expenses.filter(e => e.bank_account_id === account.id);
      
      if (this.categoryFilter === 'real') {
        // Solo movimientos reales (excluir internal_transfer)
        accountExpenses = accountExpenses.filter(e => e.category !== 'internal_transfer');
      } else if (this.categoryFilter === 'internal_transfer') {
        // Solo transferencias internas
        accountExpenses = accountExpenses.filter(e => e.category === 'internal_transfer');
      }
      // Si categoryFilter === 'all', no filtramos
      
      // Apply advanced filters
      if (this.selectedBankAccountFilter) {
        if (account.id !== this.selectedBankAccountFilter) {
          accountExpenses = [];
        }
      }
      
      if (this.dateFromFilter) {
        accountExpenses = accountExpenses.filter(e => e.date >= this.dateFromFilter);
      }
      if (this.dateToFilter) {
        accountExpenses = accountExpenses.filter(e => e.date <= this.dateToFilter);
      }
      
      if (this.amountMinFilter !== null) {
        accountExpenses = accountExpenses.filter(e => parseFloat(e.amount.toString()) >= this.amountMinFilter!);
      }
      if (this.amountMaxFilter !== null) {
        accountExpenses = accountExpenses.filter(e => parseFloat(e.amount.toString()) <= this.amountMaxFilter!);
      }
      
      if (this.essentialFilter === 'essential') {
        accountExpenses = accountExpenses.filter(e => e.is_essential);
      } else if (this.essentialFilter === 'non-essential') {
        accountExpenses = accountExpenses.filter(e => !e.is_essential);
      }

      // Ordenar gastos por fecha (más reciente primero)
      accountExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const total = accountExpenses.reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0);
      const essential = accountExpenses
        .filter(e => e.is_essential)
        .reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0);
      const nonEssential = total - essential;

      // Calcular balances
      const currentBalance = parseFloat(account.balance.toString());
      // Balance inicial = balance actual + total de gastos (porque los gastos ya se restaron)
      const initialBalance = currentBalance + total;
      const finalBalance = currentBalance;

      return {
        account,
        expenses: accountExpenses,
        total,
        essential,
        nonEssential,
        initialBalance,
        finalBalance
      };
    }).filter(item => item.expenses.length > 0); // Solo mostrar cuentas con gastos
  }

  createExpense(): void {
    this.router.navigate(['/finance/expenses/new']);
  }

  editExpense(id: number): void {
    this.router.navigate(['/finance/expenses/edit', id]);
  }

  deleteExpense(expense: Expense): void {
    this.alertService.confirmDelete(expense.description || 'este gasto').then((result) => {
      if (result.isConfirmed) {
        this.financeService.deleteExpense(expense.id).subscribe({
          next: () => {
            this.alertService.deleted('Gasto');
            this.loadData();
          },
          error: (error) => {
            console.error('Error deleting expense:', error);
            this.alertService.error('Error al eliminar', 'No se pudo eliminar el gasto. Intenta nuevamente.');
          }
        });
      }
    });
  }

  getTotalExpenses(): number {
    let filteredExpenses = this.expenses;
    
    if (this.categoryFilter === 'real') {
      filteredExpenses = this.expenses.filter(e => e.category !== 'internal_transfer');
    } else if (this.categoryFilter === 'internal_transfer') {
      filteredExpenses = this.expenses.filter(e => e.category === 'internal_transfer');
    }
    
    return filteredExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount.toString()), 0);
  }

  getEssentialExpenses(): number {
    let filteredExpenses = this.expenses;
    
    if (this.categoryFilter === 'real') {
      filteredExpenses = this.expenses.filter(e => e.category !== 'internal_transfer');
    } else if (this.categoryFilter === 'internal_transfer') {
      filteredExpenses = this.expenses.filter(e => e.category === 'internal_transfer');
    }
    
    return filteredExpenses
      .filter(expense => expense.is_essential)
      .reduce((sum, expense) => sum + parseFloat(expense.amount.toString()), 0);
  }

  getNonEssentialExpenses(): number {
    let filteredExpenses = this.expenses;
    
    if (this.categoryFilter === 'real') {
      filteredExpenses = this.expenses.filter(e => e.category !== 'internal_transfer');
    } else if (this.categoryFilter === 'internal_transfer') {
      filteredExpenses = this.expenses.filter(e => e.category === 'internal_transfer');
    }
    
    return filteredExpenses
      .filter(expense => !expense.is_essential)
      .reduce((sum, expense) => sum + parseFloat(expense.amount.toString()), 0);
  }

  getCategoryLabel(category: string): string {
    const cat = this.categories.find(c => c.value === category);
    return cat ? cat.label : category;
  }

  getCategoryIcon(category: string): string {
    return EXPENSE_CATEGORY_ICONS[category] || 'bi-three-dots';
  }

  getCategoryBadgeClass(category: string): string {
    return getCategoryBadgeClass(category, 'expense');
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
    this.essentialFilter = 'all';
    this.organizeExpensesByAccount();
    this.cd.detectChanges();
  }
  
  hasActiveFilters(): boolean {
    return !!this.selectedBankAccountFilter || 
           !!this.dateFromFilter || 
           !!this.dateToFilter || 
           this.amountMinFilter !== null || 
           this.amountMaxFilter !== null ||
           this.essentialFilter !== 'all';
  }

  getFilteredExpensesCount(): number {
    return this.expensesByAccount.reduce((total, item) => total + item.expenses.length, 0);
  }

  formatCurrency(amount: number): string {
    return this.financeService.formatCurrency(amount);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'byAccount' ? 'all' : 'byAccount';
  }

  setCategoryFilter(filter: 'all' | 'real' | 'internal_transfer'): void {
    this.categoryFilter = filter;
    this.organizeExpensesByAccount();
    this.cd.detectChanges();
  }

  getAccountTypeIcon(accountType: string): string {
    const icons: { [key: string]: string } = {
      checking: 'bi-wallet2',
      savings: 'bi-piggy-bank',
      credit: 'bi-credit-card',
      investment: 'bi-graph-up',
      other: 'bi-bank'
    };
    return icons[accountType] || 'bi-bank';
  }

  /**
   * Calcula el balance restante después de un gasto específico
   * @param item - Datos de la cuenta con sus gastos
   * @param expenseIndex - Índice del gasto en la lista (ordenada por fecha desc)
   */
  getRemainingBalance(item: ExpensesByAccount, expenseIndex: number): number {
    // Comenzamos con el balance inicial
    let balance = item.initialBalance;
    
    // Restamos los gastos hasta el índice actual (inclusive)
    for (let i = 0; i <= expenseIndex; i++) {
      balance -= parseFloat(item.expenses[i].amount.toString());
    }
    
    return balance;
  }

  /**
   * Determina el color del balance según su valor
   */
  getBalanceColorClass(balance: number): string {
    if (balance < 0) return 'text-danger';
    if (balance < 100) return 'text-warning';
    return 'text-success';
  }
}
