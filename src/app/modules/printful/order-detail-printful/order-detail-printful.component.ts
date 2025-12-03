import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { OrderPrintfulService } from '../_services/order-printful.service';
import { ReceiptService } from '../../documents-manager/_services/receipt.service';
import { AdminSalesService } from '../../admin-sales/services/admin-sales.service';

interface OrderDetail {
  id: number;
  external_id: string;
  status: string;
  shipping: string;
  created: number;
  updated: number;
  estimated_fulfillment?: number;
  estimated_delivery?: string;
  dashboard_url?: string;
  recipient: {
    name: string;
    email: string;
    address1: string;
    address2?: string;
    city: string;
    state_name: string;
    country_name: string;
    country_code: string;
    zip: string;
    phone?: string;
  };
  items: Array<{
    id: number;
    external_id: string;
    variant_id: number;
    quantity: number;
    name: string;
    product: {
      variant_id: number;
      product_id: number;
      image: string;
      name: string;
    };
    retail_price: string;
    sku?: string;
  }>;
  costs: {
    currency: string;
    subtotal: string;
    discount: string;
    shipping: string;
    digitization: string;
    additional_fee: string;
    fulfillment_fee: string;
    retail_delivery_fee: string;
    tax: string;
    vat: string;
    total: string;
  };
  retail_costs: {
    currency: string;
    subtotal: string;
    discount: string;
    shipping: string;
    tax: string;
    total: string;
  };
  shipments?: Array<{
    id: number;
    carrier: string;
    service: string;
    tracking_number: string;
    tracking_url: string;
    created: number;
    ship_date: string;
    shipped_at: number;
    items: Array<{
      item_id: number;
      quantity: number;
    }>;
  }>;
}

