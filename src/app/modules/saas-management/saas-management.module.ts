import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { SaasManagementRoutingModule } from './saas-management-routing.module';
import { SaasManagementComponent } from './saas-management.component';
import { EmailTestingSaasComponent } from './email-testing-saas/email-testing-saas.component';
import { SaasEmailTestingService } from './_services/saas-email-testing.service';

@NgModule({
  declarations: [
    SaasManagementComponent,
    EmailTestingSaasComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    SaasManagementRoutingModule  // Debe ir último
  ],
  providers: [
    SaasEmailTestingService
  ]
})
export class SaasManagementModule { }
