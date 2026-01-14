import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SaasManagementComponent } from './saas-management.component';
import { EmailTestingSaasComponent } from './email-testing-saas/email-testing-saas.component';

const routes: Routes = [
  {
    path: '',
    component: SaasManagementComponent,
    children: [
      {
        path: 'email-testing',
        component: EmailTestingSaasComponent
      },
      {
        path: '',
        redirectTo: 'email-testing',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SaasManagementRoutingModule { }
