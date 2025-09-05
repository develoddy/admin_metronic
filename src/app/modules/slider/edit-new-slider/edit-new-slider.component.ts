import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Toaster } from 'ngx-toast-notifications';
import { NoticyAlertComponent } from 'src/app/componets/notifications/noticy-alert/noticy-alert.component';
import { URL_BACKEND } from 'src/app/config/config';
import { SliderService } from '../_services/slider.service';

@Component({
  selector: 'app-edit-new-slider',
  templateUrl: './edit-new-slider.component.html',
  styleUrls: ['./edit-new-slider.component.scss']
})
export class EditNewSliderComponent implements OnInit {
  isLoading$:any;
  name: any = null;
  subtitle: any = null;
  description: any = null;
  link: any = null;
  position: string = 'middle-left';
  imagen_mobile_file: any = null;
  imagen_desktop_file: any = null;
  image_mobile_preview: any = null;
  image_desktop_preview: any = null;
  @Output() SliderE: EventEmitter<any> = new EventEmitter();
  @Input() slider_selected:any;
  state:any=1;

  constructor(
    public _sliderService: SliderService,
    public modal: NgbActiveModal,
    public toaster: Toaster,
  ) { }

  ngOnInit(): void {
  this.name = this.slider_selected.title;
  this.subtitle = this.slider_selected.subtitle;
  this.description = this.slider_selected.description;
  this.link = this.slider_selected.link;
  this.position = this.slider_selected.position || 'middle-left';
  this.state = this.slider_selected.state;
  this.image_mobile_preview = this.slider_selected.imagen_mobile_url || (URL_BACKEND+'api/sliders/uploads/slider/'+this.slider_selected.imagen_mobile);
  this.image_desktop_preview = this.slider_selected.imagen_desktop_url || (URL_BACKEND+'api/sliders/uploads/slider/'+this.slider_selected.imagen_desktop);
  }

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
    if (!this.name || !this.link) {
      this.toaster.open(NoticyAlertComponent, { text: `danger-Ups! Necesita ingresar todos los campos obligatorios.` });
      return;
    }

    console.log(this.slider_selected);
    
    let formData = new FormData();
    formData.append("_id", this.slider_selected._id);
    formData.append("title", this.name);
    formData.append("subtitle", this.subtitle || '');
    formData.append("description", this.description || '');
    formData.append("link", this.link);
    formData.append("position", this.position);
    formData.append("state", this.state);
    if (this.imagen_mobile_file) formData.append("imagen_mobile", this.imagen_mobile_file);
    if (this.imagen_desktop_file) formData.append("imagen_desktop", this.imagen_desktop_file);

    this._sliderService.updateSlider(formData).subscribe((resp: any) => {
      console.log(resp.slider);
      
      this.SliderE.emit(resp.slider);
      this.modal.close();
    })
  }
}
