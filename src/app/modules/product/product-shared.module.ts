import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductComponent } from './product.component';
import { AddNewProductComponent } from './add-new-product/add-new-product.component';
import { EditNewProductComponent } from './edit-new-product/edit-new-product.component';
import { DeleteNewProductComponent } from './delete-new-product/delete-new-product.component';
import { ListProductsComponent } from './list-products/list-products.component';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule, NgbModalModule, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { CRUDTableModule } from 'src/app/_metronic/shared/crud-table';
import { InlineSVGModule } from 'ng-inline-svg';
import { EditorModule } from '@tinymce/tinymce-angular';
import { EditNewVariedadComponent } from './variedades/edit-new-variedad/edit-new-variedad.component';
import { DeleteNewVariedadComponent } from './variedades/delete-new-variedad/delete-new-variedad.component';
import { DeleteGaleriaImagenComponent } from './delete-galeria-imagen/delete-galeria-imagen.component';
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
