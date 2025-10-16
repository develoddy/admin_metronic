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

  pagedProducts: any[] = [];
  limit: number = 20;          // Productos por página
  currentPage: number = 1;
  totalPages: number = 1;

  // logo_position: string = '';

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
      this.products = resp.products || [];
      // Resetea paginación al buscar
      this.currentPage = 1;

      this.totalPages = Math.ceil(this.products.length / this.limit);
      this.updatePagedProducts();
    });
  }

  updatePagedProducts() {
    const start = (this.currentPage - 1) * this.limit;
    const end = start + this.limit;
    this.pagedProducts = this.products.slice(start, end);
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagedProducts();
  }

  nextPage() {
    this.goToPage(this.currentPage + 1);
  }

  prevPage() {
    this.goToPage(this.currentPage - 1);
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
    this.search = null;
    this.categorie = null;
    this.allProducts();
  }

  synPrintful() {
    
  }

  editProduct(product) {
    this._router.navigateByUrl("/products/edit-product/"+product._id);
    
    // API PRINTFUL
    // NOTA: HABRA QUE VALIDAR SI SE TRABAJA CON API PRINTFUL O CON OTRO PROVEEDOR DE DROPSHIPING
    //this._router.navigateByUrl("/products/edit-product/"+product.id);
    
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
