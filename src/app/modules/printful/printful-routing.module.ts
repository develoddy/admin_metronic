import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PrintfulComponent } from './printful.component';
import { ListPrintfulComponent } from './list-printful/list-printful.component';
import { ProductsPrintfulComponent } from './products-printful/products-printful.component';
import { DashboardPrintfulComponent } from './dashboard-printful/dashboard-printful.component';
import { OrdersPrintfulComponent } from './orders-printful/orders-printful.component';
import { OrderDetailPrintfulComponent } from './order-detail-printful/order-detail-printful.component';
import { ShippingCalculatorPrintfulComponent } from './shipping-calculator-printful/shipping-calculator-printful.component';

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
      },
      {
        path: 'orders',
        component: OrdersPrintfulComponent,
      },
      {
        path: 'orders/:id',
        component: OrderDetailPrintfulComponent,
      },
      {
        path: 'shipping-calculator',
        component: ShippingCalculatorPrintfulComponent,
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PrintfulRoutingModule { }
