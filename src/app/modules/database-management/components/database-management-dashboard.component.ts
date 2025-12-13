import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { DatabaseManagementService } from '../services/database-management.service';
import { BackupsService } from '../../backups/services/backups.service';
import {
  DatabaseStatus,
  DatabaseResetRequest,
  MigrationRequest,
  DatabaseManagementState
} from '../models/database-management.models';

@Component({
  selector: 'app-database-management-dashboard',
  templateUrl: './database-management-dashboard.component.html',
  styleUrls: ['./database-management-dashboard.component.scss']
})
export class DatabaseManagementDashboardComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  // Estado del módulo
  state: DatabaseManagementState | null = null;
  status: DatabaseStatus | null = null;

  // Estados de carga específicos
  isLoadingStatus = false;
  isResetting = false;
  isMigrating = false;

  // Configuración de seguridad
  securityConfig = this.dbService.getSecurityConfig();
  isSuperAdmin = false;

  // Formularios
  resetForm = {
    confirmReset: false,
    confirmText: '',
    createBackupFirst: true,
    reason: '',
    adminPassword: ''
  };

  migrationForm = {
    confirmMigrations: false
  };

  rollbackForm = {
    confirmRollback: false
  };

  // Para integración con backups
  recentBackups: any[] = [];

  // Estados para migraciones y seeders
  migrationsStatus: any = null;
  seedersStatus: any = null;
  isLoadingMigrations = false;
  isLoadingSeeders = false;
  executingMigration: string | null = null;
  executingSeeder: string | null = null;
  executingRollback: string | null = null;

  // Propiedad para verificar si las operaciones están permitidas
  isManagementAllowed = false;

  constructor(
    private dbService: DatabaseManagementService,
    private backupsService: BackupsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('🚀 Iniciando DatabaseManagementDashboardComponent');
    this.initializeComponent();
    this.setupSubscriptions();
    this.loadInitialData();
    
    // Cargar migraciones y seeders después de un pequeño delay para asegurar que todo esté inicializado
    setTimeout(() => {
      this.loadMigrationsStatus();
      this.loadSeedersStatus();
    }, 1000);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeComponent(): void {
    // Verificar permisos de super admin
    this.isSuperAdmin = this.dbService.checkSuperAdminPermissions();
    
    // Inicializar permisos de gestión
    this.isManagementAllowed = this.isSuperAdmin;
    
    if (!this.isSuperAdmin) {
      this.showAccessDeniedAlert();
    }
  }

  private setupSubscriptions(): void {
    // Suscribirse al estado del módulo
    this.dbService.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.state = state;
        this.status = state.status;
        
        // Actualizar permisos de gestión - usar canManage para migraciones/seeders
        this.isManagementAllowed = this.isSuperAdmin && this.status?.permissions?.canManage !== false;
        
        // Actualizar estados de carga
        this.isResetting = state.operation.type === 'reset' && state.operation.isLoading;
        this.isMigrating = (state.operation.type === 'migrate' || state.operation.type === 'rollback') && state.operation.isLoading;
        this.isLoadingStatus = state.operation.type === 'status' && state.operation.isLoading;
        
        this.cdr.detectChanges();
      });
  }

  private loadInitialData(): void {
    if (this.isSuperAdmin) {
      this.refreshDatabaseStatus();
      this.loadRecentBackups();
    }
  }

  /**
   * 📊 Cargar estado de la base de datos
   */
  refreshDatabaseStatus(): void {
    this.dbService.getDatabaseStatus().subscribe({
      next: (status) => {
        console.log('Estado de la base de datos cargado:', status);
      },
      error: (error) => {
        console.error('Error cargando estado:', error);
        
        // 🚨 Manejar error 401 después de reset (usuario eliminado)
        if (error.status === 401) {
          console.log('🔒 Error 401 detectado - probablemente post-reset, usuario eliminado');
          // No mostrar error, es comportamiento esperado después del reset
          return;
        }
        
        this.showError('Error cargando estado de la base de datos', error.message);
      }
    });
  }

  /**
   * 📦 Cargar backups recientes (integración)
   */
  private loadRecentBackups(): void {
    this.backupsService.getBackups().subscribe({
      next: (response) => {
        this.recentBackups = response.backups?.slice(0, 5) || [];
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error cargando backups:', error);
      }
    });
  }

  /**
   * 🚨 Reset completo de la base de datos
   */
  async resetDatabase(): Promise<void> {
    if (!this.isSuperAdmin) {
      this.showAccessDeniedAlert();
      return;
    }

    // Validaciones de formulario
    if (!this.resetForm.confirmReset) {
      this.showError('Confirmación requerida', 'Debe confirmar que desea resetear la base de datos');
      return;
    }

    if (this.resetForm.confirmText !== this.securityConfig.requiredConfirmationText) {
      this.showError('Texto de confirmación incorrecto', `Debe escribir exactamente: "${this.securityConfig.requiredConfirmationText}"`);
      return;
    }

    if (!this.resetForm.reason.trim()) {
      this.showError('Motivo requerido', 'Debe proporcionar un motivo para el reset');
      return;
    }

    // Confirmación adicional con SweetAlert
    const warningResult = await Swal.fire({
      title: '⚠️ OPERACIÓN DESTRUCTIVA',
      html: `
        <div class="text-start">
          <h5 class="text-danger mb-3">¡ATENCIÓN! Esta operación:</h5>
          <ul class="text-start">
            <li class="mb-2">🚨 <strong>BORRARÁ TODOS LOS DATOS</strong> de la base de datos</li>
            <li class="mb-2">🔄 Recreará todas las tablas desde cero</li>
            <li class="mb-2">💾 ${this.resetForm.createBackupFirst ? 'Creará un backup automático ANTES del reset' : 'NO creará backup (MUY PELIGROSO)'}</li>
            <li class="mb-2">⚙️ Entorno: <span class="badge badge-${this.status?.database.environment === 'production' ? 'danger' : 'warning'}">${this.status?.database.environment?.toUpperCase()}</span></li>
          </ul>
          <hr>
          <p><strong>Motivo:</strong> ${this.resetForm.reason}</p>
          <p class="text-muted"><em>Esta acción NO se puede deshacer.</em></p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'SÍ, RESETEAR BASE DE DATOS',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      width: '600px',
      focusCancel: true
    });

    if (!warningResult.isConfirmed) {
      return;
    }

    // Ejecutar reset
    const request: DatabaseResetRequest = {
      confirmReset: this.resetForm.confirmReset,
      confirmText: this.resetForm.confirmText,
      createBackupFirst: this.resetForm.createBackupFirst,
      reason: this.resetForm.reason,
      adminPassword: this.resetForm.adminPassword
    };

    this.dbService.resetDatabase(request).subscribe({
      next: (response) => {
        console.log('Reset exitoso:', response);
        
        // 🚨 Reset completado - mostrar información y logout automático
        const backupInfo = response.backupCreated ? `Sí (${response.backupFilename})` : 'No';
        
        Swal.fire({
          title: '✅ Reset Completado',
          html: `
            <div class="text-start">
              <p><strong>La base de datos ha sido reseteada exitosamente.</strong></p>
              <hr>
              <ul>
                <li>📅 Ejecutado: ${new Date(response.executedAt || Date.now()).toLocaleString()}</li>
                <li>🔄 Tablas recreadas: ${response.tablesRecreated ? 'Sí' : 'No'}</li>
                <li>💾 Backup creado: ${backupInfo}</li>
                <li>👤 Usuario ejecutor: ${response.user}</li>
              </ul>
              <hr>
              <div class="alert alert-warning mt-3">
                <h6>⚠️ Cierre de Sesión Automático</h6>
                <p class="mb-0">Todos los usuarios fueron eliminados. Será redirigido al login para crear nuevamente las credenciales de administrador.</p>
              </div>
            </div>
          `,
          icon: 'success',
          timer: 8000,
          showConfirmButton: true,
          confirmButtonText: 'Ir a Login',
          allowOutsideClick: false
        }).then(() => {
          // 🔄 Logout automático y redirección
          this.handlePostResetLogout();
        });

        this.resetResetForm();
      },
      error: (error) => {
        console.error('Error en reset:', error);
        this.showError('Error durante el reset', error.message || 'Error desconocido');
      }
    });
  }

  /**
   * 🏃‍♂️ Ejecutar migraciones
   */
  async runMigrations(): Promise<void> {
    if (!this.isSuperAdmin) {
      this.showAccessDeniedAlert();
      return;
    }

    if (!this.migrationForm.confirmMigrations) {
      this.showError('Confirmación requerida', 'Debe confirmar que desea ejecutar las migraciones');
      return;
    }

    const confirmResult = await Swal.fire({
      title: '🏃‍♂️ Ejecutar Migraciones',
      text: '¿Está seguro de que desea ejecutar todas las migraciones pendientes?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, ejecutar',
      cancelButtonText: 'Cancelar'
    });

    if (!confirmResult.isConfirmed) {
      return;
    }

    const request: MigrationRequest = {
      confirmMigrations: this.migrationForm.confirmMigrations
    };

    // Set loading state
    this.isLoadingMigrations = true;
    
    this.dbService.runMigrations(request).subscribe({
      next: (response) => {
        console.log('Migraciones ejecutadas:', response);
        
        Swal.fire({
          title: '✅ Migraciones Completadas',
          html: `
            <div class="text-start">
              <p><strong>Las migraciones se han ejecutado exitosamente.</strong></p>
              ${response.output ? `<hr><pre class="text-start bg-light p-2 small">${response.output}</pre>` : ''}
            </div>
          `,
          icon: 'success'
        });

        this.migrationForm.confirmMigrations = false;
        // Reload both database status AND migrations status
        this.refreshDatabaseStatus();
        this.loadMigrationsStatus();
      },
      error: (error) => {
        console.error('Error ejecutando migraciones:', error);
        this.showError('Error ejecutando migraciones', error.message);
      },
      complete: () => {
        // Reset loading state regardless of success or error
        this.isLoadingMigrations = false;
      }
    });
  }

  /**
   * ↩️ Rollback de migración
   */
  async rollbackMigration(): Promise<void> {
    if (!this.isSuperAdmin) {
      this.showAccessDeniedAlert();
      return;
    }

    if (!this.rollbackForm.confirmRollback) {
      this.showError('Confirmación requerida', 'Debe confirmar que desea hacer rollback de la última migración');
      return;
    }

    const confirmResult = await Swal.fire({
      title: '↩️ Rollback de Migración',
      text: '¿Está seguro de que desea deshacer la última migración? Esta acción puede ser peligrosa.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, hacer rollback',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#f39c12'
    });

    if (!confirmResult.isConfirmed) {
      return;
    }

    // Set loading state
    this.isLoadingMigrations = true;
    
    this.dbService.rollbackMigration(this.rollbackForm).subscribe({
      next: (response) => {
        console.log('Rollback ejecutado:', response);
        
        Swal.fire({
          title: '✅ Rollback Completado',
          text: 'La última migración ha sido revertida exitosamente.',
          icon: 'success'
        });

        this.rollbackForm.confirmRollback = false;
        // Reload both database status AND migrations status
        this.refreshDatabaseStatus();
        this.loadMigrationsStatus();
      },
      error: (error) => {
        console.error('Error en rollback:', error);
        this.showError('Error ejecutando rollback', error.message);      },
      complete: () => {
        // Reset loading state regardless of success or error
        this.isLoadingMigrations = false;      }
    });
  }

  /**
   * 📦 Crear backup manual (integración)
   */
  createBackup(): void {
    this.backupsService.createManualBackup().subscribe({
      next: (response) => {
        Swal.fire({
          title: '✅ Backup Creado',
          text: `Backup creado exitosamente: ${response.filename}`,
          icon: 'success'
        });
        this.loadRecentBackups();
      },
      error: (error) => {
        this.showError('Error creando backup', error.message);
      }
    });
  }

  /**
   * 🧹 Limpiar formularios
   */
  private resetResetForm(): void {
    this.resetForm = {
      confirmReset: false,
      confirmText: '',
      createBackupFirst: true,
      reason: '',
      adminPassword: ''
    };
  }

  /**
   * 🚨 Mostrar alerta de acceso denegado
   */
  private showAccessDeniedAlert(): void {
    Swal.fire({
      title: '🚫 Acceso Denegado',
      text: 'Solo los super administradores pueden acceder a la gestión de base de datos.',
      icon: 'error',
      confirmButtonText: 'Entendido'
    });
  }

  /**
   * ❌ Mostrar error
   */
  private showError(title: string, message: string): void {
    Swal.fire({
      title: `❌ ${title}`,
      text: message,
      icon: 'error'
    });
  }

  /**
   * 🎨 Obtener clase CSS para el estado de la base de datos
   */
  getStatusBadgeClass(): string {
    if (!this.status) return 'badge-secondary';
    
    if (this.status.database.connected) {
      return this.status.database.environment === 'production' ? 'badge-success' : 'badge-warning';
    }
    return 'badge-danger';
  }

  /**
   * � Manejar logout post-reset
   */
  private handlePostResetLogout(): void {
    // Limpiar token y datos del usuario
    localStorage.removeItem('token');
    sessionStorage.clear();
    
    // Mostrar mensaje final y redirigir
    Swal.fire({
      title: '🚪 Sesión Cerrada',
      text: 'Ha sido desconectado automáticamente. Cree nuevas credenciales de administrador.',
      icon: 'info',
      timer: 3000,
      showConfirmButton: false
    }).then(() => {
      // Redirigir al login
      window.location.href = '/auth/login';
    });
  }

  /**
   * �📊 Obtener texto del estado
   */
  getStatusText(): string {
    if (!this.status) return 'Desconocido';
    
    if (this.status.database.connected) {
      return `Conectado (${this.status.database.environment.toUpperCase()})`;
    }
    return 'Desconectado';
  }
  /**
   * 📋 Cargar estado de migraciones
   */
  loadMigrationsStatus(): void {
    console.log('🔄 [DEBUG] loadMigrationsStatus iniciando...');
    console.log('🔄 [DEBUG] Estado actual isLoadingMigrations:', this.isLoadingMigrations);
    
    this.isLoadingMigrations = true;
    console.log('🔄 [DEBUG] Cambiado isLoadingMigrations a:', this.isLoadingMigrations);
    
    this.dbService.getMigrationsStatus().pipe(
      finalize(() => {
        console.log('🔄 [DEBUG] finalize ejecutado - reseteando loading migrations');
        this.isLoadingMigrations = false;
        console.log('🔄 [DEBUG] isLoadingMigrations después de finalize:', this.isLoadingMigrations);
        this.cdr.detectChanges(); // Forzar detección de cambios
      })
    ).subscribe({
      next: (response) => {
        console.log('✅ [DEBUG] Estado de migraciones cargado exitosamente:', response);
        this.migrationsStatus = response;
      },
      error: (error) => {
        console.error('❌ [DEBUG] Error al cargar migraciones:', error);
        console.error('❌ [DEBUG] Error status:', error.status);
        this.migrationsStatus = null;
      },
      complete: () => {
        console.log('🔄 [DEBUG] Observable migrations completo');
      }
    });
  }

  /**
   * 📋 Cargar estado de seeders
   */
  loadSeedersStatus(): void {
    console.log('🔄 [DEBUG] loadSeedersStatus iniciando...');
    console.log('🔄 [DEBUG] isLoadingSeeders antes:', this.isLoadingSeeders);
    
    this.isLoadingSeeders = true;
    console.log('🔄 [DEBUG] isLoadingSeeders después de true:', this.isLoadingSeeders);
    
    this.dbService.getSeedersStatus().pipe(
      finalize(() => {
        console.log('🔄 [DEBUG] finalize ejecutado - reseteando loading');
        this.isLoadingSeeders = false;
        console.log('🔄 [DEBUG] isLoadingSeeders después de finalize:', this.isLoadingSeeders);
        this.cdr.detectChanges(); // Forzar detección de cambios
      })
    ).subscribe({
      next: (response) => {
        console.log('✅ [DEBUG] Estado de seeders cargado exitosamente:', response);
        this.seedersStatus = response;
      },
      error: (error) => {
        console.error('❌ [DEBUG] Error al cargar seeders:', error);
        console.error('❌ [DEBUG] Error status:', error.status);
        console.error('❌ [DEBUG] Error details:', error.error);
        this.seedersStatus = null;
      },
      complete: () => {
        console.log('🔄 [DEBUG] Observable completo');
      }
    });
  }

  /**
   * 🔄 Ejecutar migración individual
   */
  runSingleMigration(migrationName: string): void {
    Swal.fire({
      title: '🔄 Ejecutar Migración',
      text: `¿Está seguro de ejecutar la migración: ${migrationName}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#007bff',
      cancelButtonColor: '#dc3545',
      confirmButtonText: 'Sí, ejecutar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.executingMigration = migrationName;
        this.dbService.runSingleMigration(migrationName).subscribe({
          next: (response) => {
            this.executingMigration = null;
            Swal.fire('✅ Éxito', response.message, 'success');
            this.loadMigrationsStatus(); // Recargar estado
          },
          error: (error) => {
            this.executingMigration = null;
            Swal.fire('❌ Error', error.error?.message || 'Error al ejecutar migración', 'error');
          }
        });
      }
    });
  }

  /**
   * 🔄 Ejecutar seeder individual
   */
  runSingleSeeder(seederName: string): void {
    Swal.fire({
      title: '🔄 Ejecutar Seeder',
      text: `¿Está seguro de ejecutar el seeder: ${seederName}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#007bff',
      cancelButtonColor: '#dc3545',
      confirmButtonText: 'Sí, ejecutar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.executingSeeder = seederName;
        this.dbService.runSingleSeeder(seederName).subscribe({
          next: (response) => {
            this.executingSeeder = null;
            Swal.fire('✅ Éxito', response.message, 'success');
            this.loadSeedersStatus(); // Recargar estado
          },
          error: (error) => {
            this.executingSeeder = null;
            Swal.fire('❌ Error', error.error?.message || 'Error al ejecutar seeder', 'error');
          }
        });
      }
    });
  }

  /**
   * 🔄 Ejecutar todas las migraciones
   */
  runAllMigrations(): void {
    Swal.fire({
      title: '🔄 Ejecutar Todas las Migraciones',
      text: '¿Está seguro de ejecutar todas las migraciones pendientes?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#007bff',
      cancelButtonColor: '#dc3545',
      confirmButtonText: 'Sí, ejecutar todas',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // Set the confirmation flag before running migrations
        this.migrationForm.confirmMigrations = true;
        this.runMigrations(); // Usar el método existente
      }
    });
  }

  /**
   * 🔄 Ejecutar todos los seeders
   */
  runAllSeeders(): void {
    Swal.fire({
      title: '🔄 Ejecutar Todos los Seeders',
      text: '¿Está seguro de ejecutar todos los seeders disponibles?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#007bff',
      cancelButtonColor: '#dc3545',
      confirmButtonText: 'Sí, ejecutar todos',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // Set loading state
        this.isLoadingSeeders = true;
        
        // Usar el método de seeders del servicio cuando esté disponible
        this.dbService.runSeeders({ confirmSeeders: true }).subscribe({
          next: (response) => {
            Swal.fire('✅ Éxito', 'Seeders ejecutados correctamente', 'success');
            this.loadSeedersStatus(); // Recargar estado
          },
          error: (error) => {
            Swal.fire('❌ Error', error.error?.message || 'Error al ejecutar seeders', 'error');
          },
          complete: () => {
            // Reset loading state regardless of success or error
            this.isLoadingSeeders = false;
          }
        });
      }
    });
  }

  /**
   * ⏪ Rollback de migración individual
   */
  rollbackSingleMigration(migrationName: string): void {
    Swal.fire({
      title: '⏪ Rollback de Migración',
      text: `¿Está seguro de hacer rollback de la migración: ${migrationName}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ffc107',
      cancelButtonColor: '#dc3545',
      confirmButtonText: 'Sí, hacer rollback',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // Use a specific rollback state instead of executingMigration
        this.executingRollback = migrationName;
        this.dbService.rollbackSingleMigration(migrationName).subscribe({
          next: (response) => {
            this.executingRollback = null;
            Swal.fire('✅ Éxito', response.message, 'success');
            this.loadMigrationsStatus(); // Recargar estado
          },
          error: (error) => {
            this.executingRollback = null;
            Swal.fire('❌ Error', error.error?.message || 'Error al hacer rollback de migración', 'error');
          }
        });
      }
    });
  }

  // =====================================================
  // 🛡️ MÉTODOS PARA MANEJO DE RESTRICCIONES DE PRODUCCIÓN
  // =====================================================

  /**
   * Muestra instrucciones detalladas para habilitar reset en producción
   */
  showProductionResetInstructions(): void {
    Swal.fire({
      title: '🔧 Instrucciones para Reset en Producción',
      html: `
        <div class="text-start">
          <div class="alert alert-warning mb-3">
            <h6 class="text-warning mb-2">⚠️ PROCEDIMIENTO DE EMERGENCIA</h6>
            <p class="mb-0 small">Solo usar en situaciones críticas con autorización del administrador del sistema.</p>
          </div>

          <h6 class="text-primary mb-3">🔐 Pasos para habilitar:</h6>
          <ol class="text-start mb-4">
            <li class="mb-2">
              <strong>Conectar al servidor:</strong>
              <br><code class="small bg-light p-1">ssh admin@lujandev.com</code>
            </li>
            <li class="mb-2">
              <strong>Navegar al directorio del proyecto:</strong>
              <br><code class="small bg-light p-1">cd /path/to/ecommerce-api</code>
            </li>
            <li class="mb-2">
              <strong>Agregar variable temporal:</strong>
              <br><code class="small bg-light p-1">export ALLOW_PROD_DB_RESET=true</code>
            </li>
            <li class="mb-2">
              <strong>Reiniciar API:</strong>
              <br><code class="small bg-light p-1">pm2 restart api</code>
            </li>
            <li class="mb-2">
              <strong>Ejecutar reset desde esta interfaz</strong>
            </li>
            <li class="mb-2">
              <strong>IMPORTANTE - Deshabilitar después:</strong>
              <br><code class="small bg-light p-1">unset ALLOW_PROD_DB_RESET && pm2 restart api</code>
            </li>
          </ol>

          <div class="alert alert-info">
            <h6 class="text-info mb-2">💡 Alternativa con archivo .env:</h6>
            <p class="mb-0 small">
              Agregar <code>ALLOW_PROD_DB_RESET=true</code> al archivo <code>.env</code> del servidor,
              reiniciar la API y remover la línea después del reset.
            </p>
          </div>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Entendido',
      width: '700px',
      customClass: {
        htmlContainer: 'text-start'
      }
    });
  }

  /**
   * Inicia la descarga de un backup manual antes del reset
   */
  downloadBackupFirst(): void {
    Swal.fire({
      title: '💾 Crear Backup Manual',
      text: '¿Desea crear un backup de la base de datos antes de proceder?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, Crear Backup',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745'
    }).then((result) => {
      if (result.isConfirmed) {
        // Usar el servicio de backups existente
        this.backupsService.createManualBackup().subscribe({
          next: (response) => {
            Swal.fire({
              title: '✅ Backup Creado',
              html: `
                <div class="text-start">
                  <p><strong>Backup creado exitosamente:</strong></p>
                  <ul>
                    <li><strong>Archivo:</strong> ${response.filename || 'backup_' + new Date().toISOString()}</li>
                    <li><strong>Tamaño:</strong> ${(response as any).size || 'N/A'}</li>
                    <li><strong>Fecha:</strong> ${new Date().toLocaleString()}</li>
                  </ul>
                  <hr>
                  <p class="text-muted small">
                    El backup está disponible en el módulo de Backups para su descarga.
                    Ahora puede proceder con las instrucciones de reset en producción.
                  </p>
                </div>
              `,
              icon: 'success',
              confirmButtonText: 'Ver Instrucciones de Reset',
              showCancelButton: true,
              cancelButtonText: 'Cerrar'
            }).then((nextResult) => {
              if (nextResult.isConfirmed) {
                this.showProductionResetInstructions();
              }
            });
          },
          error: (error) => {
            Swal.fire({
              title: '❌ Error al Crear Backup',
              text: error.error?.message || 'No se pudo crear el backup',
              icon: 'error',
              confirmButtonText: 'Entendido'
            });
          }
        });
      }
    });
  }

  /**
   * Muestra información del estado del sistema y entorno
   */
  checkEnvironmentStatus(): void {
    Swal.fire({
      title: '🔍 Estado del Sistema',
      html: `
        <div class="text-start">
          <h6 class="text-primary mb-3">📊 Información del Entorno:</h6>
          <ul class="list-unstyled">
            <li class="mb-2">
              <strong>🌍 Entorno:</strong> 
              <span class="badge badge-${this.status?.database?.environment === 'production' ? 'danger' : 'warning'} ml-2">
                ${this.status?.database?.environment?.toUpperCase() || 'UNKNOWN'}
              </span>
            </li>
            <li class="mb-2">
              <strong>🗄️ Base de datos:</strong> ${this.status?.database?.name || 'N/A'}
            </li>
            <li class="mb-2">
              <strong>📋 Tablas:</strong> ${(this.status?.database as any)?.tableCount || 0} tablas
            </li>
            <li class="mb-2">
              <strong>🔄 Migraciones:</strong> 
              ${this.migrationsStatus?.pending?.length || 0} pendientes, 
              ${this.migrationsStatus?.executed?.length || 0} ejecutadas
            </li>
            <li class="mb-2">
              <strong>🌱 Seeders:</strong> 
              ${this.seedersStatus?.pending?.length || 0} pendientes,
              ${this.seedersStatus?.executed?.length || 0} ejecutados
            </li>
            <li class="mb-2">
              <strong>🛡️ Reset habilitado:</strong> 
              <span class="badge badge-${this.status?.permissions?.canReset ? 'success' : 'danger'} ml-2">
                ${this.status?.permissions?.canReset ? 'SÍ' : 'NO'}
              </span>
            </li>
          </ul>

          <div class="alert alert-info mt-3">
            <h6 class="text-info mb-2">🔧 Variables de Sistema:</h6>
            <ul class="mb-0 small">
              <li><code>NODE_ENV</code>: ${this.status?.database?.environment || 'N/A'}</li>
              <li><code>ALLOW_PROD_DB_RESET</code>: ${this.status?.permissions?.prodResetAllowed ? 'true' : 'false/undefined'}</li>
              <li><code>ALLOW_DB_MANAGEMENT</code>: ${this.status?.permissions?.canReset ? 'true' : 'false/undefined'}</li>
            </ul>
          </div>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Cerrar',
      width: '600px'
    });
  }

  /**
   * Muestra información de contacto del administrador del sistema
   */
  contactSystemAdmin(): void {
    Swal.fire({
      title: '📞 Contactar Administrador del Sistema',
      html: `
        <div class="text-start">
          <div class="alert alert-primary mb-3">
            <h6 class="text-primary mb-2">👤 Información de Contacto:</h6>
            <p class="mb-0">Para operaciones críticas en producción, contacte al administrador del sistema.</p>
          </div>

          <h6 class="text-dark mb-3">📧 Opciones de Contacto:</h6>
          <div class="row">
            <div class="col-md-6 mb-3">
              <div class="card border-primary">
                <div class="card-body text-center p-3">
                  <i class="fas fa-envelope text-primary mb-2"></i>
                  <h6 class="mb-1">Email</h6>
                  <small>admin@lujandev.com</small>
                </div>
              </div>
            </div>
            <div class="col-md-6 mb-3">
              <div class="card border-success">
                <div class="card-body text-center p-3">
                  <i class="fas fa-comments text-success mb-2"></i>
                  <h6 class="mb-1">Slack</h6>
                  <small>#admin-emergencias</small>
                </div>
              </div>
            </div>
          </div>

          <div class="alert alert-warning">
            <h6 class="text-warning mb-2">⚠️ Para solicitud de reset incluir:</h6>
            <ul class="mb-0 small">
              <li>Motivo detallado del reset</li>
              <li>Confirmación de backup creado</li>
              <li>Urgencia y horario preferido</li>
              <li>Usuario que solicita: <strong>${(this.status as any)?.user?.email || 'Usuario actual'}</strong></li>
            </ul>
          </div>

          <div class="text-center mt-3">
            <button class="btn btn-primary mr-2" onclick="window.open('mailto:admin@lujandev.com?subject=Solicitud%20Reset%20DB%20Producción&body=Solicito%20reset%20de%20base%20de%20datos%20en%20producción%0A%0AMotivo:%0ABackup%20creado:%20Sí/No%0AUrgencia:%20Alta/Media/Baja%0A%0ASaludos')">
              <i class="fas fa-envelope mr-1"></i>Enviar Email
            </button>
          </div>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Cerrar',
      width: '650px',
      showConfirmButton: true
    });
  }
}