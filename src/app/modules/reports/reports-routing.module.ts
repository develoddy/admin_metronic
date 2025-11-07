import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SalesReportComponent } from './sales-report/sales-report.component';
import { ReturnsReportComponent } from './returns-report/returns-report.component';
import { ShippingReportComponent } from './shipping-report/shipping-report.component';
import { CustomerOrdersReportComponent } from './customer-orders-report/customer-orders-report.component';

const routes: Routes = [
  {
    path: '',
    children: [
      { path: 'sales', component: SalesReportComponent },
      { path: 'returns', component: ReturnsReportComponent },
      { path: 'shipping', component: ShippingReportComponent },
      { path: 'customer-orders', component: CustomerOrdersReportComponent },
      { path: '', redirectTo: 'sales', pathMatch: 'full' }, // por defecto abre ventas
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportsRoutingModule { }
