import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgApexchartsModule } from 'ng-apexcharts';

import { PrintfulRoutingModule } from './printful-routing.module';
import { PrintfulComponent } from './printful.component';
import { ListPrintfulComponent } from './list-printful/list-printful.component';
import { ProductsPrintfulComponent } from './products-printful/products-printful.component';
import { DashboardPrintfulComponent } from './dashboard-printful/dashboard-printful.component';
import { OrdersPrintfulComponent } from './orders-printful/orders-printful.component';
import { OrderDetailPrintfulComponent } from './order-detail-printful/order-detail-printful.component';
import { ShippingCalculatorPrintfulComponent } from './shipping-calculator-printful/shipping-calculator-printful.component';
import { StockAlertsPrintfulComponent } from './stock-alerts-printful/stock-alerts-printful.component';
import { WebhookLogsPrintfulComponent } from './webhook-logs-printful/webhook-logs-printful.component';

// Importar servicios
import { ProductService } from '../product/_services/product.service';
import { PrintfulService } from './_services/printful.service';
import { OrderPrintfulService } from './_services/order-printful.service';
import { AnalyticsPrintfulService } from './_services/analytics-printful.service';
import { ShippingPrintfulService } from './_services/shipping-printful.service';
import { StockSyncPrintfulService } from './_services/stock-sync-printful.service';
import { WebhookPrintfulService } from './webhook-printful.service';


@NgModule({
  declarations: [
    PrintfulComponent, 
    ListPrintfulComponent,
    ProductsPrintfulComponent,
    DashboardPrintfulComponent,
    OrdersPrintfulComponent,
    OrderDetailPrintfulComponent,
    ShippingCalculatorPrintfulComponent,
    StockAlertsPrintfulComponent,
    WebhookLogsPrintfulComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NgApexchartsModule,
    PrintfulRoutingModule
  ],
  providers: [
    ProductService,
    PrintfulService,
    OrderPrintfulService,
    AnalyticsPrintfulService,
    ShippingPrintfulService,
    StockSyncPrintfulService,
    WebhookPrintfulService
  ]
})
export class PrintfulModule { }
