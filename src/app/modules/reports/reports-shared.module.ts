import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SalesReportComponent } from './sales-report/sales-report.component';
import { ReturnsReportComponent } from './returns-report/returns-report.component';
import { ShippingReportComponent } from './shipping-report/shipping-report.component';
import { CustomerOrdersReportComponent } from './customer-orders-report/customer-orders-report.component';

@NgModule({
  declarations: [
    SalesReportComponent,
    ReturnsReportComponent,
    ShippingReportComponent,
    CustomerOrdersReportComponent
  ],
  imports: [
    CommonModule,
  ],
  exports: [
    SalesReportComponent,
    ReturnsReportComponent,
    ShippingReportComponent,
    CustomerOrdersReportComponent
  ]
})
export class ReportsSharedModule { }
