import { Component, OnInit } from '@angular/core';
import { CategoriesService } from 'src/app/modules/categories/_services/categories.service';
import { ProductService } from 'src/app/modules/product/_services/product.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  categories:any=[];
  constructor( 
    public _serviceCategorie: CategoriesService, 
    public _productService: ProductService,
  ) { }

  ngOnInit(): void {
    console.log("------ DEBUGG: DASHBOARD LOAD -------");
    //this.allCategories();
    //this.allProducts();
  }

  // allProducts() {
  //   this._productService.allProducts().subscribe((resp:any) => {
  //     console.log("DEBUGG: ------ all allProducts");
  //     console.log(resp);
  //     //this.categories = resp.categories
  //   });
  // }

  // allCategories() {
  //   this._serviceCategorie.allCategories().subscribe((resp:any) => {

  //     console.log("DEBUGG: ------ all allCategories");
  //     console.log(resp);
  //     //this.categories = resp.categories
  //   });
  // }
}
