import { Component, OnInit } from '@angular/core';
import { ProductService } from '../_services/product.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoriesService } from '../../categories/_services/categories.service';
import { NoticyAlertComponent } from 'src/app/componets/notifications/noticy-alert/noticy-alert.component';
import { Toaster } from 'ngx-toast-notifications';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EditNewVariedadComponent } from '../variedades/edit-new-variedad/edit-new-variedad.component';
import { DeleteNewVariedadComponent } from '../variedades/delete-new-variedad/delete-new-variedad.component';

@Component({
  selector: 'app-edit-new-product',
  templateUrl: './edit-new-product.component.html',
  styleUrls: ['./edit-new-product.component.scss']
})
export class EditNewProductComponent implements OnInit {

  product_id:any=null;
  product_selected:any=null;
  title:any = null;
  sku:any = null;
  categories:any = [];
  categorie:any = "";
  price_soles:any = 0;
  price_usd:any = 0;
  imagen_file:any=null;
  image_preview:any=null;
  description:any=null;
  resumen:any=null;
  //
  tag:any=null;
  tags:any=[];

  isLoading$:any;
  type_inventario:any = 1;
  stock:any=0;
  
  stock_multiple:any=0;
  valor_multiple:any="";


  variedades:any=[];

  constructor(
    public _productService: ProductService,
    public _categorieService: CategoriesService,
    public _router: Router,
    public _activeRouter: ActivatedRoute,
    public toaster: Toaster,
    public _modalService: NgbModal
  ) { }

  ngOnInit(): void {
    this.isLoading$ = this._productService.isLoading$;
    this._activeRouter.params.subscribe((resp:any) => {
      console.log(resp);
      this.product_id = resp.id;
    });

    this._productService.showProduct(this.product_id).subscribe((resp:any) => {
      console.log(resp);
      
      this.product_selected = resp.product;
      this.title = this.product_selected.title;
      this.sku = this.product_selected.sku;
      this.categorie = this.product_selected.categorie._id;
      this.price_soles = this.product_selected.price_soles;     
      this.price_usd = this.product_selected.price_usd;
      this.stock = this.product_selected.stock;
      this.image_preview = this.product_selected.imagen;
      this.description = this.product_selected.description;
      this.resumen = this.product_selected.resumen;
      this.tags = this.product_selected.tags;
      this.variedades = this.product_selected.variedades;
      this.type_inventario = this.product_selected.type_inventario;
    });

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

  update() {
    if ( !this.title || !this.categorie || !this.price_soles || !this.price_usd || !this.resumen || !this.description || !this.sku || this.tags.length == 0 ) {
      this.toaster.open(NoticyAlertComponent, {text: `danger-Ups! Necesitas digitar todos los campos del formulario.`});
      return;
    }

    let formData = new FormData();
    formData.append("_id", this.product_id);
    formData.append("title", this.title);
    formData.append("categorie", this.categorie);
    formData.append("price_soles", this.price_soles);
    formData.append("price_usd", this.price_usd);
    formData.append("resumen", this.resumen);
    formData.append("description", this.description);
    formData.append("sku", this.sku);
    formData.append("tags", JSON.stringify(this.tags));
    formData.append("stock", this.stock);
    formData.append("type_inventario", this.type_inventario);

    if (this.imagen_file) {
      formData.append("imagen", this.imagen_file);
    }

    this._productService.updateProduct(formData).subscribe((resp:any) => {
      console.log(resp);
      if( resp.code == 403 ) {
        this.toaster.open(NoticyAlertComponent, {text: `danger-Ups! El producto ya existe. Digitar otro nombre.`});
        return;
      } else {
        this.toaster.open(NoticyAlertComponent, {text: `primary- El producto se modificado correctamente.`});
        return;
      }
    })
  }

  listProduct() {
    this._router.navigateByUrl("/products/list-all-products");
  }

  checkedInventario(value) {
    this.type_inventario =  value;
  }

  saveVariedad() {
    if ( !this.valor_multiple || !this.stock_multiple) {
      this.toaster.open(NoticyAlertComponent, {text: `danger- Es necesario digitar un valor y una cantidad.`});
      return;
    }
    let data = {
      product: this.product_id,
      valor: this.valor_multiple,
      stock: this.stock_multiple,
    }
    this._productService.createVariedad(data).subscribe((resp:any) => {
      console.log(resp);
      this.valor_multiple = null;
      this.stock_multiple = null;

      let index = this.variedades.findIndex(item => item._id == resp.variedad._id);
      if (index != -1) {
        this.variedades[index] = resp.variedad;
        this.toaster.open(NoticyAlertComponent, {text: `primary- La variedad se modifico correctamente.`});
      } else {
        this.variedades.unshift(resp.variedad);
        this.toaster.open(NoticyAlertComponent, {text: `primary- La variedad se registró correctamente.`});
      }
    });
  }

  editVariedad(variedad) {
    const modalRef = this._modalService.open(EditNewVariedadComponent, {centered:true, size: 'sm'});
    modalRef.componentInstance.variedad = variedad;

    modalRef.componentInstance.VariedadE.subscribe((VariedadE:any) => {
      let index = this.variedades.findIndex(item => item._id == VariedadE._id);
      if (index != -1) {
        this.variedades[index] = VariedadE;
        this.toaster.open(NoticyAlertComponent, {text: `primary- La variedad se modifico correctamente.`});
      }
    });
  }

  deleteVariedad(variedad){
    const modalRef = this._modalService.open(DeleteNewVariedadComponent, {centered:true, size: 'sm'});
    modalRef.componentInstance.variedad = variedad;

    modalRef.componentInstance.VariedadD.subscribe((resp:any) => {
      let index = this.variedades.findIndex(item => item._id == variedad._id);
      if (index != -1) {
        this.categories.splice(index,1);
        this.toaster.open(NoticyAlertComponent, {text: `primary- La variedad se elimnó correctamente.`});
      }
    });
  }
}
