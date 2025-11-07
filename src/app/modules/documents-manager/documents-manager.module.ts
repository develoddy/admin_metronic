import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { InlineSVGModule } from 'ng-inline-svg';
import { NgbModule, NgbDatepickerModule, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';

import { DocumentsManagerRoutingModule } from './documents-manager-routing.module';
import { ReceiptsListComponent } from './components/receipts/receipts-list/receipts-list.component';
import { ReceiptsCreateComponent } from './components/receipts/receipts-create/receipts-create.component';
import { ReceiptsViewComponent } from './components/receipts/receipts-view/receipts-view.component';
import { InvoicesListComponent } from './components/invoices/invoices-list/invoices-list.component';
import { InvoicesCreateComponent } from './components/invoices/invoices-create/invoices-create.component';
import { InvoicesViewComponent } from './components/invoices/invoices-view/invoices-view.component';


@NgModule({
  declarations: [
    // Receipts
    ReceiptsListComponent,
    ReceiptsCreateComponent,
    ReceiptsViewComponent,
    // Invoices
    InvoicesListComponent,
    InvoicesCreateComponent,
    InvoicesViewComponent
  ],
  imports: [
    CommonModule,
    DocumentsManagerRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule,
    InlineSVGModule,
    NgbModule,
    NgbDatepickerModule,
    NgbModalModule,
    DocumentsManagerRoutingModule,
  ],
  exports: [
    // opcional, si quieres reutilizar alguno
    ReceiptsListComponent,
    InvoicesListComponent,
  ]
})
export class DocumentsManagerModule { }
