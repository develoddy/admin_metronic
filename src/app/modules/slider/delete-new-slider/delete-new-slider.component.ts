import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SliderService } from '../_services/slider.service';
import { Toaster } from 'ngx-toast-notifications';
import { NoticyAlertComponent } from 'src/app/componets/notifications/noticy-alert/noticy-alert.component';

@Component({
  selector: 'app-delete-new-slider',
  templateUrl: './delete-new-slider.component.html',
  styleUrls: ['./delete-new-slider.component.scss']
})
export class DeleteNewSliderComponent implements OnInit {

  @Output() SliderD: EventEmitter<any> = new EventEmitter();
  @Input() slider_selected:any;

  constructor(
    public _modal: NgbActiveModal,
    public _sliderService: SliderService,
    public toaster: Toaster,
  ) { }

  ngOnInit(): void {
  }

  delete() {
    this._sliderService.deleteSlider(this.slider_selected._id).subscribe((resp:any) => {
      this.SliderD.emit('');
      this.toaster.open(NoticyAlertComponent, {text:  `success-El Slider se ha eliminado correctamente.`});
      this._modal.close();
    }, (error) => {
      if (error.error) {
        this.toaster.open(NoticyAlertComponent, {text: `danger-${error.error.message}.`});
      }
    });
  }

}
