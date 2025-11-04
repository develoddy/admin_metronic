import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReturnsService } from '../../_services/returns.service';
import { Toaster } from 'ngx-toast-notifications';
import { NoticyAlertComponent } from 'src/app/componets/notifications/noticy-alert/noticy-alert.component';

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
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');

    console.log("Valor de parametro id = new", this.id);
    

    // Leer valor pasado como query param
    const q = this.route.snapshot.queryParamMap.get('q');

    if (this.id === 'new' && q) {
      if (q.includes('@')) {
        this.model.userEmail = q;  // Email del usuario
      } else {
        this.model.guestId = q;    // Guest ID
      }
    }

    // Si estamos editando, cargar datos
    if (this.id && this.id !== 'new') {
      this.returnsService.getReturnById(+this.id).subscribe({
        next: (resp) => {
          if (resp?.success) {
            this.model = resp.return;
          } else {
            this.toaster.open(NoticyAlertComponent, { text: `warning-No se encontraron datos de la devolución.` });
          }
        },
        error: (err) => {
          this.toaster.open(NoticyAlertComponent, { text: `danger-${err.error?.message || 'Error al cargar la devolución.'}` });
        }
      });
    }

    // if (this.id && this.id !== 'new') {
    //   this.returnsService.getReturnById(+this.id).subscribe(resp => {
    //     console.log("GetReturnById; ", resp);
        
    //     if (resp && resp.success) this.model = resp.return;
    //   });
    // }
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
