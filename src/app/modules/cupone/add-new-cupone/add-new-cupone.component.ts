import { Component, OnInit } from '@angular/core';
import { CuponeService } from '../_services/cupone.service';
import { Toaster } from 'ngx-toast-notifications';
import { NoticyAlertComponent } from 'src/app/componets/notifications/noticy-alert/noticy-alert.component';

@Component({
  selector: 'app-add-new-cupone',
  templateUrl: './add-new-cupone.component.html',
  styleUrls: ['./add-new-cupone.component.scss']
})
export class AddNewCuponeComponent implements OnInit {

  isLoading$:any;

  products: any = [];
  categories: any = [];

  product: any = "";
  categorie: any = "";

  code:any = null;
  type_discount: any = 1;
  discount: any = 0;
  type_count: any = 1;
  num_use: any = 0;
  type_segment: any = 1;
  products_selected: any = [];
  categories_selected: any = [];

  constructor(
    public _cuponeService: CuponeService,
    public toaster: Toaster,
  ) { }

  ngOnInit(): void {
    this.isLoading$ = this._cuponeService.isLoading$;
    this._cuponeService.cuponesConfig().subscribe((resp:any) => {
      console.log(resp);
      this.categories = resp.categories;
      this.products = resp.products;
    });
  }

  checkedTypeDiscount(value) {
    this.type_discount = value;
  }

  checkedTypeCount(value) {
    this.type_count = value;
  }

  checkedTypeSegment(value) {
    this.type_segment = value;
    this.categories_selected = [];
    this.products_selected = [];
  }

  addProductOrCategorie() {
    if (this.type_segment == 1) {
      let INDEX = this.products_selected.findIndex(item => item._id == this.product);
      if (INDEX != -1) {
        this.toaster.open(NoticyAlertComponent, {text: `danger-Ups! El producto ya existe. Selecciona otro producto.`});
        return;
      } else {
        let PRODUCT_S = this.products.find(item => item._id == this.product);
        this.product = null;
        this.products_selected.unshift(PRODUCT_S);
      }
    } else {
      let INDEX = this.categories_selected.findIndex(item => item._id == this.categorie);
      if (INDEX != -1) {
        this.toaster.open(NoticyAlertComponent, {text: `danger-Ups! La categoria ya existe. Selecciona otro categoria.`});
        return;
      } else {
        let CATEGORIA_S = this.categories.find(item => item._id == this.categorie);
        this.categorie = null;
        this.categories_selected.unshift(CATEGORIA_S);
      }
    } 
  }

}
