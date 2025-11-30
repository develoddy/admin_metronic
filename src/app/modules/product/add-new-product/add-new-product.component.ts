import { Component, OnInit } from '@angular/core';
import { Toaster } from 'ngx-toast-notifications';
import { NoticyAlertComponent } from 'src/app/componets/notifications/noticy-alert/noticy-alert.component';
import { ProductService } from '../_services/product.service';
import { CategoriesService } from '../../categories/_services/categories.service';

@Component({
  selector: 'app-add-new-product',
  templateUrl: './add-new-product.component.html',
  styleUrls: ['./add-new-product.component.scss']
})
export class AddNewProductComponent implements OnInit {

  title:any = null;
  sku:any = null;
  categories:any = [];
  categorie:any = "";
  price_eur:any = 0; // EUR is the only currency
  price_soles:any = 0; // Legacy - deprecated
  price_usd:any = 0; // Legacy - deprecated
  imagen_file:any=null;
  image_preview:any=null;
  description:any=null;
  resumen:any=null;
  //
  tag:any=null;
  tags:any=[];

  isLoading$:any;

  constructor(
    public _productService: ProductService,
    public _categorieService: CategoriesService,
    public toaster: Toaster,
  ) { }

  ngOnInit(): void {
    this.isLoading$ = this._productService.isLoading$;
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

  processFile($event) {
    if ( $event.target.files[ 0 ].type.indexOf("image") < 0 ) {
      this.image_preview = null;
      this.toaster.open(NoticyAlertComponent, {text: `danger-Ups! Necesita ingresar un archivo de timpo imagen.`});
      return;
    }
    this.imagen_file = $event.target.files[0];
    let reader = new FileReader();
    reader.readAsDataURL(this.imagen_file);
    reader.onloadend = () => this.image_preview = reader.result;
    this.loadServices();
  }

  addTag() {
    this.tags.push(this.tag);
    this.tag = "";
  }

  removeTag(i) {
    this.tags.splice(i,1);
  }

  save() {
    console.log(this.tags.length == 0);
    
    if ( !this.title || !this.categorie || !this.price_eur || !this.resumen || !this.sku || !this.imagen_file || this.tags.length == 0 ) {
      this.toaster.open(NoticyAlertComponent, {text: `danger-Ups! Necesitas digitar todos los campos del formulario.`});
      return;
    }

    let formData = new FormData();
    formData.append("title", this.title);
    formData.append("categorie", this.categorie);
    formData.append("price_eur", this.price_eur);
    formData.append("price_soles", this.price_eur); // Backend compatibility
    formData.append("price_usd", this.price_eur); // Backend compatibility
    formData.append("resumen", this.resumen);
    formData.append("description", this.description);
    formData.append("sku", this.sku);
    formData.append("imagen", this.imagen_file);
    formData.append("tags", JSON.stringify(this.tags));

    this._productService.createProduct(formData).subscribe((resp:any) => {
      console.log(resp);
      if( resp.code == 403 ) {
        this.toaster.open(NoticyAlertComponent, {text: `danger-Ups! El producto ya existe. Digitar otro nombre.`});
        return;
      } else {
        this.toaster.open(NoticyAlertComponent, {text: `primary- El producto se registro correctamente.`});
        this.title = null;
        this.categorie = null;
        this.price_eur = null;
        this.price_soles = null;
        this.price_usd = null;
        this.resumen = null;
        this.description = null;
        this.sku = null;
        this.imagen_file = null;
        this.tags = [];
        this.image_preview = null;
        return;
      }
    })
  }
}
