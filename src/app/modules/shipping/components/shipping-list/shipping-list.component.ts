import { Component, OnInit, ChangeDetectorRef, SimpleChanges, Input, HostListener } from '@angular/core';
import { debounceTime } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { ShippingService } from '../../_services/shipping.service';

@Component({
  selector: 'app-shipping-list',
  templateUrl: './shipping-list.component.html',
  styleUrls: ['./shipping-list.component.scss']
})
export class ShippingListComponent implements OnInit {

  @Input() timeFilter: 'All' | 'Day' | 'Week' | 'Month' = 'All';

  shipments: any[] = [];
  currentPage = 1;
  limit = 10;
  total = 0;
  totalPages = 0;
  q = '';
  statusFilter: string = 'all'; // valor por defecto
  openDropdownId: number | null = null;
  search$ = new Subject<string>();

  constructor(
    private shippingService: ShippingService,
    private route: ActivatedRoute,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.getQueryParams();

    // Suscripción al Subject de búsqueda con debounce
    this.search$.pipe(debounceTime(500)).subscribe(term => {
      this.q = term;
      this.load(1); // siempre recarga desde página 1
    });

    // Cargar la primera página al iniciar
    this.load(1);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['timeFilter'] && !changes['timeFilter'].firstChange) {
      this.load(1); // recarga la lista cuando cambia el filtro
    }
  }

  // 🔹 Cuando cambia el dropdown de estado
  onStatusChange() {
    this.load(1);
  }

  getQueryParams() {
    this.route.queryParams.subscribe(params => {
      const searchValue = params['search']?.trim();
      if (searchValue) {
        this.q = searchValue;
      }
      this.load(1);
    });
  }

  /** 🔹 Cargar envíos */
  load(page: number = 1) {
    const params: any = { 
      page, 
      limit: this.limit, 
      q: this.q, 
      timeFilter: this.timeFilter
    };

    // Agregar estado si no es "all"
    if (this.statusFilter && this.statusFilter !== 'all') {
      params.status = this.statusFilter;
    }

    this.shippingService.getShipments(params).subscribe({
      next: resp => {
        console.log("Get shipings: ", resp);
        
        if (resp?.success) {
          this.shipments = resp.shipments || [];
          this.total = resp.total || 0;
          this.currentPage = Number(resp.page) || page;
          this.totalPages = Number(resp.pages) || Math.ceil(this.total / this.limit);

          this.cd.detectChanges();
        }
      },
      error: err => console.error('Error cargando envíos:', err)
    });
  }

  // viewSale(sale: any) {
  //   // navigate to detail route
  //   this.router.navigate(['/sales/detail', sale.id]);
  // }


  /** 🔹 Abrir detalle de envío */
  viewShipping(shipment: any) {
    this.router.navigate(['/shipping/detail', shipment.id]);
  }

  /** 🔹 Abre/cierra el menú */
  toggleActions(event: MouseEvent, shipmentId: number): void {
    event.stopPropagation(); // evita burbujeo que cierra el menú
    this.openDropdownId = this.openDropdownId === shipmentId ? null : shipmentId;
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

  /** 🔹 Cambiar número de registros por página */
  changeLimit(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.limit = parseInt(value, 10);
    this.load(1);
  }

  /** 🔹 Navegación */
  prevPage(): void {
    if (this.currentPage > 1) this.load(this.currentPage - 1);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) this.load(this.currentPage + 1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) this.load(page);
  }

  /** 🔹 Páginas visibles */
  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  /** 🔹 Búsqueda desde input */
  onSearchChange(value: string) {
    this.search$.next(value);
  }

}
