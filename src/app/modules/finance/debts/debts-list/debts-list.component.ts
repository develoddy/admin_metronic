import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { FinanceService } from '../../services/finance.service';
import { AlertService } from '../../services/alert.service';
import { Debt, DEBT_TYPES, DEBT_STATUS, DEBT_PRIORITIES } from '../../interfaces/finance.interface';

@Component({
  selector: 'app-debts-list',
  templateUrl: './debts-list.component.html',
  styleUrls: ['../../../../../assets/css/finance/debts/_debts-list.scss']
})
export class DebtsListComponent implements OnInit {
  debts: Debt[] = [];
  loading = true;
  debtTypes = DEBT_TYPES;
  debtStatus = DEBT_STATUS;
  debtPriorities = DEBT_PRIORITIES;

  constructor(
    private financeService: FinanceService,
    private router: Router,
    private cd: ChangeDetectorRef,
    private alertService: AlertService
  ) {
    console.log('📝 [DebtsList] Constructor called');
  }

  ngOnInit(): void {
    console.log('📝 [DebtsList] ngOnInit called');
    this.loadDebts();
  }

  loadDebts(): void {
    console.log('📝 [DebtsList] Loading debts...');
    this.loading = true;
    this.financeService.getDebts().subscribe({
      next: (response) => {
        console.log('📝 [DebtsList] Response:', response);
        this.debts = response.data || [];
        console.log('  ✅ Loaded', this.debts.length, 'debts');
        this.loading = false;
        console.log('  loading:', this.loading);
        this.cd.detectChanges();
      },
      error: (error) => {
        console.error('❌ [DebtsList] Error:', error);
        this.loading = false;
        this.cd.detectChanges();
      }
    });
  }

  createDebt(): void {
    this.router.navigate(['/finance/debts/new']);
  }

  editDebt(id: number): void {
    this.router.navigate(['/finance/debts/edit', id]);
  }

  deleteDebt(debt: Debt): void {
    this.alertService.confirmDelete(debt.creditor || 'esta deuda').then((result) => {
      if (result.isConfirmed) {
        this.financeService.deleteDebt(debt.id).subscribe({
          next: () => {
            this.alertService.deleted('Deuda');
            this.loadDebts();
          },
          error: (error) => {
            console.error('Error deleting debt:', error);
            this.alertService.error('Error al eliminar', 'No se pudo eliminar la deuda. Intenta nuevamente.');
          }
        });
      }
    });
  }

  getTotalDebt(): number {
    return this.debts.reduce((sum, debt) => sum + parseFloat(debt.remaining_balance.toString()), 0);
  }

  getTotalOriginalAmount(): number {
    return this.debts.reduce((sum, debt) => sum + parseFloat(debt.original_amount.toString()), 0);
  }

  getTotalMonthlyPayment(): number {
    return this.debts
      .filter(debt => debt.status === 'active')
      .reduce((sum, debt) => sum + parseFloat(debt.monthly_payment.toString()), 0);
  }

  getActiveDebtsCount(): number {
    return this.debts.filter(debt => debt.status === 'active').length;
  }

  getDebtTypeLabel(type: string): string {
    const debtType = this.debtTypes.find(t => t.value === type);
    return debtType ? debtType.label : type;
  }

  getDebtTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      credit_card: 'bi-credit-card-fill',
      personal_loan: 'bi-wallet2',
      mortgage: 'bi-house-fill',
      student_loan: 'bi-book-fill',
      car_loan: 'bi-car-front-fill',
      medical: 'bi-heart-pulse-fill',
      other: 'bi-three-dots'
    };
    return icons[type] || 'bi-three-dots';
  }

  getStatusLabel(status: string): string {
    const stat = this.debtStatus.find(s => s.value === status);
    return stat ? stat.label : status;
  }

  getStatusBadgeClass(status: string): string {
    const classes: { [key: string]: string } = {
      active: 'badge-light-warning',
      paid_off: 'badge-light-success',
      defaulted: 'badge-light-danger',
      refinanced: 'badge-light-info'
    };
    return classes[status] || 'badge-light';
  }

  getPriorityLabel(priority: string): string {
    const prio = this.debtPriorities.find(p => p.value === priority);
    return prio ? prio.label : priority;
  }

  getPriorityBadgeClass(priority: string): string {
    const classes: { [key: string]: string } = {
      high: 'badge-danger',
      medium: 'badge-warning',
      low: 'badge-info'
    };
    return classes[priority] || 'badge-light';
  }

  calculateProgress(originalAmount: number, remainingBalance: number): number {
    if (originalAmount <= 0) return 0;
    const paid = originalAmount - remainingBalance;
    return Math.round((paid / originalAmount) * 100);
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

  getAccountIcon(accountType: string): string {
    const icons: { [key: string]: string } = {
      checking: 'bi-wallet2 text-primary',
      savings: 'bi-piggy-bank-fill text-success',
      credit: 'bi-credit-card-fill text-warning',
      investment: 'bi-graph-up-arrow text-info',
      other: 'bi-bank text-secondary'
    };
    return icons[accountType] || 'bi-bank text-secondary';
  }
}
