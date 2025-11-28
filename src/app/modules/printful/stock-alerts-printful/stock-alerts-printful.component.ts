import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { StockSyncPrintfulService, StockStats, DiscontinuedProduct, PriceChange } from '../_services/stock-sync-printful.service';

@Component({
  selector: 'app-stock-alerts-printful',
  templateUrl: './stock-alerts-printful.component.html',
  styleUrls: ['./stock-alerts-printful.component.scss']
})
export class StockAlertsPrintfulComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Data
  stats: StockStats | null = null;
  discontinuedProducts: DiscontinuedProduct[] = [];
  priceChanges: PriceChange[] = [];

  // Loading states
  loadingStats = false;
  loadingDiscontinued = false;
  loadingPriceChanges = false;
  syncing = false;

  // UI states
  showDiscontinued = false;
  showPriceChanges = false;

  // Toast notification
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'info';

  constructor(
    private stockSyncService: StockSyncPrintfulService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadStockStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStockStats(): void {
    this.loadingStats = true;
    this.stockSyncService.getStockStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.stats = response.stats;
          }
          this.loadingStats = false;
          this.cd.detectChanges();
        },
        error: (err) => {
          console.error('Error loading stock stats:', err);
          this.loadingStats = false;
          this.cd.detectChanges();
        }
      });
  }

  loadDiscontinuedProducts(): void {
    if (this.discontinuedProducts.length > 0) {
      this.showDiscontinued = !this.showDiscontinued;
      return;
    }

    this.loadingDiscontinued = true;
    this.showDiscontinued = true;
    this.stockSyncService.getDiscontinuedProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.discontinuedProducts = response.products;
          }
          this.loadingDiscontinued = false;
          this.cd.detectChanges();
        },
        error: (err) => {
          console.error('Error loading discontinued products:', err);
          this.loadingDiscontinued = false;
          this.cd.detectChanges();
        }
      });
  }

  loadPriceChanges(): void {
    if (this.priceChanges.length > 0) {
      this.showPriceChanges = !this.showPriceChanges;
      return;
    }

    this.loadingPriceChanges = true;
    this.showPriceChanges = true;
    this.stockSyncService.getPriceChanges()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.priceChanges = response.changes;
          }
          this.loadingPriceChanges = false;
          this.cd.detectChanges();
        },
        error: (err) => {
          console.error('Error loading price changes:', err);
          this.loadingPriceChanges = false;
          this.cd.detectChanges();
        }
      });
  }

  syncStock(): void {
    this.syncing = true;
    this.displayToast('Sincronizando inventario con Printful...', 'info');
    
    this.stockSyncService.syncStock()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.displayToast(
              `✅ Sincronización completada: ${response.stats.updated} actualizados, ${response.stats.discontinued} discontinuados, ${response.stats.priceChanges} cambios de precio`,
              'success'
            );
            this.loadStockStats();
            // Limpiar datos para forzar recarga
            this.discontinuedProducts = [];
            this.priceChanges = [];
          }
          this.syncing = false;
          this.cd.detectChanges();
        },
        error: (err) => {
          console.error('Error syncing stock:', err);
          this.displayToast('❌ Error al sincronizar inventario', 'error');
          this.syncing = false;
          this.cd.detectChanges();
        }
      });
  }

  updateProduct(productId: number, productTitle: string): void {
    this.stockSyncService.updateProduct(productId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.displayToast(
              `✅ ${productTitle} actualizado: ${response.updatedVariants} variantes actualizadas`,
              'success'
            );
            this.loadStockStats();
            // Recargar cambios de precio si están visibles
            if (this.showPriceChanges) {
              this.priceChanges = [];
              this.loadPriceChanges();
            }
          }
          this.cd.detectChanges();
        },
        error: (err) => {
          console.error('Error updating product:', err);
          this.displayToast(`❌ Error al actualizar ${productTitle}`, 'error');
          this.cd.detectChanges();
        }
      });
  }

  displayToast(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    setTimeout(() => this.closeToast(), 5000); // 5 segundos para mensajes largos
  }

  closeToast(): void {
    this.showToast = false;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatCurrency(value: number, currency: string): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency
    }).format(value);
  }
}
