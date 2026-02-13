import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ModulesService, Module, ModuleStats, ValidationStatus } from 'src/app/services/modules.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-module-detail',
  templateUrl: './module-detail.component.html',
  styleUrls: ['./module-detail.component.scss']
})
export class ModuleDetailComponent implements OnInit {

  module: Module | null = null;
  stats: ModuleStats | null = null;
  validationStatus: ValidationStatus | null = null;
  recentSales: any[] = [];
  
  isLoading = true;
  moduleKey: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public modulesService: ModulesService,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['key']) {
        this.moduleKey = params['key'];
        this.loadModuleDetails();
      }
    });
  }

  /**
   * Cargar detalles completos del módulo
   */
  loadModuleDetails(): void {
    this.isLoading = true;
    
    this.modulesService.getModule(this.moduleKey).subscribe({
      next: (response) => {
        if (response.success && response.module) {
          this.module = response.module;
          this.stats = response.stats || null;
          this.validationStatus = response.validationStatus || null;
          this.recentSales = response.recentSales || [];
          
          console.log('✅ Module details loaded:', this.module);
        }
        this.isLoading = false;
        this.cd.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error loading module:', error);
        Swal.fire({
          title: 'Error',
          text: 'No se pudo cargar el módulo',
          icon: 'error',
          confirmButtonText: 'Volver'
        }).then(() => {
          this.router.navigate(['/lab/modules']);
        });
        this.isLoading = false;
      }
    });
  }

  /**
   * Navegar a editar
   */
  editModule(): void {
    this.router.navigate(['/lab/modules/edit', this.moduleKey]);
  }

  /**
   * Toggle activar/desactivar
   */
  async toggleModule(): Promise<void> {
    if (!this.module) return;

    const action = this.module.is_active ? 'pausar' : 'activar';
    
    this.modulesService.toggleModule(this.moduleKey).subscribe({
      next: (response) => {
        if (response.success) {
          Swal.fire({
            title: '¡Actualizado!',
            text: `Módulo ${action} correctamente`,
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
          this.loadModuleDetails();
        }
      },
      error: (error) => {
        console.error('❌ Error toggle:', error);
        Swal.fire({
          title: 'Error',
          text: `No se pudo ${action} el módulo`,
          icon: 'error'
        });
      }
    });
  }

  /**
   * Archivar módulo
   */
  async archiveModule(): Promise<void> {
    if (!this.module) return;

    const result = await Swal.fire({
      title: '¿Archivar módulo?',
      html: `
        <div class="text-start">
          <p>Estás a punto de archivar <strong>"${this.module.name}"</strong></p>
          <p class="text-muted mt-3"><strong>Progreso actual:</strong></p>
          <ul class="text-muted">
            <li>📊 Ventas: <strong>${this.module.total_sales}/${this.module.validation_target_sales}</strong></li>
            <li>💰 Revenue: <strong>${this.modulesService.formatCurrency(this.module.total_revenue)}</strong></li>
          </ul>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, archivar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#f1c40f',
      cancelButtonColor: '#d33'
    });

    if (!result.isConfirmed) return;

    const reason = `Archivado desde detalle - ${this.module.total_sales}/${this.module.validation_target_sales} ventas`;
    
    this.modulesService.archiveModule(this.moduleKey, reason).subscribe({
      next: (response) => {
        if (response.success) {
          Swal.fire({
            title: '¡Archivado!',
            text: 'Módulo archivado correctamente',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
          this.router.navigate(['/lab/modules']);
        }
      },
      error: (error) => {
        console.error('❌ Error archivando:', error);
        Swal.fire({
          title: 'Error',
          text: 'No se pudo archivar el módulo',
          icon: 'error'
        });
      }
    });
  }

  /**
   * Volver a lista
   */
  goBack(): void {
    this.router.navigate(['/lab/modules']);
  }

  /**
   * Calcular días restantes
   */
  calculateDaysRemaining(): number | null {
    if (!this.module || !this.module.launched_at || this.module.status !== 'testing') {
      return null;
    }
    
    const launchedDate = new Date(this.module.launched_at);
    const now = new Date();
    const daysPassed = Math.floor((now.getTime() - launchedDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = this.module.validation_days - daysPassed;
    
    return Math.max(0, daysRemaining);
  }

  /**
   * Verificar si el módulo está en riesgo
   */
  isModuleAtRisk(): boolean {
    if (!this.module) return false;
    
    const daysRemaining = this.calculateDaysRemaining();
    if (daysRemaining === null) return false;
    
    const progress = (this.module.total_sales / this.module.validation_target_sales) * 100;
    return daysRemaining <= 2 && progress < 50;
  }

  /**
   * Obtener clase de badge de estado
   */
  getStatusBadgeClass(): string {
    if (!this.module) return '';
    return this.modulesService.getStatusBadgeClass(this.module.status);
  }
}
