import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DiscountService } from '../_service/discount.service';
import { Toaster } from 'ngx-toast-notifications';
import { NoticyAlertComponent } from 'src/app/componets/notifications/noticy-alert/noticy-alert.component';

@Component({
  selector: 'app-delete-new-discount',
  templateUrl: './delete-new-discount.component.html',
  styleUrls: ['./delete-new-discount.component.scss']
})
export class DeleteNewDiscountComponent implements OnInit {

  @Output() DiscountD: EventEmitter<any> = new EventEmitter();
  @Input() discount_selected:any;

  constructor(
    public _modal: NgbActiveModal,
    public _discountService: DiscountService,
    public toaster: Toaster,
  ) { }

  ngOnInit(): void {
  }

  delete() {
    this._discountService.deleteDiscount(this.discount_selected._id).subscribe((resp:any) => {
      this.DiscountD.emit('');
      this.toaster.open(NoticyAlertComponent, {text:  `success-El descuento se ha eliminado correctamente.`});
      this._modal.close();
    }, (error) => {
      if (error.error) {
        this.toaster.open(NoticyAlertComponent, {text: `danger-${error.error.message}.`});
      }
    });
  }
}
