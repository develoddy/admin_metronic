import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PrintfulRoutingModule } from './printful-routing.module';
import { PrintfulComponent } from './printful.component';
import { ListPrintfulComponent } from './list-printful/list-printful.component';


@NgModule({
  declarations: [PrintfulComponent, ListPrintfulComponent],
  imports: [
    CommonModule,
    PrintfulRoutingModule
  ]
})
export class PrintfulModule { }
