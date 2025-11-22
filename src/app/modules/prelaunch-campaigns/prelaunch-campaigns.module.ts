import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InlineSVGModule } from 'ng-inline-svg';
import { CRUDTableModule } from 'src/app/_metronic/shared/crud-table';
import { PrelaunchCampaignsRoutingModule } from './prelaunch-campaigns-routing.module';

// Components
import { DashboardComponent } from './dashboard/dashboard.component';
import { SubscribersListComponent } from './subscribers-list/subscribers-list.component';
import { LaunchCampaignComponent } from './launch-campaign/launch-campaign.component';
import { CampaignStatsComponent } from './campaign-stats/campaign-stats.component';

// Services
import { PrelaunchCampaignsService } from './services/prelaunch-campaigns.service';

@NgModule({
  declarations: [
    DashboardComponent,
    SubscribersListComponent,
    LaunchCampaignComponent,
    CampaignStatsComponent
  ],
  imports: [
    CommonModule,
    PrelaunchCampaignsRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    InlineSVGModule,
    CRUDTableModule
  ],
  providers: [PrelaunchCampaignsService]
})
export class PrelaunchCampaignsModule { }
