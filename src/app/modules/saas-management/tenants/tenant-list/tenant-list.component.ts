import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { SaasTenantsService, TenantListItem } from '../../_services/saas-tenants.service';

@Component({
  selector: 'app-tenant-list',
  templateUrl: './tenant-list.component.html',
  styleUrls: ['./tenant-list.component.scss']
})
export class TenantListComponent implements OnInit {
  Math = Math; // Expose Math to template
  
  tenants: TenantListItem[] = [];
  filteredTenants: TenantListItem[] = [];
  isLoading = true;
  openDropdownId: number | null = null; // For dropdown toggle
  
  // Filtros
  filters = {
    search: '',
    status: 'all',
    module: 'all',
    plan: 'all'
  };

  // Opciones para filtros
  statuses = [
    { value: 'all', label: 'Todos los estados' },
    { value: 'trial', label: 'Trial' },
    { value: 'active', label: 'Activo' },
    { value: 'cancelled', label: 'Cancelado' },
    { value: 'expired', label: 'Expirado' },
    { value: 'suspended', label: 'Suspendido' }
  ];

  modules: { value: string; label: string }[] = [];
  plans: { value: string; label: string }[] = [];

  // Paginación
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  // Ordenamiento
  sortBy = 'created_at';
  sortOrder: 'asc' | 'desc' = 'desc';

  constructor(
    private tenantsService: SaasTenantsService,
    private cd: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTenants();
    
    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      this.openDropdownId = null;
      this.cd.detectChanges();
    });
  }

  loadTenants(): void {
    this.isLoading = true;
    this.cd.detectChanges();
    console.log('🔄 Cargando tenants...');
    
    this.tenantsService.getTenants().subscribe({
      next: (response) => {
        console.log('✅ Respuesta recibida:', response);
        if (response.success) {
          this.tenants = response.tenants;
          this.extractFilterOptions();
          this.applyFilters();
          console.log('✅ Tenants cargados:', this.tenants.length);
        }
        this.isLoading = false;
        this.cd.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error loading tenants:', error);
        console.error('❌ Error status:', error.status);
        console.error('❌ Error message:', error.message);
        this.isLoading = false;
        this.cd.detectChanges();
      }
    });
  }

  extractFilterOptions(): void {
    // Extraer módulos únicos
    const uniqueModules = [...new Set(this.tenants.map(t => t.module_key))];
    this.modules = [
      { value: 'all', label: 'Todos los módulos' },
      ...uniqueModules.map(m => ({ value: m, label: m }))
    ];

    // Extraer planes únicos
    const uniquePlans = [...new Set(this.tenants.map(t => t.plan))];
    this.plans = [
      { value: 'all', label: 'Todos los planes' },
      ...uniquePlans.map(p => ({ value: p, label: p }))
    ];
  }

  applyFilters(): void {
    let filtered = [...this.tenants];

    // Filtrar por búsqueda
    if (this.filters.search.trim()) {
      const search = this.filters.search.toLowerCase();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(search) ||
        t.email.toLowerCase().includes(search)
      );
    }

    // Filtrar por status
    if (this.filters.status !== 'all') {
      filtered = filtered.filter(t => t.status === this.filters.status);
    }

    // Filtrar por módulo
    if (this.filters.module !== 'all') {
      filtered = filtered.filter(t => t.module_key === this.filters.module);
    }

    // Filtrar por plan
    if (this.filters.plan !== 'all') {
      filtered = filtered.filter(t => t.plan === this.filters.plan);
    }

    // Ordenar
    filtered.sort((a, b) => {
      const aValue = a[this.sortBy];
      const bValue = b[this.sortBy];
      
      if (this.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    this.filteredTenants = filtered;
    this.totalPages = Math.ceil(filtered.length / this.pageSize);
    this.currentPage = 1;
  }

  get paginatedTenants(): TenantListItem[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredTenants.slice(start, end);
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.filters = {
      search: '',
      status: 'all',
      module: 'all',
      plan: 'all'
    };
    this.applyFilters();
  }

  sortTable(field: string): void {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortOrder = 'asc';
    }
    this.applyFilters();
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getStatusBadgeClass(status: string): string {
    const classes = {
      'trial': 'badge-warning',
      'active': 'badge-success',
      'cancelled': 'badge-danger',
      'expired': 'badge-secondary',
      'suspended': 'badge-dark'
    };
    return classes[status] || 'badge-secondary';
  }

  getDaysRemaining(trialEndsAt: string): number {
    if (!trialEndsAt) return 0;
    const now = new Date();
    const endDate = new Date(trialEndsAt);
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  formatDate(date: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  viewTenantDetails(tenantId: number): void {
    this.router.navigate(['/saas/tenants', tenantId]);
  }

  extendTrial(tenant: TenantListItem, days: number): void {
    if (confirm(`¿Extender trial de ${tenant.name} por ${days} días?`)) {
      this.isLoading = true;
      this.cd.detectChanges();
      this.tenantsService.extendTrial(tenant.id, days).subscribe({
        next: (response) => {
          if (response.success) {
            alert(`Trial extendido exitosamente`);
            this.loadTenants();
          } else {
            this.isLoading = false;
            this.cd.detectChanges();
          }
        },
        error: (error) => {
          console.error('Error extending trial:', error);
          alert('Error al extender trial');
          this.isLoading = false;
          this.cd.detectChanges();
        }
      });
    }
  }

  cancelSubscription(tenant: TenantListItem): void {
    if (confirm(`¿Cancelar suscripción de ${tenant.name}?`)) {
      this.isLoading = true;
      this.cd.detectChanges();
      this.tenantsService.cancelSubscription(tenant.id).subscribe({
        next: (response) => {
          if (response.success) {
            alert('Suscripción cancelada');
            this.loadTenants();
          } else {
            this.isLoading = false;
            this.cd.detectChanges();
          }
        },
        error: (error) => {
          console.error('Error canceling subscription:', error);
          alert('Error al cancelar suscripción');
          this.isLoading = false;
          this.cd.detectChanges();
        }
      });
    }
  }

  suspendTenant(tenant: TenantListItem): void {
    if (confirm(`¿Suspender cuenta de ${tenant.name}?`)) {
      // TODO: Implementar suspensión
      console.log('Suspender tenant:', tenant.id);
    }
  }

  toggleActions(event: Event, tenantId: number): void {
    event.stopPropagation();
    this.openDropdownId = this.openDropdownId === tenantId ? null : tenantId;
  }

  closeDropdown(): void {
    this.openDropdownId = null;
  }
}
