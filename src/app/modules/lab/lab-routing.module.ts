import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LabComponent } from './lab.component';
import { EmailTestingSaasComponent } from './email-testing-saas/email-testing-saas.component';
import { TenantListComponent } from './tenants/tenant-list/tenant-list.component';
import { TenantDetailComponent } from './tenants/tenant-detail/tenant-detail.component';
import { SaasDashboardComponent } from './dashboard/saas-dashboard.component';
import { TrackingEventsComponent } from './tracking-events/tracking-events.component';
import { MvpAnalyticsComponent } from './mvp-analytics/mvp-analytics.component';
import { MvpDecisionEngineComponent } from './mvp-decision-engine/mvp-decision-engine.component';

const routes: Routes = [
  {
    path: '',
    component: LabComponent,
    children: [
      {
        path: 'dashboard',
        component: SaasDashboardComponent
      },
      {
        path: 'modules',
        loadChildren: () => 
          import('./modules/modules.module').then(m => m.ModulesModule)
      },
      {
        path: 'analytics',
        component: MvpAnalyticsComponent
      },
      {
        path: 'analytics/:moduleKey',
        component: MvpDecisionEngineComponent
      },
      {
        path: 'tracking',
        component: TrackingEventsComponent
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
export class LabRoutingModule { }
