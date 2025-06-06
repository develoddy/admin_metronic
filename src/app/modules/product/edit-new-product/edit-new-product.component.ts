import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { ProductService } from '../_services/product.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoriesService } from '../../categories/_services/categories.service';
import { NoticyAlertComponent } from 'src/app/componets/notifications/noticy-alert/noticy-alert.component';
import { Toaster } from 'ngx-toast-notifications';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EditNewVariedadComponent } from '../variedades/edit-new-variedad/edit-new-variedad.component';
import { DeleteNewVariedadComponent } from '../variedades/delete-new-variedad/delete-new-variedad.component';
import { DeleteGaleriaImagenComponent } from '../delete-galeria-imagen/delete-galeria-imagen.component';
import { Subscription } from 'rxjs';

declare var tinymce: any;
@Component({
  selector: 'app-edit-new-product',
  templateUrl: './edit-new-product.component.html',
  styleUrls: ['./edit-new-product.component.scss']
})
export class EditNewProductComponent implements OnInit, AfterViewInit, OnDestroy {

  product_id:any=null;
  product_selected:any=null;
  title:any = null;
  sku:any = null;
  thumbnail_url:any = null;
  categories:any = [];
  categorie:any = "";
  price_soles:any = 0;
  price_usd:any = 0;
  imagen_file:any=null;
  image_preview:any=null;
  description:any=null;
  resumen:any=null;
  state:any=1;
  logo_position: string = '';


  color:any=null;
  //
  tag:any=null;
  tags:any=[];

  isLoading$:any;

  type_inventario:any = 1;
  stock:any=0;
  
  stock_multiple:any=0;
  valor_multiple:any="";

  variedades:any=[];

  image_preview_galeria:any = null;
  imagen_file_galeria: any = null;

  galerias:any=[];

  activeIndex: number = 0; // Inicializar el índice activo

  selectedColor: string = '';

  private subscriptions: Subscription = new Subscription();

  constructor(
    public _productService: ProductService,
    public _categorieService: CategoriesService,
    public _router: Router,
    public _activeRouter: ActivatedRoute,
    public toaster: Toaster,
    public _modalService: NgbModal
  ) { 
    
  }
  ngAfterViewInit(): void {
    setTimeout(() => {
      this.tinymceINIT();
    }, 150);
  }

  ngOnInit(): void {
    
    // this.subscriptions = this._productService.isLoading$.subscribe(isLoading => {
    //   this.isLoading$= isLoading;
    // });
    this.isLoading$ = this._productService.isLoading$;
    this._activeRouter.params.subscribe((resp:any) => {
      this.product_id = resp.id;
    });
    

    

    this._productService.showProduct(this.product_id).subscribe((resp:any) => {

      this.product_selected = resp.product;
      console.log("priduct seleted: ", this.product_selected);
      
      this.title = this.product_selected.title;
      this.sku = this.product_selected.sku;
      this.categorie = this.product_selected.categorie.id;
      //this.categorie = this.product_selected.categorie ? this.product_selected.categorie._id : 0;
      this.price_soles = this.product_selected.price_soles;     
      this.price_usd = this.product_selected.price_usd;
      this.stock = this.product_selected.stock;      
      this.image_preview = this.product_selected.imagen;
      this.description = this.product_selected.description;
      this.resumen = this.product_selected.resumen;
      this.tags = this.product_selected.tags;
      
      // this.variedades = this.product_selected.variedades;
      this.variedades = this.getUniqueVariedades(this.product_selected.variedades);
      this.type_inventario = this.product_selected.type_inventario;
      this.galerias = this.product_selected.galerias;
      this.state = this.product_selected.state;
      this.logo_position = this.product_selected.logo_position;

    });

    

    this._categorieService.allCategories().subscribe((resp:any) => {
      this.categories = resp.categories;
      this.loadServices();
    });
  }

  tinymceINIT() {
    tinymce.init({
      selector: 'textarea#description',
      height: 250,
      language: 'es',
      plugins: [
        'advlist autolink lists link image charmap print preview anchor',
        'searchreplace visualblocks code fullscreen',
        'insertdatetime media table paste code help wordcount'
      ],
      toolbar:
        'undo redo | formatselect | bold italic backcolor | ' +
        'alignleft aligncenter alignright alignjustify | ' +
        'bullist numlist outdent indent | removeformat | help',
      setup: (editor) => {
        editor.on('Change KeyUp', () => {
          this.description = editor.getContent();
        });
      }
    });
    
  }

  getUniqueVariedades(variedades) {
    const uniqueVariedades = variedades.reduce((acc:any, current:any) => {
      const x = acc.find((item:any) => item.valor === current.valor);
      if (!x) {
        return acc.concat([current]);
      } else {
        return acc;
      }
    }, []);
    return uniqueVariedades;
  }

