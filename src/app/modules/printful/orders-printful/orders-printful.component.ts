import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { OrderPrintfulService } from '../_services/order-printful.service';

interface PrintfulOrder {
  id: number;
  external_id: string;
  status: string;
  shipping: string;
  created: number;
  updated: number;
  recipient: {
    name: string;
    email: string;
    country_name: string;
  };
  retail_costs: {
    currency: string;
    subtotal: string;
    shipping: string;
    total: string;
  };
  items: number;
}

interface OrderFilters {
  status: string;
  search: string;
  startDate: string;
  endDate: string;
}

@Component({
  selector: 'app-orders-printful',
  templateUrl: './orders-printful.component.html',
  styleUrls: ['./orders-printful.component.scss']
})
export class OrdersPrintfulComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // For template access
  Math = Math;

  orders: PrintfulOrder[] = [];
  filteredOrders: PrintfulOrder[] = [];
  isLoading = false;

  filters: OrderFilters = {
    status: '',
    search: '',
    startDate: '',
    endDate: ''
  };

  statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'draft', label: 'Borrador' },
    { value: 'pending', label: 'Pendiente' },
    { value: 'failed', label: 'Fallida' },
    { value: 'canceled', label: 'Cancelada' },
    { value: 'onhold', label: 'En espera' },
    { value: 'inprocess', label: 'En producción' },
    { value: 'partial', label: 'Parcial' },
    { value: 'fulfilled', label: 'Completada' }
  ];

  // Pagination
  currentPage = 1;
  itemsPerPage = 20;
  totalItems = 0;

  // Toast
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'info';

  constructor(
    private orderService: OrderPrintfulService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadOrders(): void {
    this.isLoading = true;
    
    this.orderService.getOrders(this.filters.status, 100, 0)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.orders = response.orders || [];
            this.applyFilters();
            console.log(`✅ ${this.orders.length} órdenes cargadas`);
          }
          this.isLoading = false;
          this.cd.detectChanges();
        },
        error: (error) => {
          console.error('❌ Error loading orders:', error);
          this.displayToast('Error al cargar las órdenes', 'error');
          this.orders = [];
          this.filteredOrders = [];
          this.isLoading = false;
          this.cd.detectChanges();
        }
      });
  }

  applyFilters(): void {
    let filtered = [...this.orders];

    // Filter by status
    if (this.filters.status) {
      filtered = filtered.filter(order => order.status === this.filters.status);
    }

    // Filter by search (external_id, recipient name or email)
    if (this.filters.search) {
      const search = this.filters.search.toLowerCase();
      filtered = filtered.filter(order =>
        order.external_id.toLowerCase().includes(search) ||
        order.recipient.name.toLowerCase().includes(search) ||
        order.recipient.email.toLowerCase().includes(search)
      );
    }

    // Filter by date range
    if (this.filters.startDate) {
      const startTime = new Date(this.filters.startDate).getTime() / 1000;
      filtered = filtered.filter(order => order.created >= startTime);
    }
    if (this.filters.endDate) {
      const endTime = new Date(this.filters.endDate).getTime() / 1000;
      filtered = filtered.filter(order => order.created <= endTime);
    }

    this.filteredOrders = filtered;
    this.totalItems = filtered.length;
    this.currentPage = 1;
  }

  clearFilters(): void {
    this.filters = {
      status: '',
      search: '',
      startDate: '',
      endDate: ''
    };
    this.applyFilters();
  }

  refreshOrders(): void {
    this.loadOrders();
    this.displayToast('Órdenes actualizadas', 'success');
  }

  syncOrder(orderId: number): void {
    this.isLoading = true;
    this.orderService.syncOrderStatus(orderId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.displayToast('Estado de orden sincronizado', 'success');
            this.loadOrders();
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error syncing order:', error);
          this.displayToast('Error al sincronizar la orden', 'error');
          this.isLoading = false;
        }
      });
  }

  retryOrder(orderId: number): void {
    if (!confirm('¿Estás seguro de reintentar esta orden?')) {
      return;
    }

    this.isLoading = true;
    this.orderService.retryOrder(orderId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.displayToast('Orden reenviada a Printful', 'success');
            this.loadOrders();
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error retrying order:', error);
          this.displayToast(error.error?.message || 'Error al reintentar la orden', 'error');
          this.isLoading = false;
        }
      });
  }

  cancelOrder(orderId: number): void {
    if (!confirm('¿Estás seguro de cancelar esta orden?')) {
      return;
    }

    this.isLoading = true;
    this.orderService.cancelOrder(orderId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.displayToast('Orden cancelada', 'warning');
            this.loadOrders();
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error canceling order:', error);
          this.displayToast('Error al cancelar la orden', 'error');
          this.isLoading = false;
        }
      });
  }

  getStatusBadgeClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'draft': 'secondary',
      'pending': 'warning',
      'failed': 'danger',
      'canceled': 'dark',
      'onhold': 'info',
      'inprocess': 'primary',
      'partial': 'info',
      'fulfilled': 'success'
    };
    return statusMap[status] || 'secondary';
  }

  getStatusLabel(status: string): string {
    const option = this.statusOptions.find(opt => opt.value === status);
    return option ? option.label : status;
  }

  formatDate(timestamp: number): string {
    if (!timestamp) return '-';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCurrency(value: string, currency: string): string {
    const amount = parseFloat(value);
    if (isNaN(amount)) return '0,00 €';
    
    if (currency === 'EUR') {
      return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR'
      }).format(amount);
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  }

  getPaginatedOrders(): PrintfulOrder[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredOrders.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  displayToast(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    setTimeout(() => this.closeToast(), 3000);
  }

  closeToast(): void {
    this.showToast = false;
  }
}
