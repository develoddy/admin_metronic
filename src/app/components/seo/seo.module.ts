import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SeoRoutingModule } from './seo-routing.module';

// Components
import { SeoConfigComponent } from './config/seo-config.component';
import { SitemapManagerComponent } from './sitemap/sitemap-manager.component';
import { RobotsManagerComponent } from './robots/robots-manager.component';

// Service
import { SeoService } from '../../services/seo.service';

@NgModule({
  declarations: [
    SeoConfigComponent,
    SitemapManagerComponent,
    RobotsManagerComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    SeoRoutingModule
  ],
  providers: [
    SeoService
  ]
})
export class SeoModule { }
