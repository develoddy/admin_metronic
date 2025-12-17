import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SeoConfigComponent } from './config/seo-config.component';
import { SitemapManagerComponent } from './sitemap/sitemap-manager.component';
import { RobotsManagerComponent } from './robots/robots-manager.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'config',
    pathMatch: 'full'
  },
  {
    path: 'config',
    component: SeoConfigComponent,
    data: { title: 'Configuración SEO' }
  },
  {
    path: 'sitemap',
    component: SitemapManagerComponent,
    data: { title: 'Gestión de Sitemap' }
  },
  {
    path: 'robots',
    component: RobotsManagerComponent,
    data: { title: 'Gestión de Robots.txt' }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SeoRoutingModule { }
