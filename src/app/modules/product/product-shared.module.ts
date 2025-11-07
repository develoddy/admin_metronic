import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListProductsComponent } from './list-products/list-products.component';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule, NgbModalModule, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { CRUDTableModule } from 'src/app/_metronic/shared/crud-table';
import { InlineSVGModule } from 'ng-inline-svg';
import { EditorModule } from '@tinymce/tinymce-angular';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [ListProductsComponent],
  imports: [
    CommonModule,
    RouterModule,
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
  exports: [ListProductsComponent]
})
export class ProductSharedModule { }
