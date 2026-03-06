import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FinanceService } from '../../services/finance.service';
import { Asset } from '../../interfaces/finance.interface';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-assets-list',
  templateUrl: './assets-list.component.html',
  styleUrls: ['../../../../../assets/css/finance/assets/_assets-list.scss']
})
export class AssetsListComponent implements OnInit {
  assets: Asset[] = [];
  filteredAssets: Asset[] = [];
  isLoading = true;
  error: string | null = null;
  
  // Filtros
  selectedType = 'all';
  searchTerm = '';
  
  // Totales
  totalValue = 0;

  constructor(
    private financeService: FinanceService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAssets();
  }

  loadAssets(): void {
    this.isLoading = true;
    this.error = null;

    this.financeService.listAssets().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.assets = response.data;
          this.applyFilters();
          this.calculateTotals();
          this.isLoading = false;
          this.cd.detectChanges();
        } else {
          this.error = 'No se pudieron cargar los activos';
          this.isLoading = false;
          this.cd.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error loading assets:', err);
        this.error = 'Error al cargar activos';
        this.isLoading = false;
        this.cd.detectChanges();
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.assets];

    // Filtro por tipo
    if (this.selectedType !== 'all') {
      filtered = filtered.filter(a => a.type === this.selectedType);
    }

    // Filtro por búsqueda
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(a => 
        a.name.toLowerCase().includes(term) ||
        (a.notes && a.notes.toLowerCase().includes(term))
      );
    }

    this.filteredAssets = filtered;
    this.calculateTotals();
  }

  calculateTotals(): void {
    this.totalValue = this.filteredAssets.reduce((sum, asset) => {
      return sum + (parseFloat(String(asset.current_value || 0)));
    }, 0);
  }

  onTypeFilterChange(): void {
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  createAsset(): void {
    this.router.navigate(['/finance/assets/new']);
  }

  editAsset(asset: Asset): void {
    this.router.navigate(['/finance/assets/edit', asset.id]);
  }

  deleteAsset(asset: Asset): void {
    Swal.fire({
      title: '¿Eliminar activo?',
      html: `¿Estás seguro de eliminar <strong>${asset.name}</strong>?<br><small class="text-muted">Esta acción no se puede deshacer.</small>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.financeService.deleteAsset(asset.id!).subscribe({
          next: (response) => {
            if (response.success) {
              Swal.fire({
                title: '¡Eliminado!',
                text: 'El activo ha sido eliminado correctamente.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
              });
              this.loadAssets();
            }
          },
          error: (err) => {
            console.error('Error deleting asset:', err);
            Swal.fire({
              title: 'Error',
              text: 'No se pudo eliminar el activo',
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
      'cash': 'Efectivo',
      'property': 'Propiedad',
      'investment': 'Inversión',
      'vehicle': 'Vehículo',
      'other': 'Otro'
    };
    return labels[type] || type;
  }

  getTypeBadgeClass(type: string): string {
    const classes: { [key: string]: string } = {
      'cash': 'badge-success',
      'property': 'badge-primary',
      'investment': 'badge-info',
      'vehicle': 'badge-warning',
      'other': 'badge-secondary'
    };
    return classes[type] || 'badge-secondary';
  }
}
