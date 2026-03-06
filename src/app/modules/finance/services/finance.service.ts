import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { finalize, tap, catchError } from 'rxjs/operators';
import { AuthService } from '../../auth';
import { URL_SERVICIOS } from 'src/app/config/config';
import {
  BankAccount,
  Income,
  Expense,
  Debt,
  MonthlyBalance,
  DebtRatio,
  SavingsRate,
  FinancialHealth,
  FinancialSummary,
  InternalTransferRequest,
  InternalTransferResponse,
  InternalTransfersSummary,
  ApiResponse,
  Asset,
  Liability,
  NetWorth
} from '../interfaces/finance.interface';

@Injectable({
  providedIn: 'root'
})
export class FinanceService {
  isLoading$: Observable<boolean>;
  isLoadingSubject: BehaviorSubject<boolean>;

  constructor(
    private http: HttpClient,
    public authService: AuthService
  ) {
    this.isLoadingSubject = new BehaviorSubject<boolean>(false);
    this.isLoading$ = this.isLoadingSubject.asObservable();
  }

  /**
   * Obtiene los headers con el token de autenticación
   */
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({ 'token': this.authService.token });
  }

  // ============================================
  // BANK ACCOUNTS - Cuentas Bancarias
  // ============================================

  listBankAccounts(): Observable<ApiResponse<BankAccount[]>> {
    console.log('🏦 [FinanceService] Calling listBankAccounts');
    this.isLoadingSubject.next(true);
    const url = `${URL_SERVICIOS}/finance/bank-accounts`;
    console.log('  URL:', url);
    return this.http.get<ApiResponse<BankAccount[]>>(url, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  getBankAccount(id: number): Observable<ApiResponse<BankAccount>> {
    this.isLoadingSubject.next(true);
    const url = `${URL_SERVICIOS}/finance/bank-accounts/${id}`;
    return this.http.get<ApiResponse<BankAccount>>(url, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  createBankAccount(data: BankAccount): Observable<ApiResponse<BankAccount>> {
    this.isLoadingSubject.next(true);
    const url = `${URL_SERVICIOS}/finance/bank-accounts`;
    return this.http.post<ApiResponse<BankAccount>>(url, data, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  updateBankAccount(id: number, data: BankAccount): Observable<ApiResponse<BankAccount>> {
    this.isLoadingSubject.next(true);
    const url = `${URL_SERVICIOS}/finance/bank-accounts/${id}`;
    return this.http.put<ApiResponse<BankAccount>>(url, data, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  deleteBankAccount(id: number): Observable<ApiResponse<void>> {
    this.isLoadingSubject.next(true);
    const url = `${URL_SERVICIOS}/finance/bank-accounts/${id}`;
    return this.http.delete<ApiResponse<void>>(url, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  // ============================================
  // INCOMES - Ingresos
  // ============================================

  listIncomes(params?: { startDate?: string; endDate?: string; category?: string }): Observable<ApiResponse<Income[]>> {    console.log('💰 [FinanceService] Calling listIncomes');    this.isLoadingSubject.next(true);
    let url = `${URL_SERVICIOS}/finance/incomes`;
    
    if (params) {
      const queryParams = new URLSearchParams();
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.category) queryParams.append('category', params.category);
      
      const queryString = queryParams.toString();
      if (queryString) url += `?${queryString}`;
    }
    
    console.log('  URL:', url);
    return this.http.get<ApiResponse<Income[]>>(url, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  getIncome(id: number): Observable<ApiResponse<Income>> {
    this.isLoadingSubject.next(true);
    const url = `${URL_SERVICIOS}/finance/incomes/${id}`;
    return this.http.get<ApiResponse<Income>>(url, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  createIncome(data: Income): Observable<ApiResponse<Income>> {
    this.isLoadingSubject.next(true);
    const url = `${URL_SERVICIOS}/finance/incomes`;
    return this.http.post<ApiResponse<Income>>(url, data, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  updateIncome(id: number, data: Income): Observable<ApiResponse<Income>> {
    this.isLoadingSubject.next(true);
    const url = `${URL_SERVICIOS}/finance/incomes/${id}`;
    return this.http.put<ApiResponse<Income>>(url, data, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  deleteIncome(id: number): Observable<ApiResponse<void>> {
    this.isLoadingSubject.next(true);
    const url = `${URL_SERVICIOS}/finance/incomes/${id}`;
    return this.http.delete<ApiResponse<void>>(url, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  // ============================================
  // EXPENSES - Gastos
  // ============================================

  listExpenses(params?: { 
    startDate?: string; 
    endDate?: string; 
    category?: string;
    is_essential?: boolean;
  }): Observable<ApiResponse<Expense[]>> {
    console.log('💳 [FinanceService] Calling listExpenses');
    this.isLoadingSubject.next(true);
    let url = `${URL_SERVICIOS}/finance/expenses`;
    
    if (params) {
      const queryParams = new URLSearchParams();
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.category) queryParams.append('category', params.category);
      if (params.is_essential !== undefined) queryParams.append('is_essential', params.is_essential.toString());
      
      const queryString = queryParams.toString();
      if (queryString) url += `?${queryString}`;
    }
    
    console.log('  URL:', url);
    return this.http.get<ApiResponse<Expense[]>>(url, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  getExpense(id: number): Observable<ApiResponse<Expense>> {
    this.isLoadingSubject.next(true);
    const url = `${URL_SERVICIOS}/finance/expenses/${id}`;
    return this.http.get<ApiResponse<Expense>>(url, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  createExpense(data: Expense): Observable<ApiResponse<Expense>> {
    this.isLoadingSubject.next(true);
    const url = `${URL_SERVICIOS}/finance/expenses`;
    return this.http.post<ApiResponse<Expense>>(url, data, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  updateExpense(id: number, data: Expense): Observable<ApiResponse<Expense>> {
    this.isLoadingSubject.next(true);
    const url = `${URL_SERVICIOS}/finance/expenses/${id}`;
    return this.http.put<ApiResponse<Expense>>(url, data, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  deleteExpense(id: number): Observable<ApiResponse<void>> {
    this.isLoadingSubject.next(true);
    const url = `${URL_SERVICIOS}/finance/expenses/${id}`;
    return this.http.delete<ApiResponse<void>>(url, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  // ============================================
  // DEBTS - Deudas
  // ============================================

  listDebts(status?: string): Observable<ApiResponse<Debt[]>> {
    console.log('📝 [FinanceService] Calling listDebts');
    this.isLoadingSubject.next(true);
    let url = `${URL_SERVICIOS}/finance/debts`;
    if (status) url += `?status=${status}`;
    
    console.log('  URL:', url);
    return this.http.get<ApiResponse<Debt[]>>(url, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  getDebt(id: number): Observable<ApiResponse<Debt>> {
    this.isLoadingSubject.next(true);
    const url = `${URL_SERVICIOS}/finance/debts/${id}`;
    return this.http.get<ApiResponse<Debt>>(url, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  createDebt(data: Debt): Observable<ApiResponse<Debt>> {
    this.isLoadingSubject.next(true);
    const url = `${URL_SERVICIOS}/finance/debts`;
    return this.http.post<ApiResponse<Debt>>(url, data, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  updateDebt(id: number, data: Debt): Observable<ApiResponse<Debt>> {
    this.isLoadingSubject.next(true);
    const url = `${URL_SERVICIOS}/finance/debts/${id}`;
    return this.http.put<ApiResponse<Debt>>(url, data, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  deleteDebt(id: number): Observable<ApiResponse<void>> {
    this.isLoadingSubject.next(true);
    const url = `${URL_SERVICIOS}/finance/debts/${id}`;
    return this.http.delete<ApiResponse<void>>(url, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  // ============================================
  // INTERNAL TRANSFERS - Transferencias Internas
  // ============================================

  createInternalTransfer(transfer: InternalTransferRequest): Observable<ApiResponse<InternalTransferResponse>> {
    this.isLoadingSubject.next(true);
    const url = `${URL_SERVICIOS}/finance/transfer`;
    return this.http.post<ApiResponse<InternalTransferResponse>>(url, transfer, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  getInternalTransfers(month?: string): Observable<ApiResponse<InternalTransfersSummary>> {
    console.log('🔄 [FinanceService] Calling getInternalTransfers', month);
    this.isLoadingSubject.next(true);
    let url = `${URL_SERVICIOS}/finance/internal-transfers`;
    if (month) url += `?month=${month}`;
    return this.http.get<ApiResponse<InternalTransfersSummary>>(url, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  // ============================================
  // FINANCIAL ANALYSIS - Análisis Financiero
  // ============================================

  getMonthlyBalance(month?: string): Observable<ApiResponse<MonthlyBalance>> {
    this.isLoadingSubject.next(true);
    let url = `${URL_SERVICIOS}/finance/analysis/monthly-balance`;
    if (month) url += `?month=${month}`;
    
    return this.http.get<ApiResponse<MonthlyBalance>>(url, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  getDebtRatio(): Observable<ApiResponse<DebtRatio>> {
    this.isLoadingSubject.next(true);
    const url = `${URL_SERVICIOS}/finance/analysis/debt-ratio`;
    return this.http.get<ApiResponse<DebtRatio>>(url, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  getSavingsRate(month?: string): Observable<ApiResponse<SavingsRate>> {
    this.isLoadingSubject.next(true);
    let url = `${URL_SERVICIOS}/finance/analysis/savings-rate`;
    if (month) url += `?month=${month}`;
    
    return this.http.get<ApiResponse<SavingsRate>>(url, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  getFinancialHealth(month?: string): Observable<ApiResponse<FinancialHealth>> {
    this.isLoadingSubject.next(true);
    let url = `${URL_SERVICIOS}/finance/analysis/financial-health`;
    if (month) url += `?month=${month}`;
    
    return this.http.get<ApiResponse<FinancialHealth>>(url, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  getFinancialDashboard(month?: string): Observable<ApiResponse<FinancialSummary>> {
    console.log('📊 [FinanceService] Calling getFinancialDashboard');
    console.log('  Month param:', month);
    this.isLoadingSubject.next(true);
    let url = `${URL_SERVICIOS}/finance/analysis/dashboard`;
    if (month) url += `?month=${month}`;
    
    console.log('  URL:', url);
    return this.http.get<ApiResponse<FinancialSummary>>(url, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  // ============================================
  // UTILITY METHODS - Métodos de Utilidad
  // ============================================

  /**
   * Formatea un monto con el símbolo de moneda
   */
  formatCurrency(amount: number, currency: string = 'EUR'): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  /**
   * Obtiene el color del estado financiero
   */
  getHealthColor(status: string): string {
    const colors = {
      'VERDE': 'success',
      'AMARILLO': 'warning',
      'ROJO': 'danger'
    };
    return colors[status] || 'secondary';
  }

  /**
   * Calcula el porcentaje de progreso de pago de una deuda
   */
  calculateDebtProgress(originalAmount: number, remainingBalance: number): number {
    if (originalAmount <= 0) return 0;
    const paid = originalAmount - remainingBalance;
    return Math.round((paid / originalAmount) * 100);
  }

  /**
   * Obtiene el mes actual en formato YYYY-MM
   */
  getCurrentMonth(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  /**
   * Obtiene el mes anterior en formato YYYY-MM
   */
  getPreviousMonth(): string {
    const now = new Date();
    now.setMonth(now.getMonth() - 1);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  /**
   * Formatea una fecha YYYY-MM-DD a formato legible
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return date.toLocaleDateString('es-ES', options);
  }

  // ============================================
  // ALIAS METHODS - Métodos Alias para Componentes
  // ============================================

  // Alias for Bank Accounts
  getBankAccounts = this.listBankAccounts.bind(this);

  // Alias for Incomes
  getIncomes = this.listIncomes.bind(this);

  // Alias for Expenses
  getExpenses = this.listExpenses.bind(this);

  // Alias for Debts
  getDebts = this.listDebts.bind(this);

  // ============================================
  // ASSETS - Activos (Patrimonio)
  // ============================================

  listAssets(): Observable<ApiResponse<Asset[]>> {
    console.log('💰 [FinanceService] Calling listAssets');
    this.isLoadingSubject.next(true);
    const url = `${URL_SERVICIOS}/finance/assets`;
    return this.http.get<ApiResponse<Asset[]>>(url, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  getAsset(id: number): Observable<ApiResponse<Asset>> {
    this.isLoadingSubject.next(true);
    const url = `${URL_SERVICIOS}/finance/assets/${id}`;
    return this.http.get<ApiResponse<Asset>>(url, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  createAsset(data: Partial<Asset>): Observable<ApiResponse<Asset>> {
    this.isLoadingSubject.next(true);
    const url = `${URL_SERVICIOS}/finance/assets`;
    return this.http.post<ApiResponse<Asset>>(url, data, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  updateAsset(id: number, data: Partial<Asset>): Observable<ApiResponse<Asset>> {
    this.isLoadingSubject.next(true);
    const url = `${URL_SERVICIOS}/finance/assets/${id}`;
    return this.http.put<ApiResponse<Asset>>(url, data, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  deleteAsset(id: number): Observable<ApiResponse<void>> {
    this.isLoadingSubject.next(true);
    const url = `${URL_SERVICIOS}/finance/assets/${id}`;
    return this.http.delete<ApiResponse<void>>(url, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  // ============================================
  // LIABILITIES - Pasivos (Patrimonio)
  // ============================================

  listLiabilities(): Observable<ApiResponse<Liability[]>> {
    console.log('📉 [FinanceService] Calling listLiabilities');
    this.isLoadingSubject.next(true);
    const url = `${URL_SERVICIOS}/finance/liabilities`;
    return this.http.get<ApiResponse<Liability[]>>(url, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  getLiability(id: number): Observable<ApiResponse<Liability>> {
    this.isLoadingSubject.next(true);
    const url = `${URL_SERVICIOS}/finance/liabilities/${id}`;
    return this.http.get<ApiResponse<Liability>>(url, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  createLiability(data: Partial<Liability>): Observable<ApiResponse<Liability>> {
    this.isLoadingSubject.next(true);
    const url = `${URL_SERVICIOS}/finance/liabilities`;
    return this.http.post<ApiResponse<Liability>>(url, data, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  updateLiability(id: number, data: Partial<Liability>): Observable<ApiResponse<Liability>> {
    this.isLoadingSubject.next(true);
    const url = `${URL_SERVICIOS}/finance/liabilities/${id}`;
    return this.http.put<ApiResponse<Liability>>(url, data, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  deleteLiability(id: number): Observable<ApiResponse<void>> {
    this.isLoadingSubject.next(true);
    const url = `${URL_SERVICIOS}/finance/liabilities/${id}`;
    return this.http.delete<ApiResponse<void>>(url, { headers: this.getHeaders() }).pipe(
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  // ============================================
  // NET WORTH - Patrimonio Neto
  // ============================================

  getNetWorth(): Observable<ApiResponse<NetWorth>> {
    console.log('💎 [FinanceService] Calling getNetWorth');
    this.isLoadingSubject.next(true);
    const url = `${URL_SERVICIOS}/finance/net-worth`;
    console.log('   URL:', url);
    console.log('   Token:', this.authService.token ? 'Present' : 'Missing');
    
    return this.http.get<ApiResponse<NetWorth>>(url, { headers: this.getHeaders() }).pipe(
      tap(response => {
        console.log('💎 [FinanceService] Response received from backend:', response);
        console.log('   Success:', response.success);
        console.log('   Data:', response.data);
      }),
      catchError(error => {
        console.error('💎 [FinanceService] HTTP ERROR:', error);
        console.error('   Status:', error.status);
        console.error('   StatusText:', error.statusText);
        console.error('   Error body:', error.error);
        console.error('   URL:', error.url);
        return throwError(() => error);
      }),
      finalize(() => {
        console.log('💎 [FinanceService] Request finalized');
        this.isLoadingSubject.next(false);
      })
    );
  }

  // Alias for Assets
  getAssets = this.listAssets.bind(this);

  // Alias for Liabilities
  getLiabilities = this.listLiabilities.bind(this);
}
