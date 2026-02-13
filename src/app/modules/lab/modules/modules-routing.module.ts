import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ModulesListComponent } from './modules-list/modules-list.component';
import { ModuleFormComponent } from './module-form/module-form.component';
import { ModuleDetailComponent } from './module-detail/module-detail.component';

const routes: Routes = [
  {
    path: '',
    component: ModulesListComponent
  },
  {
    path: 'create',
    component: ModuleFormComponent
  },
  {
    path: 'edit/:key',
    component: ModuleFormComponent
  },
  {
    path: 'detail/:key',
    component: ModuleDetailComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ModulesRoutingModule { }
