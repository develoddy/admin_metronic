import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SalesListComponent } from './sales-list/sales-list.component';
import { SaleDetailComponent } from './sale-detail/sale-detail.component';

const routes: Routes = [
  { path: 'list', component: SalesListComponent },
  { path: 'detail/:id', component: SaleDetailComponent },
  { path: '', redirectTo: 'list', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminSalesRoutingModule { }
