import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VideoExpressDashboardComponent } from './dashboard/video-express-dashboard.component';
import { JobCreatorComponent } from './job-creator/job-creator.component';
import { JobsListComponent } from './jobs-list/jobs-list.component';

/**
 * Rutas del módulo Video Express
 */
const routes: Routes = [
  {
    path: '',
    component: VideoExpressDashboardComponent
  },
  {
    path: 'create',
    component: JobCreatorComponent
  },
  {
    path: 'jobs',
    component: JobsListComponent
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class VideoExpressRoutingModule { }
