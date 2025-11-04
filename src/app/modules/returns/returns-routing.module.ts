import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReturnsListComponent } from './components/returns-list/returns-list.component';
import { ReturnsDetailComponent } from './components/returns-detail/returns-detail.component';

const routes: Routes = [
  { path: 'list', component: ReturnsListComponent },
  { path: 'detail/:id', component: ReturnsDetailComponent },
  { path: '', redirectTo: 'list', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReturnsRoutingModule { }
