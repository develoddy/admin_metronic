import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { SaasManagementRoutingModule } from './saas-management-routing.module';
import { SaasManagementComponent } from './saas-management.component';
import { EmailTestingSaasComponent } from './email-testing-saas/email-testing-saas.component';
import { TenantListComponent } from './tenants/tenant-list/tenant-list.component';
import { TenantDetailComponent } from './tenants/tenant-detail/tenant-detail.component';
import { SaasDashboardComponent } from './dashboard/saas-dashboard.component';
import { TrackingEventsComponent } from './tracking-events/tracking-events.component';
import { SaasEmailTestingService } from './_services/saas-email-testing.service';
import { SaasTenantsService } from './_services/saas-tenants.service';
import { SaasTrackingEventsService } from './_services/saas-tracking-events.service';

@NgModule({
  declarations: [
    SaasManagementComponent,
    EmailTestingSaasComponent,
    TenantListComponent,
    TenantDetailComponent,
    SaasDashboardComponent,
    TrackingEventsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    SaasManagementRoutingModule  // Debe ir último
  ],
  providers: [
    SaasEmailTestingService,
    SaasTenantsService,
    SaasTrackingEventsService
  ]
})
export class SaasManagementModule { }
