import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ProductService } from '../../_services/product.service';

@Component({
  selector: 'app-edit-new-variedad',
  templateUrl: './edit-new-variedad.component.html',
  styleUrls: ['./edit-new-variedad.component.scss']
})
export class EditNewVariedadComponent implements OnInit {

  @Input() variedad:any;
  @Output() VariedadE: EventEmitter<any> = new EventEmitter();
  isLoading$:any;
  variedad_multiple:any=null;
  stock=0;

  constructor(
    public _modal: NgbActiveModal,
    public _productService: ProductService,
  ) { }

  ngOnInit(): void {
    console.log("______ ADMIN: variedad ", this.variedad );
    this.variedad_multiple = this.variedad.valor;
    this.stock = this.variedad.stock;
  }

  update() {
    let data = {
      _id: this.variedad.id,
      valor: this.variedad_multiple,
      stock: this.stock,
    };

    this._productService.updateVariedad(data).subscribe((resp:any) => {
      console.log(resp);
      this.VariedadE.emit(resp.variedad);
      this._modal.close();
    });
  }
}
