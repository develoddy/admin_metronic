import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReceiptsListComponent } from './components/receipts/receipts-list/receipts-list.component';
import { ReceiptsCreateComponent } from './components/receipts/receipts-create/receipts-create.component';
import { ReceiptsViewComponent } from './components/receipts/receipts-view/receipts-view.component';
import { InvoicesListComponent } from './components/invoices/invoices-list/invoices-list.component';
import { InvoicesCreateComponent } from './components/invoices/invoices-create/invoices-create.component';
import { InvoicesViewComponent } from './components/invoices/invoices-view/invoices-view.component';

const routes: Routes = [
  {
    path: 'receipts',
    children: [
      { path: 'list', component: ReceiptsListComponent },
      { path: 'create', component: ReceiptsCreateComponent },
      { path: 'view/:id', component: ReceiptsViewComponent },
      { path: '', redirectTo: 'list', pathMatch: 'full' }
    ]
  },
  {
    path: 'invoices',
    children: [
      { path: 'list', component: InvoicesListComponent },
      { path: 'create', component: InvoicesCreateComponent },
      { path: 'view/:id', component: InvoicesViewComponent },
      { path: '', redirectTo: 'list', pathMatch: 'full' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DocumentsManagerRoutingModule { }
