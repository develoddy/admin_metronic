import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AdminSalesService } from '../services/admin-sales.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';


@Component({
  selector: 'app-sales-list',
  templateUrl: './sales-list.component.html',
  styleUrls: ['./sales-list.component.scss']
})
export class SalesListComponent implements OnInit {
  sales: any[] = [];
  currentPage = 1;
  limit = 5;
  total = 0;
  totalPages = 0;
  q = '';
  searchTerm = new Subject<string>();
  copiedId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private svc: AdminSalesService, 
    private router: Router, 
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.getQueryParams();
    this.searchTerm.pipe(debounceTime(500)).subscribe(term => {
        this.q = term;
        this.load(1); // siempre recarga desde página 1
    });

     // Cargar la primera página al iniciar
    this.load(1);
  }

  getQueryParams() {
    this.route.queryParams.subscribe(params => {
      const searchValue = params['search']?.trim();
      if (searchValue) {
        this.q = searchValue; // actualiza la variable usada en load()
        this.load(1);
      } else {
        // si no hay parámetro 'search', carga normal
        this.load(1);
      }
    });
  }

  load(page: number = this.currentPage) {
    const params: any = { page, limit: this.limit, q: this.q };
    this.svc.getSales(params).subscribe(resp => {
        console.log('getSales response:', resp);
      if (resp && resp.success) {
        this.sales = resp.sales || resp.sales || [];
        this.total = resp.total || 0;
        console.log('Total ventas:', resp.total);
        this.currentPage = resp.page || page;
        this.totalPages = resp.pages || Math.ceil(this.total / this.limit);

        // Debug: log printfulStatus for each sale to verify the field arrives from backend
        this.sales.forEach(s => console.log('Venta', s.id, 'printfulStatus:', s.printfulStatus));

        this.cd.detectChanges(); 
      }
    }, err => console.error('getSales error', err));
  }

  openSale(sale: any) {
    // navigate to detail route
    this.router.navigate(['/sales/detail', sale.id]);
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.load(this.currentPage - 1);
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.load(this.currentPage + 1);
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.load(page);
    }
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

    
  copyToClipboard(text: string, saleId: number): void {
    navigator.clipboard.writeText(text).then(() => {
        console.log('✅ Texto copiado correctamente:', text);
        this.copiedId = saleId;
        this.cd.detectChanges(); 

        console.log('🔹 Tooltip activado para venta ID:', saleId);
        setTimeout(() => {
        this.copiedId = null;
        this.cd.detectChanges(); 
        console.log('🕒 Tooltip ocultado para venta ID:', saleId);
        }, 1500);
    });
    }
    
}
