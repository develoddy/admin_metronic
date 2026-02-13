import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { LabRoutingModule } from './lab-routing.module';
import { LabComponent } from './lab.component';
import { EmailTestingSaasComponent } from './email-testing-saas/email-testing-saas.component';
import { TenantListComponent } from './tenants/tenant-list/tenant-list.component';
import { TenantDetailComponent } from './tenants/tenant-detail/tenant-detail.component';
import { SaasDashboardComponent } from './dashboard/saas-dashboard.component';
import { TrackingEventsComponent } from './tracking-events/tracking-events.component';
import { MvpAnalyticsComponent } from './mvp-analytics/mvp-analytics.component';
import { MvpDecisionEngineComponent } from './mvp-decision-engine/mvp-decision-engine.component';
import { SaasEmailTestingService } from './_services/saas-email-testing.service';
import { SaasTenantsService } from './_services/saas-tenants.service';
import { SaasTrackingEventsService } from './_services/saas-tracking-events.service';
import { MicroSaasAnalyticsService } from './_services/micro-saas-analytics.service';

@NgModule({
  declarations: [
    LabComponent,
    EmailTestingSaasComponent,
    TenantListComponent,
    TenantDetailComponent,
    SaasDashboardComponent,
    TrackingEventsComponent,
    MvpAnalyticsComponent,
    MvpDecisionEngineComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    LabRoutingModule  // Debe ir último
  ],
  providers: [
    SaasEmailTestingService,
    SaasTenantsService,
    SaasTrackingEventsService,
    MicroSaasAnalyticsService
    // ModuleCreationService eliminado - concepto unificado Module = MVP
  ]
})
export class LabModule { }
