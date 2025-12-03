import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Toaster } from 'ngx-toast-notifications';
import { ReceiptService } from '../../../_services/receipt.service';
import { PriceCalculationService } from '../../../../admin-sales/services/price-calculation.service';

@Component({
  selector: 'app-receipts-view',
  templateUrl: './receipts-view.component.html',
  styleUrls: ['./receipts-view.component.scss']
})
export class ReceiptsViewComponent implements OnInit {

  receipt: any = null;
  // 🔹 Variables para template
  user: any = null;
  guest: any = null;
  sale: any = null;
  saleDetails: any[] = [];
  saleAddresses: any[] = [];
  

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private receiptsService: ReceiptService,
    private toaster: Toaster,
    private cd: ChangeDetectorRef,
    private priceCalculationService: PriceCalculationService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    console.log("get Param id : ", id);
    
    if (id) this.loadReceipt(Number(id));
  }

  loadReceipt(id: number) {
    this.receiptsService.getReceiptById(id).subscribe({
      next: (resp) => {
        console.log("LoadReceipt Get all: ", resp);
        if (resp && resp.success) {
          this.receipt = resp.receipt;
          // 🔹 Desestructuramos para el template
          this.user = this.receipt.user || null;
          this.guest = this.receipt.guest || null;
          this.sale = this.receipt.sale || null;
          this.saleDetails = this.sale?.sale_details || [];
          this.saleAddresses = this.sale?.saleAddresses || [];
          this.cd.detectChanges();
        }
      },
      error: (err) => {
        console.error(err);
        this.toaster.open({
          text: 'Error al cargar el recibo',
          type: 'danger'
        });
      }
    });
  }

  // receipt.component.ts
  getVariedadImage(item: any): string {
    const variedad = item.variedad;

    if (variedad && Array.isArray(variedad.files) && variedad.files.length > 0) {
      // 1️⃣ Intentar preview
      const previewFile = variedad.files.find((f: any) => f.type === 'preview');
      if (previewFile && previewFile.preview_url) return previewFile.preview_url;

      // 2️⃣ Intentar default
      const defaultFile = variedad.files.find((f: any) => f.type === 'default');
      if (defaultFile && defaultFile.preview_url) return defaultFile.preview_url;

      // 3️⃣ Cualquier otra como fallback
      const anyFile = variedad.files[0];
      if (anyFile) return anyFile.preview_url || anyFile.thumbnail_url || anyFile.url || '';
    }

    // 4️⃣ Fallback al producto
    return item.product?.imagen || item.product?.portada || '';
  }



  /** 🖨️ Imprimir recibo directamente */
  printReceipt() {
    window.print();
  }

  /** 💾 Descargar recibo en PDF (opcional, si backend genera PDF) */
  downloadReceipt() {
  if (!this.receipt?.id) return;

  this.receiptsService.downloadReceipt(this.receipt.id).subscribe({
    next: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${this.receipt.id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    },
    error: (err) => {
      console.error('Error al descargar el PDF', err);
      this.toaster.open({
        text: 'No se pudo descargar el PDF',
        type: 'danger'
      });
    }
  });
}

  // 💰 ================ MÉTODOS PARA PRECIOS ================ 💰

  /**
   * Obtiene el total de un item con redondeo .95
   * @param item Item del recibo
   * @returns Total con redondeo .95 aplicado
   */
  getItemTotal(item: any): number {
    return this.priceCalculationService.getAdminDisplayPrice(item.total);
  }

  /**
   * Obtiene el total de la venta con redondeo .95
   * @param sale Objeto de venta
   * @returns Total con redondeo .95 aplicado
   */
  getSaleTotal(sale: any): number {
    return this.priceCalculationService.getSaleTotal(sale);
  }

  // 🔗 ================ NAVEGACIÓN CRUZADA ENTRE MÓDULOS ================ 🔗

  /**
   * 🎨 Navega al detalle de la orden en Printful
   * Enlace cruzado: Documents-Manager → Printful
   */
  viewPrintfulOrder() {
    if (!this.sale?.printfulOrderId) {
      this.toaster.open({
        text: 'Esta orden no tiene ID de Printful asociado',
        type: 'warning'
      });
      return;
    }
    
    this.router.navigate(['/printful/orders', this.sale.printfulOrderId]);
  }

  /**
   * 📋 Navega al detalle de la venta en Admin-Sales
   * Enlace cruzado: Documents-Manager → Admin-Sales
   */
  viewAdminSale() {
    if (!this.sale?.id) {
      this.toaster.open({
        text: 'No hay venta asociada a este recibo',
        type: 'warning'
      });
      return;
    }
    
    // Navegar a la lista de ventas (ruta correcta es /sales no /admin-sales)
    this.router.navigate(['/sales/list']);
  }

}
