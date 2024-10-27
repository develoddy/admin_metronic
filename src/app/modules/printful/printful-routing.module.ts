import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PrintfulComponent } from './printful.component';
import { ListPrintfulComponent } from './list-printful/list-printful.component';

const routes: Routes = [
  {
    path: '',
    component: PrintfulComponent,
    children: [
      {
        path: 'list',
        component: ListPrintfulComponent,
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PrintfulRoutingModule { }
