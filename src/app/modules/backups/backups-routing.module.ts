import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BackupsDashboardComponent } from './components/backups-dashboard.component';

const routes: Routes = [
  {
    path: '',
    component: BackupsDashboardComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BackupsRoutingModule { }