import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InlineSVGModule } from 'ng-inline-svg';
import { CRUDTableModule } from 'src/app/_metronic/shared/crud-table';

import { InboxRoutingModule } from './inbox-routing.module';
import { InboxComponent } from './inbox.component';
import { InboxSharedModule } from './inbox-shared.module';


@NgModule({
  declarations: [
    InboxComponent,
  ],
  imports: [
    CommonModule,
    InboxRoutingModule,
    InboxSharedModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    InlineSVGModule,
    CRUDTableModule
  ]
})
export class InboxModule { }
