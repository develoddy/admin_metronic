import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DropiComponent } from "./dropi.component";
import { LoginPeComponent } from "./pe/login-pe/login-pe.component";
import { LoginEsComponent } from './es/login-es/login-es.component';

const routes: Routes = [
  {
    path: '',
    component: DropiComponent,
    children: [
      {
        path: 'login-pe',
        component: LoginPeComponent,
      },
      {
        path: 'login-es',
        component: LoginEsComponent,
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DropilRoutingModule { }
