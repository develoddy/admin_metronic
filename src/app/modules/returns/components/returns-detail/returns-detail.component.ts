import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReturnsService } from '../../_services/returns.service';
import { Toaster } from 'ngx-toast-notifications';
import { NoticyAlertComponent } from 'src/app/componets/notifications/noticy-alert/noticy-alert.component';
import { AdminSalesService } from 'src/app/modules/admin-sales/services/admin-sales.service';

@Component({
  selector: 'app-returns-detail',
  templateUrl: './returns-detail.component.html',
  styleUrls: ['./returns-detail.component.scss']
})
export class ReturnsDetailComponent implements OnInit {

  id: any;
  model: any = {};
  
  constructor(
    private route: ActivatedRoute, 
    private returnsService: ReturnsService, 
    private router: Router,
    public toaster: Toaster,
    public salesService: AdminSalesService
  ) {}

  ngOnInit(): void {
  this.id = this.route.snapshot.paramMap.get('id');
  console.log("Valor de parámetro id =", this.id);

  // Leer valor pasado como query param
  const q = this.route.snapshot.queryParamMap.get('q');

  if (this.id === 'new' && q) {
    if (q.includes('@')) {
      this.model.userEmail = q;  // Email del usuario

      // 🟢 Cargar automáticamente la última venta del usuario
      this.salesService.getLastSale(q).subscribe({
        next: (resp: any) => {
          if (resp.success && resp.sale) {
            this.model.saleId = resp.sale.id;
            console.log('Última venta del usuario:', resp.sale.id);
          } else {
            console.warn('No se encontró venta para este usuario');
          }
        },
        error: (err) => {
          console.error('Error al obtener la última venta:', err);
        }
      });

    } else {
      this.model.guestId = q; // Guest ID

      // 🟢 Cargar automáticamente la última venta del invitado
      this.salesService.getLastSale(q).subscribe({
        next: (resp: any) => {
          if (resp.success && resp.sale) {
            this.model.saleId = resp.sale.id;
            console.log('Última venta del invitado:', resp.sale.id);
          } else {
            console.warn('No se encontró venta para este invitado');
          }
        },
        error: (err) => {
          console.error('Error al obtener la última venta:', err);
        }
      });
    }
  }

  // Si estamos editando una devolución existente
  if (this.id && this.id !== 'new') {
    this.returnsService.getReturnById(+this.id).subscribe({
      next: (resp) => {
        if (resp?.success) {
          this.model = resp.return;
        } else {
          this.toaster.open(NoticyAlertComponent, {
            text: `warning-No se encontraron datos de la devolución.`
          });
        }
      },
      error: (err) => {
        this.toaster.open(NoticyAlertComponent, {
          text: `danger-${err.error?.message || 'Error al cargar la devolución.'}`
        });
      }
    });
  }
}


  save() {
    if (!this.model.saleId) {
      this.toaster.open(NoticyAlertComponent, { text: 'warning-Debes indicar un ID de pedido válido.' });
      return;
    }

    const request$ = this.id === 'new'
      ? this.returnsService.createReturn(this.model)
      : this.returnsService.updateReturn(+this.id, this.model);

    request$.subscribe({
      next: (resp: any) => {

        if (resp?.success) {
          this.toaster.open(NoticyAlertComponent, {
            text: `success-Devolución ${this.id === 'new' ? 'creada' : 'actualizada'} correctamente.`
          });
          this.router.navigate(['/returns/list']);
        } else {
          this.toaster.open(NoticyAlertComponent, { text: `danger-${resp.message || 'Error desconocido.'}` });
        }
      },
      error: (err) => {
        const msg = err.error?.message || 'Error inesperado al guardar la devolución.';
        this.toaster.open(NoticyAlertComponent, { text: `danger-${msg}` });
      }
    });
  }

  // save() {
  //   if (this.id === 'new') {
  //     this.returnsService.createReturn(this.model).subscribe(() => this.router.navigate(['/returns/list']));
  //   } else {
  //     this.returnsService.updateReturn(+this.id, this.model).subscribe(() => this.router.navigate(['/returns/list']));
  //   }
  // }

  cancel() {
    this.router.navigate(['/returns/list']);
  }
}