  selectColor(index: number): void {
    //this.selectedColorIndex = index;
    this.selectedColor = this.tags[index];
  }

  getColorHex(color: string): string {
    // Mapea los nombres de los colores a sus valores hexadecimales correspondientes
    const colorMap: { [key: string]: string } = {
        'Faded Black': '#424242',
        'Faded Khaki': '#dbc4a2',
        'Black': '#080808',
        'Navy': '#152438',
        'Maroon': '#6c152b',
        'Red': '#e41525',
        'Royal': '#1652ac',
        'Sport Grey': '#9b969c',
        'Light blue': '#9dbfe2',
        'Faded Eucalyptus': '#d1cbad',
        'Faded Bone': '#f3ede4',
        'White': '#ffffff',
        // Puedes agregar más colores aquí según sea necesario
    };
    // Devuelve el valor hexadecimal correspondiente al color
    return colorMap[color] || '';
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

  processFileGaleria($event) {
    if ( $event.target.files[ 0 ].type.indexOf("image") < 0 ) {
      this.image_preview_galeria = null;
      this.toaster.open(NoticyAlertComponent, {text: `danger-Ups! Necesita ingresar un archivo de tipo imagen`});
      return;
    }
    this.imagen_file_galeria = $event.target.files[0];
    let reader = new FileReader();
    reader.readAsDataURL(this.imagen_file_galeria);
    reader.onloadend = () => this.image_preview_galeria = reader.result;
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

    this.description = tinymce.get('description').getContent();

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
    formData.append("state", this.state);
    formData.append("logo_position", this.logo_position);

    if (this.imagen_file) {
      formData.append("imagen", this.imagen_file);
    }

    this._productService.updateProduct(formData).subscribe((resp:any) => {
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
      product                        : this.product_id,
      valor                          : this.valor_multiple,
      stock                          : this.stock_multiple,
      color                          : this.color,
      external_id                    : null,
      sync_product_id                : null,
      name                           : null,
      synced                         : null,
      variant_id                     : null,
      main_category_id               : null,
      warehouse_product_id           : null,
      warehouse_product_variant_id   : null,
      retail_price                   : this.price_soles || this.price_usd,
      sku                            : this.product_selected.sku,
      currency                       : "EUR",
    }

    this._productService.createVariedad(data).subscribe((resp:any) => {
      this.valor_multiple = null;
      this.stock_multiple = null;

      let index = this.variedades.findIndex(item => item._id == resp.variedad._id);
      if (index != -1) {
        //this.variedades[index] = resp.variedad;
        this.variedades.push(resp.variedad);
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
      let index = this.variedades.findIndex(item => item.id == VariedadE.id);
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
      let index = this.variedades.findIndex(item => item.id == variedad.id);
      if (index != -1) {
        this.variedades.splice(index,1);
        this.toaster.open(NoticyAlertComponent, {text: `primary- La variedad se elimnó correctamente.`});
      }
    });
  }

  storeImagen() {
    if (!this.imagen_file_galeria ) {
      this.toaster.open(NoticyAlertComponent, {text: `danger- Necesitas selecionar una imagen.`});
      return; 
    }

    if (!this.selectedColor ) {
      this.toaster.open(NoticyAlertComponent, {text: `danger- Necesitas selecionar un color para la imagen`});
      return; 
    }

    let formData = new FormData();
    formData.append("_id", this.product_id);
    formData.append("imagen", this.imagen_file_galeria);
    formData.append("color", this.selectedColor);
    formData.append("__id", new Date().getTime().toString());

    this._productService.createGaleria(formData).subscribe((resp:any) => {
      this.imagen_file_galeria = null;
      this.image_preview_galeria = null;
      this.galerias.unshift( resp.imagen );
    });
  }

  removeImage(imagen) {    
    const modalRef = this._modalService.open(DeleteGaleriaImagenComponent, {centered:true, size: 'sm'});
    modalRef.componentInstance.imagen = imagen;
    modalRef.componentInstance.product_id = this.product_id;
    modalRef.componentInstance.ImagenD.subscribe((resp:any) => {
      
      let index = this.galerias.findIndex(item => item.id == imagen.id);
      if (index != -1) {
        this.galerias.splice(index,1);
        this.toaster.open(NoticyAlertComponent, {text: `primary- La imagen se elimnó correctamente.`});
      }
    });
  }

  ngOnDestroy(): void {
    // Desuscribir todas las suscripciones en el método OnDestroy
    if (this.subscriptions) {
      this.subscriptions.unsubscribe();
    }
    tinymce.remove('textarea#description'); // Limpiar TinyMCE cuando se destruye el componente
  }
}
