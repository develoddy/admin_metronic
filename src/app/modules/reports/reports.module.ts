import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReportsRoutingModule } from './reports-routing.module';
import { ReportsSharedModule } from './reports-shared.module';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    ReportsRoutingModule,
    ReportsSharedModule
  ]
})
export class ReportsModule { }
