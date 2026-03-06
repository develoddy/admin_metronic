import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CategoriesService } from '../_services/categories.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Toaster } from 'ngx-toast-notifications';
import { URL_BACKEND } from 'src/app/config/config';
import { NoticyAlertComponent } from 'src/app/componets/notifications/noticy-alert/noticy-alert.component';

@Component({
  selector: 'app-edit-new-categorie',
  templateUrl: './edit-new-categorie.component.html',
  styleUrls: ['./edit-new-categorie.component.scss']
})
export class EditNewCategorieComponent implements OnInit {
  
  isLoading$:any;
  name:any = null;
  imagen_file:any=null;
  image_preview:any=null;
  @Output() CategorieE: EventEmitter<any> = new EventEmitter();
  @Input() categorie_selected:any;
  state:any=null;

  constructor(
    public _categoriesService: CategoriesService,
    public modal: NgbActiveModal,
    public toaster: Toaster,
  ) { }

  ngOnInit(): void {
    this.name = this.categorie_selected.title;
    this.state = this.categorie_selected.state;
    //this.image_preview = URL_BACKEND+'api/categories/uploads/categorie/'+this.categorie_selected.imagen;
    // 👇 Mostramos la imagen actual priorizando la personalizada
    if (this.categorie_selected?.imagen_home) {
      this.image_preview = this.categorie_selected.imagen_home;
    } else if (this.categorie_selected?.imagen) {
      this.image_preview = `${URL_BACKEND}api/categories/uploads/categorie/${this.categorie_selected.imagen}`;
    } else {
      // Usar un data URL como placeholder en lugar de archivo
      this.image_preview = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="16" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ESin imagen%3C/text%3E%3C/svg%3E';
    }
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
  }

  save() {
    if ( !this.name ) {
      this.toaster.open(NoticyAlertComponent, {text: `danger-Ups! Necesita ingresar todos los campos.`});
      return;
    }
    
    let formData = new FormData();
    formData.append("_id", this.categorie_selected._id);
    formData.append("title", this.name);
    formData.append("state", this.state);
    
    // if ( this.imagen_file ) {
    //   formData.append("portada", this.imagen_file);
    // }
    if (this.imagen_file) {
      formData.append('custom_image', this.imagen_file);
    }

    // code...
    this._categoriesService.updateCategorie(formData).subscribe((resp:any) => {
      console.log(resp);
      this.CategorieE.emit(resp.categorie);
      this.modal.close();
    })
  }
}
