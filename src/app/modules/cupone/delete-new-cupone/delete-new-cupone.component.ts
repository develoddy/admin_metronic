import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Toaster } from 'ngx-toast-notifications';
import { NoticyAlertComponent } from 'src/app/componets/notifications/noticy-alert/noticy-alert.component';
import { CuponeService } from '../_services/cupone.service';

@Component({
  selector: 'app-delete-new-cupone',
  templateUrl: './delete-new-cupone.component.html',
  styleUrls: ['./delete-new-cupone.component.scss']
})
export class DeleteNewCuponeComponent implements OnInit {

  @Output() CuponD: EventEmitter<any> = new EventEmitter();
  @Input() cupon_selected:any;

  constructor(
    public _modal: NgbActiveModal,
    public _cuponService: CuponeService,
    public toaster: Toaster,
  ) { }

  ngOnInit(): void {
  }

  delete() {
    this._cuponService.deleteCupone(this.cupon_selected._id).subscribe((resp:any) => {
      this.CuponD.emit('');
      this.toaster.open(NoticyAlertComponent, {text:  `success-El cupon se ha eliminado correctamente.`});
      this._modal.close();
    }, (error) => {
      if (error.error) {
        this.toaster.open(NoticyAlertComponent, {text: `danger-${error.error.message}.`});
      }
    });
  }

}
