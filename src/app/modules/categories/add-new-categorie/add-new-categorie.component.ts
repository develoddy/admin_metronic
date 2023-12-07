import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CategoriesService } from '../_services/categories.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Toaster } from 'ngx-toast-notifications';
import { NoticyAlertComponent } from 'src/app/componets/notifications/noticy-alert/noticy-alert.component';

@Component({
  selector: 'app-add-new-categorie',
  templateUrl: './add-new-categorie.component.html',
  styleUrls: ['./add-new-categorie.component.scss']
})
export class AddNewCategorieComponent implements OnInit {
  isLoading$:any;
  name:any = null;
  imagen_file:any=null;
  image_preview:any=null;
  @Output() CategorieC: EventEmitter<any> = new EventEmitter();

  constructor(
    public _categoriesService: CategoriesService,
    public modal: NgbActiveModal,
    public toaster: Toaster,
  ) { }

  ngOnInit(): void {
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

    if ( !this.name || !this.imagen_file ) {
      this.toaster.open(NoticyAlertComponent, {text: `danger-Ups! Necesita ingresar todos los campos.`});
      return;
    }

    let formData = new FormData();
    formData.append("title", this.name);
    formData.append("portada", this.imagen_file);

    // code...
    this._categoriesService.createCategorie(formData).subscribe((resp:any) => {
      console.log(resp);
      this.CategorieC.emit(resp);
      this.modal.close();
    })
  }
}
