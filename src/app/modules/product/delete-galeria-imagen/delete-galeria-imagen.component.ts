import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ProductService } from '../_services/product.service';
import { Toaster } from 'ngx-toast-notifications';
import { NoticyAlertComponent } from 'src/app/componets/notifications/noticy-alert/noticy-alert.component';

@Component({
  selector: 'app-delete-galeria-imagen',
  templateUrl: './delete-galeria-imagen.component.html',
  styleUrls: ['./delete-galeria-imagen.component.scss']
})
export class DeleteGaleriaImagenComponent implements OnInit {
  @Output() ImagenD: EventEmitter<any> = new EventEmitter();
  @Input() imagen:any;
  @Input() product_id:any;

  constructor(
    public _modal: NgbActiveModal,
    public _productService: ProductService,
    public toaster: Toaster,
  ) { }

  ngOnInit(): void {
  }

  delete() {
    let data = {
      _id: this.product_id,
      __id:this.imagen._id,
    }
    this._productService.deleteGaleria(data).subscribe((resp:any) => {
      this.ImagenD.emit('');
      this._modal.close();
    }, (error) => {
      if (error.error) {
        this.toaster.open(NoticyAlertComponent, {text: `danger-${error.error.message}.`});
      }
    });
  }
}
