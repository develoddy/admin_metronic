import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { PrelaunchCampaignsService, PrelaunchStats, PrelaunchConfig } from '../services/prelaunch-campaigns.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  stats: PrelaunchStats | null = null;
  config: PrelaunchConfig | null = null;
  loading = false;
  configLoading = false;
  error: string | null = null;

  constructor(
    private prelaunchService: PrelaunchCampaignsService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadConfig();
  }

  loadStats(): void {
    this.loading = true;
    this.error = null;

    this.prelaunchService.getStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
        console.log('Stats loaded:', data);
        // Forzar detección de cambios
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error loading stats:', err);
        this.error = 'Error al cargar estadísticas. Por favor, intenta de nuevo.';
        this.loading = false;
        this.cd.detectChanges();
      }
    });
  }

  refresh(): void {
    this.loadStats();
    this.loadConfig();
  }

  /**
   * Cargar configuración actual del pre-launch mode
   */
  loadConfig(): void {
    this.configLoading = true;

    this.prelaunchService.getPrelaunchConfig().subscribe({
      next: (config) => {
        this.config = config;
        this.configLoading = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error loading config:', err);
        this.configLoading = false;
        this.cd.detectChanges();
      }
    });
  }

  /**
   * Toggle del modo pre-launch
   */
  async togglePrelaunchMode(): Promise<void> {
    if (!this.config) return;

    const newState = !this.config.enabled;
    const action = newState ? 'activar' : 'desactivar';
    const icon = newState ? 'warning' : 'question';

    const result = await Swal.fire({
      title: `¿${action.charAt(0).toUpperCase() + action.slice(1)} modo pre-launch?`,
      html: `
        <div class="text-start">
          <p><strong>Acción:</strong> ${action.toUpperCase()} el modo pre-lanzamiento</p>
          <hr>
          <p><strong>Efectos en el frontend:</strong></p>
          <ul>
            <li>${newState ? '🚀 Los visitantes verán el landing de pre-lanzamiento' : '🏪 Los visitantes verán la tienda completa'}</li>
            <li>${newState ? '📧 Podrán suscribirse para recibir notificaciones' : '🛒 Podrán navegar y comprar productos'}</li>
            <li>${newState ? '⏳ No podrán acceder al catálogo de productos' : '✅ Tendrán acceso completo a toda la funcionalidad'}</li>
          </ul>
          <p class="text-muted mt-3"><em>El cambio será inmediato en toda la plataforma.</em></p>
        </div>
      `,
      icon: icon,
      showCancelButton: true,
      confirmButtonText: `Sí, ${action}`,
      cancelButtonText: 'Cancelar',
      confirmButtonColor: newState ? '#f1c40f' : '#3085d6',
      cancelButtonColor: '#d33',
      width: '500px'
    });

    if (result.isConfirmed) {
      this.updatePrelaunchConfig(newState);
    }
  }

  /**
   * Actualizar configuración en backend
   */
  private updatePrelaunchConfig(enabled: boolean): void {
    this.configLoading = true;

    this.prelaunchService.updatePrelaunchConfig(enabled).subscribe({
      next: (updatedConfig) => {
        this.config = updatedConfig;
        this.configLoading = false;
        
        Swal.fire({
          title: '¡Configuración actualizada!',
          text: `Modo pre-launch ${enabled ? 'activado' : 'desactivado'} correctamente`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });

        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error updating config:', err);
        this.configLoading = false;
        
        Swal.fire({
          title: 'Error',
          text: 'No se pudo actualizar la configuración. Inténtalo de nuevo.',
          icon: 'error'
        });

        this.cd.detectChanges();
      }
    });
  }
}
