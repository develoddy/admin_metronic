import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FinanceService } from '../../services/finance.service';
import { AlertService } from '../../services/alert.service';
import { BankAccount } from '../../interfaces/finance.interface';

@Component({
  selector: 'app-bank-accounts-list',
  templateUrl: './bank-accounts-list.component.html',
  styleUrls: ['./bank-accounts-list.component.scss']
})
export class BankAccountsListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  bankAccounts: BankAccount[] = [];
  isLoading = false;
  error: string | null = null;

  constructor(
    private financeService: FinanceService,
    private router: Router,
    private cd: ChangeDetectorRef,
    private alertService: AlertService
  ) {
    console.log('🏦 [BankAccountsList] Constructor called');
  }

  ngOnInit(): void {
    console.log('🏦 [BankAccountsList] ngOnInit called');
    this.loadBankAccounts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadBankAccounts(): void {
    console.log('🏦 [BankAccountsList] Loading bank accounts...');
    this.isLoading = true;
    this.error = null;

    this.financeService.listBankAccounts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('🏦 [BankAccountsList] Response:', response);
          if (response.success && response.data) {
            this.bankAccounts = response.data;
            console.log('  ✅ Loaded', this.bankAccounts.length, 'accounts');
          }
          this.isLoading = false;
          console.log('  isLoading:', this.isLoading);
          this.cd.detectChanges();
        },
        error: (err) => {
          console.error('❌ [BankAccountsList] Error:', err);
          this.error = 'Error al cargar las cuentas bancarias';
          this.isLoading = false;
          this.cd.detectChanges();
        }
      });
  }

  createAccount(): void {
    this.router.navigate(['/finance/bank-accounts/new']);
  }

  editAccount(id: number): void {
    this.router.navigate(['/finance/bank-accounts/edit', id]);
  }

  deleteAccount(account: BankAccount): void {
    if (!account.id) return;

    this.alertService.confirmDelete(account.name).then((result) => {
      if (result.isConfirmed) {
        this.financeService.deleteBankAccount(account.id!)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.alertService.deleted('Cuenta bancaria');
              this.loadBankAccounts();
            },
            error: (err) => {
              console.error('Error deleting account:', err);
              this.alertService.error('Error al eliminar', 'No se pudo eliminar la cuenta bancaria. Intenta nuevamente.');
            }
          });
      }
    });
  }

  getTotalBalance(): number {
    return this.bankAccounts
      .filter(acc => acc.is_active)
      .reduce((sum, acc) => sum + parseFloat(acc.balance?.toString() || '0'), 0);
  }

  getActiveAccountsCount(): number {
    return this.bankAccounts.filter(acc => acc.is_active).length;
  }

  getAccountTypeLabel(type: string): string {
    const labels = {
      checking: 'Cuenta Corriente',
      savings: 'Ahorro',
      credit: 'Crédito',
      investment: 'Inversión',
      other: 'Otra'
    };
    return labels[type] || type;
  }

  getAccountTypeIcon(type: string): string {
    const icons = {
      checking: 'bi-credit-card',
      savings: 'bi-piggy-bank',
      credit: 'bi-credit-card-2-front',
      investment: 'bi-graph-up-arrow',
      other: 'bi-wallet2'
    };
    return icons[type] || 'bi-wallet2';
  }

  formatCurrency(amount: number, currency: string = 'EUR'): string {
    return this.financeService.formatCurrency(amount, currency);
  }
}
