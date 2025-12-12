import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Módulo de rutas
import { DatabaseManagementRoutingModule } from './database-management-routing.module';

// Componentes
import { DatabaseManagementDashboardComponent } from './components/database-management-dashboard.component';

// Servicios (se proveen en root, no necesitan declaración aquí)
// import { DatabaseManagementService } from './services/database-management.service';

@NgModule({
  declarations: [
    DatabaseManagementDashboardComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DatabaseManagementRoutingModule
  ],
  providers: [
    // Los servicios ya están marcados como providedIn: 'root'
    // DatabaseManagementService se inyecta automáticamente
  ]
})
export class DatabaseManagementModule { }