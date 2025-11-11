import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Toaster } from 'ngx-toast-notifications';
import { ReceiptService } from '../../../_services/receipt.service';

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
    private receiptsService: ReceiptService,
    private toaster: Toaster,
    private cd: ChangeDetectorRef,
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


}
