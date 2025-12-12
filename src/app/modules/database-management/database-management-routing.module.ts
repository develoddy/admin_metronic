import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DatabaseManagementDashboardComponent } from './components/database-management-dashboard.component';

const routes: Routes = [
  {
    path: '',
    component: DatabaseManagementDashboardComponent,
    data: {
      title: 'Gestión de Base de Datos',
      breadcrumb: 'Database Management',
      requireSuperAdmin: true // Indicador para el guard de rutas
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DatabaseManagementRoutingModule { }