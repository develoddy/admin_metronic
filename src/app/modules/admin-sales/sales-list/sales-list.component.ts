import { ChangeDetectorRef, Component, HostListener, Input, OnInit, SimpleChanges } from '@angular/core';
import { AdminSalesService } from '../services/admin-sales.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { ReceiptService } from '../../documents-manager/_services/receipt.service';
import { PriceCalculationService } from '../services/price-calculation.service';


@Component({
  selector: 'app-sales-list',
  templateUrl: './sales-list.component.html',
  styleUrls: ['./sales-list.component.scss']
})
export class SalesListComponent implements OnInit {

  @Input() timeFilter: 'All' | 'Day' | 'Week' | 'Month' = 'All';
  sales: any[] = [];
  currentPage = 1;
  limit = 5;
  total = 0;
  totalPages = 0;
  q = '';
  searchTerm = new Subject<string>();
  copiedId: number | null = null;
  openDropdownId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private svc: AdminSalesService, 
    private router: Router, 
    private cd: ChangeDetectorRef,
    private receiptSvc: ReceiptService,
    private priceCalculationService: PriceCalculationService
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

  // Detecta cambios en el @Input timeFilter
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['timeFilter'] && !changes['timeFilter'].firstChange) {
      console.log('timeFilter changed:', this.timeFilter);
      this.load(1); // recarga la lista cuando cambia la tab
    }
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
    const params: any = { page, limit: this.limit, q: this.q, timeFilter: this.timeFilter };
    this.svc.getSales(params).subscribe(resp => {
      console.log('getSales response:', resp);
      if (resp && resp.success) {
        this.sales = resp.sales || resp.sales || [];
        this.total = resp.total || 0;
        this.currentPage = resp.page || page;
        this.totalPages = resp.pages || Math.ceil(this.total / this.limit);

        // Debug: log printfulStatus for each sale to verify the field arrives from backend
        //this.sales.forEach(s => console.log('Venta', s.id, 'printfulStatus:', s.printfulStatus));

        this.cd.detectChanges(); 
      }
    }, err => console.error('getSales error', err));
  }

  viewSale(sale: any) {
    // navigate to detail route
    this.router.navigate(['/sales/detail', sale.id]);
  }

  /** 🔹 Abre/cierra el menú */
  toggleActions(event: MouseEvent, saleId: number): void {
    event.stopPropagation(); // evita burbujeo que cierra el menú
    this.openDropdownId = this.openDropdownId === saleId ? null : saleId;
  }

  /** 🔹 Cierra el menú manualmente */
  closeDropdown(): void {
    this.openDropdownId = null;
  }

  /** 🔹 Cierra el menú al hacer clic fuera */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    // Si el clic no está dentro de un botón Actions o del menú, se cierra
    if (!target.closest('.dropdown-menu') && !target.closest('.btn-light')) {
      this.openDropdownId = null;
    }
  }

  /** 🔹 Descargar o visualizar recibo */
  downloadReceipt(sale: any): void { 
    this.receiptSvc.getReceiptsBySaleId(sale.id).subscribe({
      next: (resp) => {
        if (resp?.success && resp.receipts?.length > 0) {
          // Si hay varios, abrimos el más reciente
          const latestReceipt = resp.receipts[0];
          // Redirige al componente Receipts View
          this.router.navigate(['/documents-manager/receipts/view', latestReceipt.id]);
        } else {
          alert('No existe ningún recibo para esta venta.');
        }
      },
      error: () => alert('Error al obtener los recibos.')
    });
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

  // 💰 ================ MÉTODOS PARA PRECIOS ================ 💰

  /**
   * Obtiene el total de una venta con redondeo .95 para consistencia con frontend
   * @param sale Objeto de venta
   * @returns Total con redondeo .95 aplicado
   */
  getSaleTotal(sale: any): number {
    return this.priceCalculationService.getSaleTotal(sale);
  }
    
}
