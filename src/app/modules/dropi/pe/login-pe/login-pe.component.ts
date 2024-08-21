import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DropiService } from '../../_services/dropi.service';

@Component({
  selector: 'app-login-pe',
  templateUrl: './login-pe.component.html',
  styleUrls: ['./login-pe.component.scss']
})
export class LoginPeComponent implements OnInit {
  validErrorMessageAuthentication:boolean=false;
  validSuccessMessageAuthentication:boolean=false;
  email:string = "";
  password:string = "";
  white_brand_id:string = "1";
  
  constructor(
    public _dropiService: DropiService,
    public _router: Router,
  ) { 
  }

  ngOnInit(): void {}

  login() {
    if (!this.email) {
      alert("Es necesario ingresar el email");
    }

    if (!this.password) {
      alert("Es necesario ingresar el password");
    }

    this._dropiService.login_dropi(this.email, this.password, this.white_brand_id, "pe").subscribe((resp: any) => {
      if (resp.success) {
        this.validSuccessMessageAuthentication = true;
        this.validErrorMessageAuthentication = false;
      } else {
        this.validErrorMessageAuthentication = true;
        this.validSuccessMessageAuthentication = false;
      }
    }, (error) => {
      console.error('An error occurred', error);
      alert('Error inesperado. Por favor, inténtelo de nuevo más tarde.');
    });
  }
}
