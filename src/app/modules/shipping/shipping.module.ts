/**
 * ⚠️ DEPRECATED: Este módulo está obsoleto y fue removido del routing principal.
 * 
 * Motivo: 
 * - La tabla Shipments es redundante con los campos de tracking en Sales
 * - Printful webhooks actualizan directamente Sales.trackingNumber, Sales.carrier, Sales.shippedAt
 * - Este módulo no aporta funcionalidad única
 * 
 * Reemplazo: Use el módulo Admin-Sales
 * - Ruta: /admin-sales
 * - Componente: sale-detail muestra tracking info desde Sales table
 * - Servicio: AdminSalesService.refreshPrintfulStatus() sincroniza datos
 * 
 * @deprecated Use Admin-Sales module. Route /shipping has been removed from pages-routing.module.ts
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule, NgbModalModule, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { CRUDTableModule } from 'src/app/_metronic/shared/crud-table';
import { InlineSVGModule } from 'ng-inline-svg';
import { EditorModule } from '@tinymce/tinymce-angular';

import { ShippingRoutingModule } from './shipping-routing.module';
import { ShippingSharedModule } from './shipping-shared.module';
import { ShippingListComponent } from './components/shipping-list/shipping-list.component';
import { ShippingDetailComponent } from './components/shipping-detail/shipping-detail.component';
import { ShippingTrackingComponent } from './components/shipping-tracking/shipping-tracking.component';


@NgModule({
  declarations: [
    ShippingListComponent,
    ShippingDetailComponent,
    ShippingTrackingComponent
  ],
  imports: [
    CommonModule,
    ShippingRoutingModule,
    //ShippingSharedModule,
    //
    HttpClientModule,
    FormsModule,
    NgbModule,
    ReactiveFormsModule,
    InlineSVGModule,
    CRUDTableModule,
    NgbModalModule,
    NgbDatepickerModule,
    EditorModule
  ],
  exports: [
    ShippingListComponent,
    ShippingDetailComponent,
    ShippingTrackingComponent
  ]
})
export class ShippingModule { }
