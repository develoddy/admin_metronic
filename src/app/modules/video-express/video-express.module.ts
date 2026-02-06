import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { VideoExpressRoutingModule } from './video-express-routing.module';

// Components
import { VideoExpressDashboardComponent } from './dashboard/video-express-dashboard.component';
import { JobCreatorComponent } from './job-creator/job-creator.component';
import { JobsListComponent } from './jobs-list/jobs-list.component';

// Services
import { VideoExpressService } from './_services/video-express.service';

/**
 * Módulo Product Video Express - MVP Micro-SaaS
 * Genera videos cinematográficos de productos con IA
 */
@NgModule({
  declarations: [
    VideoExpressDashboardComponent,
    JobCreatorComponent,
    JobsListComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    VideoExpressRoutingModule  // Debe ir último
  ],
  providers: [
    VideoExpressService
  ]
})
export class VideoExpressModule { }
