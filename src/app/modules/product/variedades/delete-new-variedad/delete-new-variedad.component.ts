import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ProductService } from '../../_services/product.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Toaster } from 'ngx-toast-notifications';
import { NoticyAlertComponent } from 'src/app/componets/notifications/noticy-alert/noticy-alert.component';

@Component({
  selector: 'app-delete-new-variedad',
  templateUrl: './delete-new-variedad.component.html',
  styleUrls: ['./delete-new-variedad.component.scss']
})
export class DeleteNewVariedadComponent implements OnInit {

  @Output() VariedadD: EventEmitter<any> = new EventEmitter();
  @Input() variedad:any;

  constructor(
    public _modal: NgbActiveModal,
    public _productService: ProductService,
    public toaster: Toaster,
  ) { }

  ngOnInit(): void {
  }

  delete() {
    this._productService.deleteVariedad(this.variedad._id).subscribe((resp:any) => {
      this.VariedadD.emit('');
      this._modal.close();
    }, (error) => {
      if (error.error) {
        this.toaster.open(NoticyAlertComponent, {text: `danger-${error.error.message}.`});
      }
    });
  }

}
