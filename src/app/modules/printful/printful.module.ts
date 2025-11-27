import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { PrintfulRoutingModule } from './printful-routing.module';
import { PrintfulComponent } from './printful.component';
import { ListPrintfulComponent } from './list-printful/list-printful.component';
import { ProductsPrintfulComponent } from './products-printful/products-printful.component';

// Importar servicios
import { ProductService } from '../product/_services/product.service';
import { PrintfulService } from './_services/printful.service';


@NgModule({
  declarations: [
    PrintfulComponent, 
    ListPrintfulComponent,
    ProductsPrintfulComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PrintfulRoutingModule
  ],
  providers: [
    ProductService,
    PrintfulService
  ]
})
export class PrintfulModule { }
