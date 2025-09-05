import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { SliderService } from '../_services/slider.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Toaster } from 'ngx-toast-notifications';
import { NoticyAlertComponent } from 'src/app/componets/notifications/noticy-alert/noticy-alert.component';

@Component({
  selector: 'app-add-new-slider',
  templateUrl: './add-new-slider.component.html',
  styleUrls: ['./add-new-slider.component.scss']
})
export class AddNewSliderComponent implements OnInit {
  isLoading$: any;
  name: any = null;
  subtitle: any = null;
  description: any = null;
  link: any = null;
  position: string = 'middle-left';
  imagen_mobile_file: any = null;
  imagen_desktop_file: any = null;
  image_mobile_preview: any = null;
  image_desktop_preview: any = null;
  @Output() SliderC: EventEmitter<any> = new EventEmitter();

  constructor(
    public _sliderService: SliderService,
    public modal: NgbActiveModal,
    public toaster: Toaster,
  ) { }

  ngOnInit(): void { }

  processFileMobile($event) {
    if ($event.target.files[0].type.indexOf("image") < 0) {
      this.image_mobile_preview = null;
      this.toaster.open(NoticyAlertComponent, { text: `danger-Ups! Necesita ingresar un archivo de tipo imagen para mobile.` });
      return;
    }
    this.imagen_mobile_file = $event.target.files[0];
    let reader = new FileReader();
    reader.readAsDataURL(this.imagen_mobile_file);
    reader.onloadend = () => this.image_mobile_preview = reader.result;
  }

  processFileDesktop($event) {
    if ($event.target.files[0].type.indexOf("image") < 0) {
      this.image_desktop_preview = null;
      this.toaster.open(NoticyAlertComponent, { text: `danger-Ups! Necesita ingresar un archivo de tipo imagen para desktop.` });
      return;
    }
    this.imagen_desktop_file = $event.target.files[0];
    let reader = new FileReader();
    reader.readAsDataURL(this.imagen_desktop_file);
    reader.onloadend = () => this.image_desktop_preview = reader.result;
  }

  save() {
    if (!this.name || !this.imagen_mobile_file || !this.imagen_desktop_file || !this.link) {
      this.toaster.open(NoticyAlertComponent, { text: `danger-Ups! Necesita ingresar todos los campos obligatorios.` });
      return;
    }

    let formData = new FormData();
    formData.append("title", this.name);
    formData.append("subtitle", this.subtitle || '');
    formData.append("description", this.description || '');
  formData.append("link", this.link);
  formData.append("position", this.position);
  formData.append("imagen_mobile", this.imagen_mobile_file);
  formData.append("imagen_desktop", this.imagen_desktop_file);

    this._sliderService.createSlider(formData).subscribe((resp: any) => {
      this.SliderC.emit(resp);
      this.modal.close();
    })
  }
}
