import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DropiComponent } from './dropi.component';
import { DropilRoutingModule } from "./dropi-routing.module";
import { LoginPeComponent } from './pe/login-pe/login-pe.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { LoginEsComponent } from './es/login-es/login-es.component';

@NgModule({
  declarations: [DropiComponent, LoginPeComponent, LoginEsComponent],
  imports: [
    CommonModule,
    DropilRoutingModule,
    //
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule
  ],
})
export class DropiModule { }
