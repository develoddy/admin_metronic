import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ShippingListComponent } from './components/shipping-list/shipping-list.component';
import { ShippingDetailComponent } from './components/shipping-detail/shipping-detail.component';

const routes: Routes = [
  { path: 'list', component: ShippingListComponent },
  { path: ':id',component: ShippingDetailComponent },
  { path: '', redirectTo: 'list', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ShippingRoutingModule { }
