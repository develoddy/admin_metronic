import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Toaster } from 'ngx-toast-notifications';
import { ReceiptService } from '../../../_services/receipt.service';
import { NoticyAlertComponent } from 'src/app/componets/notifications/noticy-alert/noticy-alert.component';

@Component({
  selector: 'app-receipts-create',
  templateUrl: './receipts-create.component.html',
  styleUrls: ['./receipts-create.component.scss']
})
export class ReceiptsCreateComponent implements OnInit {

  // Formulario del recibo
  form = {
    userId: null,
    guestId: null,
    saleId: null,
    amount: null,
    paymentMethod: 'efectivo',
    paymentDate: '',
    status: 'pendiente',
    notes: ''
  };

  constructor(
    private receiptsService: ReceiptService,
    private router: Router,
    private toaster: Toaster
  ) { }

  ngOnInit(): void {
    // Fecha por defecto: hoy
    const today = new Date();
    this.form.paymentDate = today.toISOString().split('T')[0];
  }

  submitReceipt() {
    this.receiptsService.createReceipt(this.form).subscribe({
      next: (res) => {
        this.toaster.open(NoticyAlertComponent, {
          text: `success-Recibo creado correctamente.`
        });
      },
      error: (err) => {
        this.toaster.open(NoticyAlertComponent, {
          text: `danger-No se pudo crear el recibo.`
        });
      }
    });
  }

}
