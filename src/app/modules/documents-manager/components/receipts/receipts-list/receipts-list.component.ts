import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ReceiptService } from '../../../_services/receipt.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs/internal/Subject';
import { debounceTime } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { NoticyAlertComponent } from 'src/app/componets/notifications/noticy-alert/noticy-alert.component';
import { Toaster } from 'ngx-toast-notifications';
import { PriceCalculationService } from '../../../../admin-sales/services/price-calculation.service';

@Component({
  selector: 'app-receipts-list',
  templateUrl: './receipts-list.component.html',
  styleUrls: ['./receipts-list.component.scss']
})
export class ReceiptsListComponent implements OnInit {

  form = {
    userId: null,
    guestId: null,
    saleId: null,
    amount: 0,
    paymentMethod: 'efectivo',
    paymentDate: new Date(),
    status: 'pendiente',
    notes: ''
  };

  receipts: any[] = [];
  q = '';
  page = 1;
  limit = 10;
  total = 0;

  private search$ = new Subject<string>();

  constructor(
    private receiptsService: ReceiptService,
    private route: ActivatedRoute,
    private router: Router,
    private cd: ChangeDetectorRef,
    public toaster: Toaster,
    private http: HttpClient,
    private priceCalculationService: PriceCalculationService
  ) {}

  ngOnInit(): void {
    // Escuchamos los parámetros de búsqueda (si los hay en la URL)
    this.route.queryParams.subscribe(params => {
      if (params['search']) {
        this.q = params['search'];
      }
      this.load(1);
    });

    // Controlamos la búsqueda con debounce (medio segundo)
    this.search$.pipe(debounceTime(500)).subscribe(searchValue => {
      this.load(1, searchValue);
    });
  }

  /**
   * Maneja los cambios en el input de búsqueda
   * @param value texto del input
   */
  onSearchChange(value: string) {
    this.q = value;
    this.search$.next(value);
  }

  /**
   * Carga la lista de recibos desde el backend
   * @param page número de página
   * @param searchTerm término de búsqueda opcional
   */
  load(page = 1, searchTerm?: string) {
    const q = searchTerm ?? this.q;
    const params = { page, limit: this.limit, q };

    this.receiptsService.getReceipts(params).subscribe(resp => {
      console.log('Respuesta de getReceipts:', resp);

      if (resp && resp.success) {
        this.receipts = resp.receipts || [];
        this.total = resp.total || 0;
        this.page = resp.page || page;

        // Forzamos la actualización de la vista
        this.cd.detectChanges();
      }
    });
  }

  /**
   * Navega al detalle de un recibo
   */
  openDetail(r: any) {
    this.router.navigate(['/documents-manager/receipts/view', r.id]);
  }

  /**
   * Navega a la creación de un nuevo recibo
   */
  newReceipt() {
    this.router.navigate(['/documents/receipts/view', 'new']);
  }

  // 💰 ================ MÉTODOS PARA PRECIOS ================ 💰

  /**
   * Obtiene el importe del recibo con redondeo .95 para consistencia con frontend
   * @param receipt Objeto de recibo
   * @returns Importe con redondeo .95 aplicado
   */
  getReceiptAmount(receipt: any): number {
    return this.priceCalculationService.getAdminDisplayPrice(receipt.amount);
  }

}
