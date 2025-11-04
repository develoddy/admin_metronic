import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { UsersService } from '../../_services/users.service';
import { Toaster } from 'ngx-toast-notifications';
import { NoticyAlertComponent } from 'src/app/componets/notifications/noticy-alert/noticy-alert.component';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-edit-users',
  templateUrl: './edit-users.component.html',
  styleUrls: ['./edit-users.component.scss']
})
export class EditUsersComponent implements OnInit {
  @Input() user_selected: any;

  @Output() UserE: EventEmitter<any> = new EventEmitter();
  name:any = null;
  surname:any = null;
  email:any = null;
  password:any = null;
  repeat_password = null;

  constructor(
    public _modal: NgbActiveModal,
    public _userService: UsersService,
    public toaster: Toaster,
  ) { }

  ngOnInit(): void {
    this.name = this.user_selected.name;
    this.surname = this.user_selected.surname;
    this.email = this.user_selected.email;
  }

  save() {

    if ( !this.name || !this.surname || !this.email) {
      this.toaster.open(NoticyAlertComponent, {text: `danger-Ups! Necesita ingresar todos los campos.`});
      return;
    }

    // if ( this.password != this.repeat_password) {
    //   this.toaster.open(NoticyAlertComponent, {text: `danger-Ups! Necesita ingresar contraseñas iguales.`});
    //   return;
    // }

    let data = {
      _id: this.user_selected._id,
      name: this.name,
      surname: this.surname,
      email: this.email, 
      password: this.password,
      repat_password: this.repeat_password,
    }
    this._userService.updateUser(data).subscribe((resp:any) => {
      this.UserE.emit(resp.user);
      this.toaster.open(NoticyAlertComponent, {text:  `success-El usuario se ha modificado correctamente.`});
      this._modal.close();
    }, (error) => {
      if (error.error) {
        this.toaster.open(NoticyAlertComponent, {text: `danger-${error.error.message}.`});
      }
    });
  }
}
