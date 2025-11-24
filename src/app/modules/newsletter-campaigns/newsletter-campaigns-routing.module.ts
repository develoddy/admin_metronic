import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { SubscribersListComponent } from './subscribers-list/subscribers-list.component';
import { CampaignCreateComponent } from './campaign-create/campaign-create.component';
import { CampaignPreviewComponent } from './campaign-preview/campaign-preview.component';

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
    path: 'campaign/create',
    component: CampaignCreateComponent
  },
  {
    path: 'campaign/preview',
    component: CampaignPreviewComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class NewsletterCampaignsRoutingModule { }
