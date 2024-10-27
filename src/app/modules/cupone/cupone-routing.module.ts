import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CuponeComponent } from './cupone.component';
import { AddNewCuponeComponent } from './add-new-cupone/add-new-cupone.component';
import { EditNewCuponeComponent } from './edit-new-cupone/edit-new-cupone.component';
import { ListCuponesComponent } from './list-cupones/list-cupones.component';

const routes: Routes = [{
  path: '',
  component: CuponeComponent,
  children: [
    {
      path: 'register-cupon',
      component: AddNewCuponeComponent,
    }, 
    {
      path: 'edit-cupon/:id',
      component: EditNewCuponeComponent,
    }, 
    {
      path: 'list-cupones',
      component: ListCuponesComponent,
    }, 
  ]
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CuponeRoutingModule { }
