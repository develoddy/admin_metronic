import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PrintfulComponent } from './printful.component';
import { ListPrintfulComponent } from './list-printful/list-printful.component';
import { ProductsPrintfulComponent } from './products-printful/products-printful.component';
import { DashboardPrintfulComponent } from './dashboard-printful/dashboard-printful.component';

const routes: Routes = [
  {
    path: '',
    component: PrintfulComponent,
    children: [
      {
        path: 'dashboard',
        component: DashboardPrintfulComponent,
      },
      {
        path: 'list',
        component: ListPrintfulComponent,
      },
      {
        path: 'products',
        component: ProductsPrintfulComponent,
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PrintfulRoutingModule { }
