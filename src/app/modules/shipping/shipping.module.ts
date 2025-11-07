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
