import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AdminSalesService } from '../services/admin-sales.service';

@Component({
  selector: 'app-sale-detail',
  templateUrl: './sale-detail.component.html',
  styleUrls: ['./sale-detail.component.scss']
})
export class SaleDetailComponent implements OnInit {
  sale: any = null;
  id: any = null;

  constructor(private route: ActivatedRoute, private svc: AdminSalesService) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.id = params.get('id');
      if (this.id) this.load();
    });
  }

  load() {
    this.svc.getSaleById(this.id).subscribe(resp => {
      if (resp && resp.sale) {
        this.sale = resp.sale;
      } else if (resp && resp.success && resp.sale) {
        this.sale = resp.sale;
      } else {
        // fallback: some APIs may return sale directly
        this.sale = resp.sale || resp;
      }
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
      },
      error: (err) => {
        console.error('Error refreshing Printful status', err);
        alert('Error al actualizar desde Printful');
      }
    });
  }
}
