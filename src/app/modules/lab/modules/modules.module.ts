import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ModulesRoutingModule } from './modules-routing.module';
import { ModulesListComponent } from './modules-list/modules-list.component';
import { ModuleFormComponent } from './module-form/module-form.component';
import { ModuleDetailComponent } from './module-detail/module-detail.component';


@NgModule({
  declarations: [
    ModulesListComponent,
    ModuleFormComponent,
    ModuleDetailComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ModulesRoutingModule
  ]
})
export class ModulesModule { }
