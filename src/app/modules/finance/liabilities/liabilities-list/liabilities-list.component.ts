import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FinanceService } from '../../services/finance.service';
import { Liability } from '../../interfaces/finance.interface';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-liabilities-list',
  templateUrl: './liabilities-list.component.html',
  styleUrls: ['./liabilities-list.component.scss']
})
export class LiabilitiesListComponent implements OnInit {
  liabilities: Liability[] = [];
  filteredLiabilities: Liability[] = [];
  isLoading = true;
  error: string | null = null;
  
  // Filtros
  selectedType = 'all';
  searchTerm = '';
  
  // Totales
  totalRemaining = 0;
  totalMonthly = 0;

  constructor(
    private financeService: FinanceService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadLiabilities();
  }

  loadLiabilities(): void {
    this.isLoading = true;
    this.error = null;

    this.financeService.listLiabilities().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.liabilities = response.data;
          this.applyFilters();
          this.calculateTotals();
          this.isLoading = false;
          this.cd.detectChanges();
        } else {
          this.error = 'No se pudieron cargar los pasivos';
          this.isLoading = false;
          this.cd.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error loading liabilities:', err);
        this.error = 'Error al cargar pasivos';
        this.isLoading = false;
        this.cd.detectChanges();
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.liabilities];

    // Filtro por tipo
    if (this.selectedType !== 'all') {
      filtered = filtered.filter(l => l.type === this.selectedType);
    }

    // Filtro por búsqueda
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(l => 
        l.name.toLowerCase().includes(term) ||
        (l.notes && l.notes.toLowerCase().includes(term))
      );
    }

    this.filteredLiabilities = filtered;
    this.calculateTotals();
  }

  calculateTotals(): void {
    this.totalRemaining = this.filteredLiabilities.reduce((sum, liability) => {
      return sum + (parseFloat(String(liability.remaining_amount || 0)));
    }, 0);

    this.totalMonthly = this.filteredLiabilities.reduce((sum, liability) => {
      return sum + (parseFloat(String(liability.monthly_payment || 0)));
    }, 0);
  }

  onTypeFilterChange(): void {
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  createLiability(): void {
    this.router.navigate(['/finance/liabilities/new']);
  }

  editLiability(liability: Liability): void {
    this.router.navigate(['/finance/liabilities/edit', liability.id]);
  }

  deleteLiability(liability: Liability): void {
    Swal.fire({
      title: '¿Eliminar pasivo?',
      html: `¿Estás seguro de eliminar <strong>${liability.name}</strong>?<br><small class="text-muted">Esta acción no se puede deshacer.</small>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.financeService.deleteLiability(liability.id!).subscribe({
          next: (response) => {
            if (response.success) {
              Swal.fire({
                title: '¡Eliminado!',
                text: 'El pasivo ha sido eliminado correctamente.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
              });
              this.loadLiabilities();
            }
          },
          error: (err) => {
            console.error('Error deleting liability:', err);
            Swal.fire({
              title: 'Error',
              text: 'No se pudo eliminar el pasivo',
              icon: 'error'
            });
          }
        });
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

  formatDate(date: string | Date | null): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  getTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'credit_card': 'Tarjeta',
      'loan': 'Préstamo',
      'mortgage': 'Hipoteca',
      'debt': 'Deuda',
      'other': 'Otro'
    };
    return labels[type] || type;
  }

  getTypeBadgeClass(type: string): string {
    const classes: { [key: string]: string } = {
      'credit_card': 'badge-warning',
      'loan': 'badge-info',
      'mortgage': 'badge-danger',
      'debt': 'badge-secondary',
      'other': 'badge-dark'
    };
    return classes[type] || 'badge-secondary';
  }

  getProgressPercentage(liability: Liability): number {
    if (!liability.total_amount || liability.total_amount === 0) return 0;
    const paid = liability.total_amount - (liability.remaining_amount || 0);
    return Math.round((paid / liability.total_amount) * 100);
  }

  getProgressBarClass(percentage: number): string {
    if (percentage < 25) return 'bg-danger';
    if (percentage < 50) return 'bg-warning';
    if (percentage < 75) return 'bg-info';
    return 'bg-success';
  }
}
