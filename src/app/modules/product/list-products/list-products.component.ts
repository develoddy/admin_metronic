import { Component, OnInit } from '@angular/core';
import { URL_BACKEND } from 'src/app/config/config';
import { ProductService } from '../_services/product.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-list-products',
  templateUrl: './list-products.component.html',
  styleUrls: ['./list-products.component.scss']
})
export class ListProductsComponent implements OnInit {

  products:any=[];
  URL_BACKEND:any = URL_BACKEND;
  isLoading$:any = null;

  constructor(
    public _productService: ProductService,
    public _router: Router,
  ) { }

  ngOnInit(): void {
    this.isLoading$ = this._productService.isLoading$;
    this.allProducts();
  }

  allProducts() {
    this._productService.allProducts().subscribe((resp:any)=> {
      this.products = resp.products;
      console.log(this.products);
    });
  }

  editProduct(product) {
    this._router.navigateByUrl("/products/edit-product/"+product._id);
  }

  delete(product) {

  }

}
