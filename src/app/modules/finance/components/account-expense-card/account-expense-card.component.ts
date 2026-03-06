import { Component, Input } from '@angular/core';
import { AccountExpenseBreakdown } from '../../interfaces/finance.interface';

@Component({
  selector: 'app-account-expense-card',
  templateUrl: './account-expense-card.component.html',
  styleUrls: ['./account-expense-card.component.scss']
})
export class AccountExpenseCardComponent {
  @Input() account!: AccountExpenseBreakdown;

  getAccountTypeColor(type: string): string {
    const colors: { [key: string]: string } = {
      'checking': '#4a9eff',
      'savings': '#6dbf8a',
      'credit': '#9b9bef',
      'investment': '#c9a84c',
      'other': '#7a7570'
    };
    return colors[type] || '#7a7570';
  }

  getAccountTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'checking': 'CORRIENTE',
      'savings': 'AHORRO',
      'credit': 'CRÉDITO',
      'investment': 'INVERSIÓN',
      'other': 'OTRA'
    };
    return labels[type] || 'OTRA';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }
}
