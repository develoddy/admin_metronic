import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DiscountComponent } from './discount.component';
import { ListDiscountComponent } from './list-discount/list-discount.component';
import { AddNewDiscountComponent } from './add-new-discount/add-new-discount.component';
import { EditNewDiscountComponent } from './edit-new-discount/edit-new-discount.component';
import { DeleteNewDiscountComponent } from './delete-new-discount/delete-new-discount.component';

const routes: Routes = [
  {
    path: '',
    component: DiscountComponent,
    children: [
      {
        path: 'register-discount',
        component: AddNewDiscountComponent,
      },
      {
        path: 'edit-discount/:id',
        component: EditNewDiscountComponent,
      },
      {
        path: 'delete-discount/:id',
        component: DeleteNewDiscountComponent,
      },
      {
        path: 'list-discounts',
        component: ListDiscountComponent,
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DiscountRoutingModule { }
