import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ProductService } from '../_services/product.service';
import { Toaster } from 'ngx-toast-notifications';
import { NoticyAlertComponent } from 'src/app/componets/notifications/noticy-alert/noticy-alert.component';

@Component({
  selector: 'app-delete-new-product',
  templateUrl: './delete-new-product.component.html',
  styleUrls: ['./delete-new-product.component.scss']
})
export class DeleteNewProductComponent implements OnInit {

  @Output() ProductD: EventEmitter<any> = new EventEmitter();
  @Input() product:any;

  constructor(
    public _modal: NgbActiveModal,
    public _productService: ProductService,
    public _toaster: Toaster,
  ) { }

  ngOnInit(): void {
  }

  delete() {
    this._productService.deleteProduct(this.product._id).subscribe((resp:any) => {
      this.ProductD.emit('');
      this._modal.close();
    }, (error) => {
      if (error.error) {
        this._toaster.open(NoticyAlertComponent, {text: `danger-${error.error.message}.`});
      }
    });
  }

}
