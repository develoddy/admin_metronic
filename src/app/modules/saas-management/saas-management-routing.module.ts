import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SaasManagementComponent } from './saas-management.component';
import { EmailTestingSaasComponent } from './email-testing-saas/email-testing-saas.component';
import { TenantListComponent } from './tenants/tenant-list/tenant-list.component';
import { TenantDetailComponent } from './tenants/tenant-detail/tenant-detail.component';
import { SaasDashboardComponent } from './dashboard/saas-dashboard.component';

const routes: Routes = [
  {
    path: '',
    component: SaasManagementComponent,
    children: [
      {
        path: 'dashboard',
        component: SaasDashboardComponent
      },
      {
        path: 'tenants',
        component: TenantListComponent
      },
      {
        path: 'tenants/:id',
        component: TenantDetailComponent
      },
      {
        path: 'email-testing',
        component: EmailTestingSaasComponent
      },
      {
        path: '',
        redirectTo: 'dashboard',
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
