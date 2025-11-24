import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InlineSVGModule } from 'ng-inline-svg';
import { CRUDTableModule } from 'src/app/_metronic/shared/crud-table';
import { NewsletterCampaignsRoutingModule } from './newsletter-campaigns-routing.module';

// Components
import { DashboardComponent } from './dashboard/dashboard.component';
import { SubscribersListComponent } from './subscribers-list/subscribers-list.component';
import { CampaignCreateComponent } from './campaign-create/campaign-create.component';
import { CampaignPreviewComponent } from './campaign-preview/campaign-preview.component';

// Services
import { NewsletterCampaignsService } from './services/newsletter-campaigns.service';

@NgModule({
  declarations: [
    DashboardComponent,
    SubscribersListComponent,
    CampaignCreateComponent,
    CampaignPreviewComponent
  ],
  imports: [
    CommonModule,
    NewsletterCampaignsRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    InlineSVGModule,
    CRUDTableModule
  ],
  providers: [NewsletterCampaignsService]
})
export class NewsletterCampaignsModule { }
