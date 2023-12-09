import { Component, OnInit } from '@angular/core';
import { URL_BACKEND } from 'src/app/config/config';
import { ProductService } from '../_services/product.service';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DeleteNewProductComponent } from '../delete-new-product/delete-new-product.component';
import { NoticyAlertComponent } from 'src/app/componets/notifications/noticy-alert/noticy-alert.component';
import { Toaster } from 'ngx-toast-notifications';
import { CategoriesService } from '../../categories/_services/categories.service';

@Component({
  selector: 'app-list-products',
  templateUrl: './list-products.component.html',
  styleUrls: ['./list-products.component.scss']
})
export class ListProductsComponent implements OnInit {

  products:any=[];
  URL_BACKEND:any = URL_BACKEND;
  isLoading$:any = null;
  search:any=null;
  categorie:any='';
  categories:any=[];

  constructor(
    public _productService: ProductService,
    public _categorieService: CategoriesService,
    public _router: Router,
    public _modalService: NgbModal,
    public _toaster: Toaster,
  ) { }

  ngOnInit(): void {
    this.isLoading$ = this._productService.isLoading$;
    this.allProducts();
    this.allCategories();
  }

  allProducts() {
    this._productService.allProducts(this.search, this.categorie).subscribe((resp:any)=> {
      this.products = resp.products;
      console.log(this.products);
    });
  }

  allCategories() {
    this._categorieService.allCategories().subscribe((resp:any) => {
      this.categories = resp.categories;
      this.loadServices();
    });
  }

  loadServices() {
    this._productService.isLoadingSubject.next(true);
    setTimeout(() => {
      this._productService.isLoadingSubject.next(false);
    }, 50);
  }

  refresh() {
    this.search = null
    this.categorie = null
    this.allProducts();
  }

  editProduct(product) {
    this._router.navigateByUrl("/products/edit-product/"+product._id);
  }

  delete(product) {
    const modalRef = this._modalService.open(DeleteNewProductComponent, {centered:true, size: 'sm'});
    modalRef.componentInstance.product = product;

    modalRef.componentInstance.ProductD.subscribe((resp:any) => {
      let index = this.products.findIndex(item => item._id == product._id);
      if (index != -1) {
        this.products.splice(index,1);
        this._toaster.open(NoticyAlertComponent, {text: `primary- El producto se elimnó correctamente.`});
      }
    });
  }

}
