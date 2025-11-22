import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { SubscribersListComponent } from './subscribers-list/subscribers-list.component';
import { LaunchCampaignComponent } from './launch-campaign/launch-campaign.component';
import { CampaignStatsComponent } from './campaign-stats/campaign-stats.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    component: DashboardComponent
  },
  {
    path: 'subscribers',
    component: SubscribersListComponent
  },
  {
    path: 'launch',
    component: LaunchCampaignComponent
  },
  {
    path: 'stats',
    component: CampaignStatsComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PrelaunchCampaignsRoutingModule { }
