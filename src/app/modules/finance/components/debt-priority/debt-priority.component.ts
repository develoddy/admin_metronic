import { Component, Input } from '@angular/core';
import { DebtPriorityItem } from '../../interfaces/finance.interface';

@Component({
  selector: 'app-debt-priority',
  templateUrl: './debt-priority.component.html',
  styleUrls: ['../../../../../assets/css/finance/components/_debt-priority.scss']
})
export class DebtPriorityComponent {
  @Input() debts: DebtPriorityItem[] = [];

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(2)}%`;
  }

  getPriorityBadgeClass(priority: number): string {
    if (priority === 1) return 'badge-danger';
    if (priority === 2) return 'badge-warning';
    if (priority === 3) return 'badge-info';
    return 'badge-secondary';
  }
}
