import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

// Routing
import { BackupsRoutingModule } from './backups-routing.module';

// Components
import { BackupsDashboardComponent } from './components/backups-dashboard.component';

// Services
import { BackupsService } from './services/backups.service';

// Metronic modules
import { InlineSVGModule } from 'ng-inline-svg';

@NgModule({
  declarations: [
    BackupsDashboardComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    BackupsRoutingModule,
    InlineSVGModule
  ],
  providers: [
    BackupsService
  ]
})
export class BackupsModule { }