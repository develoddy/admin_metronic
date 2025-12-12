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
  
  // Variables para el formulario de fecha
  launchDate: string = '';
  launchTime: string = '';
  dateConfigLoading = false;

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
        this.initializeDateFields();
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
   * Inicializar campos de fecha desde la configuración
   */
  private initializeDateFields(): void {
    if (this.config?.launch_date) {
      const date = new Date(this.config.launch_date);
      // Formato para input type="date" (YYYY-MM-DD)
      this.launchDate = date.toISOString().split('T')[0];
      // Formato para input type="time" (HH:mm)
      this.launchTime = date.toTimeString().substring(0, 5);
    } else {
      // Valores por defecto (mañana a las 12:00)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(12, 0, 0, 0);
      this.launchDate = tomorrow.toISOString().split('T')[0];
      this.launchTime = '12:00';
    }
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

  /**
   * Actualizar fecha de lanzamiento
   */
  async updateLaunchDate(): Promise<void> {
    // Validar que se haya configurado fecha y hora
    if (!this.launchDate || !this.launchTime) {
      Swal.fire({
        title: 'Error de validación',
        text: 'Por favor, selecciona tanto la fecha como la hora de lanzamiento.',
        icon: 'warning'
      });
      return;
    }

    // Combinar fecha y hora
    const combinedDateTime = new Date(`${this.launchDate}T${this.launchTime}:00`);
    
    // Validar que la fecha no sea en el pasado
    if (combinedDateTime <= new Date()) {
      Swal.fire({
        title: 'Fecha inválida',
        text: 'La fecha de lanzamiento debe ser en el futuro.',
        icon: 'warning'
      });
      return;
    }

    const result = await Swal.fire({
      title: '¿Actualizar fecha de lanzamiento?',
      html: `
        <div class="text-start">
          <p><strong>Nueva fecha de lanzamiento:</strong></p>
          <p class="text-primary">${combinedDateTime.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
          <hr>
          <p class="text-muted"><em>Esta fecha será utilizada en el countdown del frontend.</em></p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, actualizar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33'
    });

    if (result.isConfirmed) {
      this.saveLaunchDate(combinedDateTime);
    }
  }

  /**
   * Guardar fecha de lanzamiento en backend
   */
  private saveLaunchDate(launchDate: Date): void {
    if (!this.config) return;

    this.dateConfigLoading = true;

    // Usar el método actualizado que acepta fecha de lanzamiento
    this.prelaunchService.updatePrelaunchConfig(this.config.enabled, launchDate.toISOString()).subscribe({
      next: (updatedConfig) => {
        this.config = updatedConfig;
        this.dateConfigLoading = false;
        
        Swal.fire({
          title: '¡Fecha actualizada!',
          text: 'La fecha de lanzamiento ha sido configurada correctamente.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });

        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error updating launch date:', err);
        this.dateConfigLoading = false;
        
        Swal.fire({
          title: 'Error',
          text: 'No se pudo actualizar la fecha de lanzamiento. Inténtalo de nuevo.',
          icon: 'error'
        });

        this.cd.detectChanges();
      }
    });
  }
}
