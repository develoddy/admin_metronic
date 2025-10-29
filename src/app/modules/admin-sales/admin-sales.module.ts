import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
//import { AdminSalesRoutingModule } from './admin-sales-routing.module';
import { SalesListComponent } from './sales-list/sales-list.component';
import { SaleDetailComponent } from './sale-detail/sale-detail.component';
import { AdminOrderFormComponent } from './admin-order-form/admin-order-form.component';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InlineSVGModule } from 'ng-inline-svg';
import { CRUDTableModule } from 'src/app/_metronic/shared/crud-table';
import { AdminSalesRoutingModule } from './admin-sales-routing.module';

@NgModule({
  declarations: [SalesListComponent, SaleDetailComponent, AdminOrderFormComponent],
  imports: [
    CommonModule,
    AdminSalesRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    InlineSVGModule,
    CRUDTableModule
  ],
  exports: [SalesListComponent, SaleDetailComponent, AdminOrderFormComponent]
})
export class AdminSalesModule { }
