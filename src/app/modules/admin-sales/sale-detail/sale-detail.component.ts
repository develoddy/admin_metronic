import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AdminSalesService } from '../services/admin-sales.service';
import { PriceCalculationService } from '../services/price-calculation.service';


@Component({
  selector: 'app-sale-detail',
  templateUrl: './sale-detail.component.html',
  styleUrls: ['./sale-detail.component.scss']
})
export class SaleDetailComponent implements OnInit {
  sale: any = null;
  id: any = null;

  constructor(
    private route: ActivatedRoute, 
    private svc: AdminSalesService,
    private cd: ChangeDetectorRef,
    private priceCalculationService: PriceCalculationService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.id = params.get('id');
      if (this.id) this.load();
    });
  }

  load() {
    this.svc.getSaleById(this.id).subscribe(resp => {
      console.log('getSaleById response:', resp);
      if (resp && resp.sale) {
        this.sale = resp.sale;
      } else if (resp && resp.success && resp.sale) {
        this.sale = resp.sale;
      } else {
        // fallback: some APIs may return sale directly
        this.sale = resp.sale || resp;
      }

      this.cd.detectChanges(); 
    }, err => console.error('getSaleById error', err));
  }

  refreshPrintful() {
    if (!this.sale || !this.sale.id) return;
    this.svc.refreshPrintfulStatus(this.sale.id).subscribe({
      next: (res: any) => {
        if (res && res.success) {
          // update local model with new status and optional dates
          this.sale.printfulStatus = res.printfulStatus ?? this.sale.printfulStatus;
          if (res.minDeliveryDate) this.sale.minDeliveryDate = res.minDeliveryDate;
          if (res.maxDeliveryDate) this.sale.maxDeliveryDate = res.maxDeliveryDate;
          alert('Estado actualizado correctamente desde Printful');
        } else {
          console.warn('refreshPrintful returned unexpected response', res);
          alert('No se pudo actualizar el estado desde Printful');
        }

        this.cd.detectChanges(); 
      },
      error: (err) => {
        console.error('Error refreshing Printful status', err);
        alert('Error al actualizar desde Printful');
      }
    });
  }

  getVariedadPreview(item: any): string {
    const variedad = item.variedad;

    if (variedad && Array.isArray(variedad.files) && variedad.files.length > 0) {
      // 1️⃣ Intentar preview
      const previewFile = variedad.files.find((f: any) => f.type === 'preview');
      if (previewFile && previewFile.preview_url) {
        return previewFile.preview_url;
      }
    }

    // Si no hay preview, retorna vacío por ahora
    return '';
  }

  // 💰 ================ MÉTODOS PARA PRECIOS ================ 💰

  /**
   * Obtiene el total de la venta con redondeo .95
   * @param sale Objeto de venta
   * @returns Total con redondeo .95 aplicado
   */
  getSaleTotal(sale: any): number {
    return this.priceCalculationService.getSaleTotal(sale);
  }

  /**
   * Obtiene el precio unitario con redondeo .95
   * @param detail Detalle de la venta
   * @returns Precio unitario con redondeo .95 aplicado
   */
  getUnitPrice(detail: any): number {
    const price = detail.price_unitario || detail.unitPrice || 0;
    return this.priceCalculationService.getAdminDisplayPrice(price);
  }

  /**
   * Obtiene el total del detalle con redondeo .95
   * @param detail Detalle de la venta
   * @returns Total del detalle con redondeo .95 aplicado
   */
  getDetailTotal(detail: any): number {
    const total = detail.total || detail.subtotal || 0;
    return this.priceCalculationService.getAdminDisplayPrice(total);
  }

}