@Component({
  selector: 'app-order-detail-printful',
  templateUrl: './order-detail-printful.component.html',
  styleUrls: ['./order-detail-printful.component.scss']
})
export class OrderDetailPrintfulComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // For template access
  parseFloat = parseFloat;

  orderId: number = 0;
  order: OrderDetail | null = null;
  isLoading = false;
  receiptId: number | null = null; // ID del recibo asociado a esta orden
  isLoadingReceipt = false;

  // Toast
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'info';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderPrintfulService,
    private cd: ChangeDetectorRef,
    private receiptService: ReceiptService,
    private adminSalesService: AdminSalesService
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.orderId = +params['id'];
      if (this.orderId) {
        this.loadOrderDetail();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadOrderDetail(): void {
    this.isLoading = true;
    
    this.orderService.getOrderById(this.orderId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.order = response.order;
            console.log('✅ Order details loaded:', this.order);
            console.log('📦 Items structure:', this.order.items);
            if (this.order.items && this.order.items.length > 0) {
              console.log('🔍 First item:', this.order.items[0]);
              console.log('🏷️ SKU result:', this.getItemSku(this.order.items[0]));
            }
          }
          this.isLoading = false;
          this.cd.detectChanges();
        },
        error: (error) => {
          console.error('❌ Error loading order details:', error);
          this.displayToast('Error al cargar los detalles de la orden', 'error');
          this.order = null;
          this.isLoading = false;
          this.cd.detectChanges();
        }
      });
  }

  syncOrderStatus(): void {
    this.isLoading = true;
    this.orderService.syncOrderStatus(this.orderId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.displayToast('Estado sincronizado correctamente', 'success');
            this.loadOrderDetail();
          }
          this.isLoading = false;
          this.cd.detectChanges();
        },
        error: (error) => {
          console.error('Error syncing order:', error);
          this.displayToast('Error al sincronizar el estado', 'error');
          this.isLoading = false;
          this.cd.detectChanges();
        }
      });
  }

  cancelOrder(): void {
    if (!confirm('¿Estás seguro de cancelar esta orden?')) {
      return;
    }

    this.isLoading = true;
    this.orderService.cancelOrder(this.orderId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.displayToast('Orden cancelada', 'warning');
            this.router.navigate(['/printful/orders']);
          }
          this.isLoading = false;
          this.cd.detectChanges();
        },
        error: (error) => {
          console.error('Error canceling order:', error);
          this.displayToast('Error al cancelar la orden', 'error');
          this.isLoading = false;
          this.cd.detectChanges();
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
    const statusLabels: { [key: string]: string } = {
      'draft': 'Borrador',
      'pending': 'Pendiente',
      'failed': 'Fallida',
      'canceled': 'Cancelada',
      'onhold': 'En espera',
      'inprocess': 'En producción',
      'partial': 'Parcial',
      'fulfilled': 'Completada'
    };
    return statusLabels[status] || status;
  }

  formatDate(timestamp: number | string): string {
    if (!timestamp) return '-';
    
    let date: Date;
    if (typeof timestamp === 'string') {
      // Si es string, puede ser fecha ISO o necesita parsearse
      date = new Date(timestamp);
    } else {
      // Si es número, es timestamp en segundos
      date = new Date(timestamp * 1000);
    }
    
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCurrency(value: string | number, currency: string): string {
    const amount = typeof value === 'string' ? parseFloat(value) : value;
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

  displayToast(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    setTimeout(() => this.closeToast(), 3000);
  }

  closeToast(): void {
    this.showToast = false;
  }

  goBack(): void {
    this.router.navigate(['/printful/orders']);
  }

  getProfit(): number {
    if (!this.order || !this.order.retail_costs || !this.order.costs) {
      return 0;
    }
    const retail = parseFloat(this.order.retail_costs.total);
    const cost = parseFloat(this.order.costs.total);
    return retail - cost;
  }

  getProfitPercentage(): string {
    if (!this.order || !this.order.retail_costs) {
      return '0.00';
    }
    const retail = parseFloat(this.order.retail_costs.total);
    if (retail === 0) {
      return '0.00';
    }
    const profit = this.getProfit();
    const percentage = (profit / retail) * 100;
    return percentage.toFixed(2);
  }

  getItemSku(item: any): string {
    if (!item) return '-';
    
    // Prioridad de búsqueda del SKU según Printful
    const checks = [
      { path: 'sync_variant.sku', value: item.sync_variant?.sku },
      { path: 'variant.sku', value: item.variant?.sku },
      { path: 'sku', value: item.sku },
      { path: 'retail_sku', value: item.retail_sku },
      { path: 'external_variant_id', value: item.external_variant_id },
      { path: 'external_id', value: item.external_id },
      { path: 'sync_variant.external_id', value: item.sync_variant?.external_id },
      { path: 'product.sku', value: item.product?.sku }
    ];
    
    for (const check of checks) {
      if (check.value && check.value !== '' && check.value !== null && check.value !== undefined) {
        return check.value;
      }
    }
    
    // Si no hay SKU disponible
    return 'Pendiente';
  }

  getEstimatedDelivery(): string {
    if (!this.order) {
      return 'No disponible';
    }

    // Si hay shipments con fecha de envío real
    if (this.order.shipments && this.order.shipments.length > 0) {
      const firstShipment = this.order.shipments[0];
      if (firstShipment.ship_date) {
        return this.formatDate(firstShipment.ship_date);
      }
    }

    // Si Printful ya proporcionó estimated_delivery
    if (this.order.estimated_delivery) {
      return this.formatDate(this.order.estimated_delivery);
    }

    // Si Printful ya proporcionó estimated_fulfillment
    if (this.order.estimated_fulfillment) {
      const fulfillmentDate = new Date(this.order.estimated_fulfillment * 1000);
      const deliveryDate = new Date(fulfillmentDate.getTime() + (6 * 24 * 60 * 60 * 1000));
      return new Intl.DateTimeFormat('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(deliveryDate);
    }

    // Si es draft, Printful no ha calculado aún la entrega
    return 'Pendiente de confirmación';
  }

  hasEstimatedDelivery(): boolean {
    if (!this.order) return false;
    
    // Mostrar solo si Printful ya proporcionó datos de entrega
    return !!(this.order.estimated_delivery 
      || this.order.estimated_fulfillment 
      || (this.order.shipments && this.order.shipments.length > 0));
  }

  // 🔗 ================ NAVEGACIÓN CRUZADA ENTRE MÓDULOS ================ 🔗

  /**
   * 🧾 Navega al recibo de pago asociado a esta orden Printful
   * Enlace cruzado: Printful → Documents-Manager
   * 
   * Flujo:
   * 1. Busca el Sale por external_id (printfulOrderId)
   * 2. Busca el Receipt asociado a ese Sale
   * 3. Navega al componente receipts-view con el ID del recibo
   */
  viewReceipt() {
    if (!this.order?.id) {
      this.displayToast('No se puede buscar el recibo: falta ID de orden', 'warning');
      return;
    }

    this.isLoadingReceipt = true;
    
    console.log('🔍 [Receipt Search] Printful Order ID:', this.order.id);
    console.log('🔍 [Receipt Search] Order external_id:', this.order.external_id);
    
    // Estrategia: Buscar el Sale que tiene este printfulOrderId
    // El campo Sale.printfulOrderId almacena el ID de Printful (order.id)
    this.adminSalesService.getSales().subscribe({
      next: (resp) => {
        console.log('✅ [Receipt Search] Sales response:', resp);
        
        if (!resp?.success || !resp.sales || resp.sales.length === 0) {
          this.isLoadingReceipt = false;
          this.displayToast('No se encontraron ventas', 'warning');
          return;
        }
        
        // Buscar el Sale que tiene este printfulOrderId
        const sale = resp.sales.find((s: any) => 
          s.printfulOrderId === this.order!.id || 
          s.printfulOrderId === String(this.order!.id)
        );
        
        console.log('🔍 [Receipt Search] Found sale:', sale);
        
        if (!sale) {
          this.isLoadingReceipt = false;
          console.warn('⚠️ [Receipt Search] No sale found with printfulOrderId:', this.order!.id);
          this.displayToast('No se encontró la venta asociada a esta orden de Printful', 'info');
          return;
        }
        
        const saleId = sale.id;
        console.log('✅ [Receipt Search] Sale ID found:', saleId);
        
        // Ahora buscar el Receipt por saleId
        this.receiptService.getReceiptsBySaleId(saleId).subscribe({
          next: (receiptResp) => {
            this.isLoadingReceipt = false;
            console.log('✅ [Receipt Search] Receipt response:', receiptResp);
            
            if (receiptResp?.success && receiptResp.receipts?.length > 0) {
              const receipt = receiptResp.receipts[0];
              this.receiptId = receipt.id;
              
              console.log('✅ [Receipt Search] Found receipt ID:', this.receiptId);
              
              // Navegar al recibo
              this.router.navigate(['/documents-manager/receipts/view', this.receiptId]);
            } else {
              console.warn('⚠️ [Receipt Search] No receipts found for saleId:', saleId);
              this.displayToast('No se encontró un recibo para esta venta', 'info');
            }
          },
          error: (err) => {
            this.isLoadingReceipt = false;
            console.error('❌ [Receipt Search] Error fetching receipt:', err);
            this.displayToast('Error al buscar el recibo: ' + (err?.error?.message || 'Error desconocido'), 'error');
          }
        });
      },
      error: (err) => {
        this.isLoadingReceipt = false;
        console.error('❌ [Receipt Search] Error fetching sales:', err);
        this.displayToast('Error al buscar ventas: ' + (err?.error?.message || 'Error desconocido'), 'error');
      }
    });
  }
}
