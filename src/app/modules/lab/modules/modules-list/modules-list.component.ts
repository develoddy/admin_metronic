import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Toaster } from 'ngx-toast-notifications';
import { ModulesService, Module } from 'src/app/services/modules.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-modules-list',
  templateUrl: './modules-list.component.html',
  styleUrls: ['./modules-list.component.scss']
})
export class ModulesListComponent implements OnInit {

  modules: Module[] = [];
  isLoading = false;
  
  // Filtros
  statusFilter: string = 'all';
  searchTerm: string = '';

  constructor(
    public modulesService: ModulesService,
    private router: Router,
    private route: ActivatedRoute,
    private toaster: Toaster,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadModules();
  }

  /**
   * Cargar módulos
   */
  loadModules(): void {
    this.isLoading = true;
    
    this.modulesService.listModules().subscribe({
      next: (response) => {
        if (response.success) {
          this.modules = response.modules || [];
        }
        this.isLoading = false;
        this.cd.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error cargando módulos:', error);
        this.toaster.open({
          text: 'Error al cargar módulos',
          caption: '❌ Error',
          type: 'danger',
          duration: 3000
        });
        this.isLoading = false;
        this.cd.detectChanges();
      }
    });
  }

  /**
   * Filtrar módulos
   */
  get filteredModules(): Module[] {
    let filtered = this.modules;

    // Filtro por status
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(m => m.status === this.statusFilter);
    }

    // Filtro por búsqueda
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(m => 
        m.name.toLowerCase().includes(term) ||
        m.description.toLowerCase().includes(term) ||
        m.key.toLowerCase().includes(term)
      );
    }

    return filtered;
  }

  /**
   * Navegar a crear módulo
   */
  createModule(): void {
    this.router.navigate(['create'], { relativeTo: this.route });
  }

  /**
   * Navegar a editar módulo
   */
  editModule(module: Module): void {
    this.router.navigate(['edit', module.key], { relativeTo: this.route });
  }

  /**
   * Ver detalles del módulo
   */
  viewModule(module: Module): void {
    this.router.navigate(['detail', module.key], { relativeTo: this.route });
  }

  /**
   * Toggle activar/desactivar módulo
   */
  toggleModule(module: Module, event: Event): void {
    event.stopPropagation();
    
    const action = module.is_active ? 'desactivar' : 'activar';
    
    // Toggle directo con feedback inmediato
    this.modulesService.toggleModule(module.key).subscribe({
      next: (response) => {
        if (response.success) {
          const statusMsg = module.is_active 
            ? 'pausado y dejará de contar para validación' 
            : 'activado y comenzará a validarse';
          
          this.toaster.open({
            text: `"${module.name}" ${statusMsg}`,
            caption: module.is_active ? '⏸️ Pausado' : '▶️ Activado',
            type: 'success',
            duration: 3000
          });
          this.loadModules();
        }
      },
      error: (error) => {
        console.error('❌ Error toggle módulo:', error);
        this.toaster.open({
          text: `Error al ${action} el módulo`,
          caption: '❌ Error',
          type: 'danger',
          duration: 3000
        });
      }
    });
  }

  /**
   * Archivar módulo
   */
  async archiveModule(module: Module, event: Event): Promise<void> {
    event.stopPropagation();
    
    // Modal de confirmación con SweetAlert2
    const result = await Swal.fire({
      title: '¿Archivar módulo?',
      html: `
        <div class="text-start">
          <p>Estás a punto de archivar <strong>"${module.name}"</strong></p>
          <p class="text-muted mt-3"><strong>Progreso actual:</strong></p>
          <ul class="text-muted">
            <li>📊 Ventas: <strong>${module.total_sales}/${module.validation_target_sales}</strong></li>
            <li>💰 Revenue: <strong>${this.modulesService.formatCurrency(module.total_revenue)}</strong></li>
            <li>⏱️ Estado: <strong>${module.status}</strong></li>
          </ul>
          <p class="text-muted mt-3">
            <em>El módulo se marcará como archivado pero permanecerá en la base de datos para referencia futura.</em>
          </p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, archivar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#f1c40f',
      cancelButtonColor: '#d33',
      width: '500px'
    });

    if (!result.isConfirmed) {
      return;
    }
    
    // Motivo auto-generado con contexto
    const reason = `Archivado desde gestión - ${module.total_sales}/${module.validation_target_sales} ventas alcanzadas`;
    
    this.modulesService.archiveModule(module.key, reason).subscribe({
      next: (response) => {
        if (response.success) {
          Swal.fire({
            title: '¡Archivado!',
            text: `"${module.name}" archivado correctamente`,
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
          this.loadModules();
        }
      },
      error: (error) => {
        console.error('❌ Error archivando módulo:', error);
        Swal.fire({
          title: 'Error',
          text: 'No se pudo archivar el módulo',
          icon: 'error',
          confirmButtonText: 'Entendido'
        });
      }
    });
  }

  /**
   * Calcular días restantes
   */
  calculateDaysRemaining(module: Module): number | null {
    if (!module.launched_at || module.status !== 'testing') {
      return null;
    }
    
    const launchedDate = new Date(module.launched_at);
    const now = new Date();
    const daysPassed = Math.floor((now.getTime() - launchedDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = module.validation_days - daysPassed;
    
    return Math.max(0, daysRemaining);
  }

  /**
   * Verificar si módulo está en riesgo
   */
  isModuleAtRisk(module: Module): boolean {
    const daysRemaining = this.calculateDaysRemaining(module);
    if (daysRemaining === null) return false;
    
    const progress = (module.total_sales / module.validation_target_sales) * 100;
    return daysRemaining <= 2 && progress < 50;
  }
}
