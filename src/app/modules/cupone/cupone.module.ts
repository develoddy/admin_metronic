import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CuponeRoutingModule } from './cupone-routing.module';
import { CuponeComponent } from './cupone.component';
import { AddNewCuponeComponent } from './add-new-cupone/add-new-cupone.component';
import { EditNewCuponeComponent } from './edit-new-cupone/edit-new-cupone.component';
import { DeleteNewCuponeComponent } from './delete-new-cupone/delete-new-cupone.component';
import { ListCuponesComponent } from './list-cupones/list-cupones.component';

import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule, NgbModalModule, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { CRUDTableModule } from 'src/app/_metronic/shared/crud-table';
import { InlineSVGModule } from 'ng-inline-svg';


@NgModule({
  declarations: [CuponeComponent, AddNewCuponeComponent, EditNewCuponeComponent, DeleteNewCuponeComponent, ListCuponesComponent],
  imports: [
    CommonModule,
    CuponeRoutingModule,
    //
    HttpClientModule,
    FormsModule,
    NgbModule,
    ReactiveFormsModule,
    InlineSVGModule,
    CRUDTableModule,
    NgbModalModule,
    NgbDatepickerModule,
  ]
})
export class CuponeModule { }
