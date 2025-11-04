import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { GuestsListComponent } from './guests-list/guests-list.component';
import { GuestsComponent } from './guests.component';

const routes: Routes = [
  {
    path: '',
    component: GuestsComponent,
    children: [
      {
        path: 'list',
        component: GuestsListComponent,
      },
      { path: '', redirectTo: 'list', pathMatch: 'full' },
      { path: '**', redirectTo: 'list', pathMatch: 'full' },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GuestsRoutingModule { }
