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
}
