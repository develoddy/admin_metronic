import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subject, BehaviorSubject, combineLatest } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { BackupsService } from '../services/backups.service';
import { 
  Backup, 
  BackupListResponse, 
  BackupStatusResponse, 
  BackupStats,
  BackupOperationStatus 
} from '../models/backup.models';

@Component({
  selector: 'app-backups-dashboard',
  templateUrl: './backups-dashboard.component.html',
  styleUrls: ['./backups-dashboard.component.scss']
})
export class BackupsDashboardComponent implements OnInit, OnDestroy {
  
  private destroy$ = new Subject<void>();
  
  // Estados principales
  backups: Backup[] = [];
  backupStatus: BackupStatusResponse | null = null;
  backupStats: BackupStats | null = null;
  operationStatus: BackupOperationStatus | null = null;
  
  // Estados de carga
  isLoading$ = new BehaviorSubject<boolean>(false);
  isLoadingBackups = false;
  isLoadingStatus = false;
  isCreatingBackup = false;
  
  // Estados de la UI
  selectedBackup: Backup | null = null;
  showDeleteModal = false;
  showRestoreModal = false;
  
  // Filtros y ordenación
  searchTerm = '';
  sortBy: 'name' | 'date' | 'size' = 'date';
  sortOrder: 'asc' | 'desc' = 'desc';
  
  // Paginación
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 0;
  
  // Hacer Math disponible en el template
  Math = Math;

  constructor(
    private backupsService: BackupsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeComponent();
    this.setupSubscriptions();
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeComponent(): void {
    // Configuración inicial
    this.calculatePagination();
  }

  private setupSubscriptions(): void {
    // Suscribirse al estado de operaciones
    this.backupsService.getOperationStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => {
        this.operationStatus = status;
        this.cdr.detectChanges();
      });

    // Suscribirse al estado de carga general
    combineLatest([
      this.backupsService.isLoading$,
      this.isLoading$
    ]).pipe(takeUntil(this.destroy$))
    .subscribe(([serviceLoading, componentLoading]) => {
      // Lógica adicional si es necesaria
    });
  }

  private loadInitialData(): void {
    this.loadBackups();
    this.loadBackupStatus();
  }

  /**
   * Cargar lista de backups
   */
  loadBackups(): void {
    this.isLoadingBackups = true;
    
    this.backupsService.getBackups()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingBackups = false)
      )
      .subscribe({
        next: (response: BackupListResponse) => {
          if (response.success) {
            this.backups = response.backups;
            this.backupStats = this.backupsService.calculateBackupStats(this.backups);
            this.calculatePagination();
            this.cdr.detectChanges();
          } else {
            this.handleError('Error al cargar backups', response.message);
          }
        },
        error: (error) => {
          this.handleError('Error al cargar backups', error);
        }
      });
  }

  /**
   * Cargar estado del sistema de backups
   */
  loadBackupStatus(): void {
    this.isLoadingStatus = true;
    
    this.backupsService.getBackupStatus()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingStatus = false)
      )
      .subscribe({
        next: (response: BackupStatusResponse) => {
          if (response.success) {
            this.backupStatus = response;
            this.cdr.detectChanges();
          }
        },
        error: (error) => {
          console.warn('Error al cargar estado de backups:', error);
        }
      });
  }

  /**
   * Crear backup manual
   */
  createManualBackup(): void {
    Swal.fire({
      title: '¿Crear backup manual?',
      text: 'Se creará un backup completo de la base de datos',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, crear backup',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.executeManualBackup();
      }
    });
  }

  private executeManualBackup(): void {
    // Mostrar loading inmediatamente
    this.isCreatingBackup = true;
    
    // Mostrar SweetAlert con loading
    Swal.fire({
      title: 'Creando backup...',
      html: `
        <div class="text-center">
          <div class="spinner-border text-primary" role="status">
            <span class="sr-only">Creando...</span>
          </div>
          <p class="mt-3 mb-1">Por favor espera mientras se crea el backup</p>
          <small class="text-muted">Este proceso puede tomar algunos segundos</small>
        </div>
      `,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      willOpen: () => {
        Swal.showLoading();
      }
    });

    this.backupsService.createManualBackup()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isCreatingBackup = false;
        })
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            Swal.fire({
              title: '¡Backup creado exitosamente!',
              html: `
                <div class="text-center">
                  <i class="fas fa-check-circle text-success mb-3" style="font-size: 3rem;"></i>
                  <p class="mb-2">El backup se ha creado correctamente</p>
                  <small class="text-muted">Archivo: ${response.createdAt || 'Backup manual'}</small>
                </div>
              `,
              icon: 'success',
              timer: 4000,
              timerProgressBar: true
            });
            this.loadBackups(); // Recargar lista
            this.loadBackupStatus(); // Actualizar estado
          } else {
            Swal.fire({
              title: 'Error al crear backup',
              text: response.message || 'Ha ocurrido un error inesperado',
              icon: 'error',
              confirmButtonText: 'Entendido'
            });
          }
        },
        error: (error) => {
          Swal.fire({
            title: 'Error al crear backup',
            text: 'Ha ocurrido un error al crear el backup manual',
            icon: 'error',
            confirmButtonText: 'Entendido'
          });
          console.error('Error al crear backup manual:', error);
        }
      });
  }

  /**
   * Descargar backup
   */
  downloadBackup(backup: Backup): void {
    this.backupsService.downloadBackup(backup.filename)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          Swal.fire({
            title: 'Descarga',
            text: `Descarga iniciada: ${backup.filename}`,
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
        },
        error: (error) => {
          this.handleError('Error al descargar backup', error);
        }
      });
  }

  /**
   * Mostrar modal de confirmación para restaurar
   */
  showRestoreConfirmation(backup: Backup): void {
    this.selectedBackup = backup;
    this.showRestoreModal = true;
  }

  /**
   * Ejecutar restauración de backup
   */
  executeRestore(): void {
    if (!this.selectedBackup) return;

    Swal.fire({
      title: '⚠️ ¡ADVERTENCIA CRÍTICA!',
      html: `
        <div style="text-align: left; margin: 20px 0;">
          <p><strong>Está a punto de restaurar:</strong></p>
          <p style="background: #f8f9fa; padding: 10px; border-radius: 5px; font-family: monospace;">
            ${this.selectedBackup.filename}
          </p>
          <p style="color: #dc3545; font-weight: bold;">
            ⚠️ ESTA ACCIÓN ES IRREVERSIBLE
          </p>
          <p>La base de datos actual será <strong>completamente reemplazada</strong> por este backup.</p>
          <p>Se perderán todos los datos posteriores a la fecha del backup.</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'SÍ, RESTAURAR BACKUP',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.confirmRestore();
      }
    });
  }

  private confirmRestore(): void {
    if (!this.selectedBackup) return;

    const request = {
      filename: this.selectedBackup.filename,
      confirmRestore: true
    };

    this.backupsService.restoreBackup(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            Swal.fire({
              title: 'Backup restaurado exitosamente',
              text: `La base de datos ha sido restaurada desde ${this.selectedBackup!.filename}`,
              icon: 'success',
              confirmButtonText: 'Entendido'
            });
            this.closeRestoreModal();
          } else {
            this.handleError('Error al restaurar backup', response.message);
          }
        },
        error: (error) => {
          this.handleError('Error al restaurar backup', error);
        }
      });
  }

  /**
   * Mostrar modal de confirmación para eliminar
   */
  showDeleteConfirmation(backup: Backup): void {
    this.selectedBackup = backup;
    
    Swal.fire({
      title: '¿Eliminar backup?',
      html: `
        <p>Está a punto de eliminar permanentemente:</p>
        <p style="background: #f8f9fa; padding: 10px; border-radius: 5px; font-family: monospace;">
          ${backup.filename}
        </p>
        <p style="color: #dc3545;">Esta acción no se puede deshacer.</p>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.executeDelete();
      }
    });
  }

  private executeDelete(): void {
    if (!this.selectedBackup) return;

    const request = { confirmDelete: true };

    this.backupsService.deleteBackup(this.selectedBackup.filename, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            Swal.fire({
              title: 'Eliminado',
              text: 'Backup eliminado exitosamente',
              icon: 'success',
              timer: 2000
            });
            this.loadBackups(); // Recargar lista
          } else {
            this.handleError('Error al eliminar backup', response.message);
          }
        },
        error: (error) => {
          this.handleError('Error al eliminar backup', error);
        }
      });
  }

  /**
   * Cerrar modal de restauración
   */
  closeRestoreModal(): void {
    this.showRestoreModal = false;
    this.selectedBackup = null;
  }

  /**
   * Refrescar datos
   */
  refresh(): void {
    this.loadBackups();
    this.loadBackupStatus();
  }

  /**
   * Filtrar backups según término de búsqueda
   */
  get filteredBackups(): Backup[] {
    let filtered = this.backups;

    // Aplicar filtro de búsqueda
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(backup => 
        backup.filename.toLowerCase().includes(term) ||
        (backup.backupDate && backup.backupDate.toLowerCase().includes(term))
      );
    }

    // Aplicar ordenación
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (this.sortBy) {
        case 'name':
          comparison = a.filename.localeCompare(b.filename);
          break;
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
      }
      
      return this.sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }

  /**
   * Obtener backups para la página actual
   */
  get paginatedBackups(): Backup[] {
    const filtered = this.filteredBackups;
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  }

  /**
   * Calcular paginación
   */
  private calculatePagination(): void {
    const filtered = this.filteredBackups;
    this.totalPages = Math.ceil(filtered.length / this.itemsPerPage);
    
    // Ajustar página actual si es necesario
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    } else if (this.currentPage < 1) {
      this.currentPage = 1;
    }
  }

  /**
   * Cambiar página
   */
  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.calculatePagination();
    }
  }

  /**
   * Cambiar ordenación
   */
  changeSort(field: 'name' | 'date' | 'size'): void {
    if (this.sortBy === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortOrder = 'desc';
    }
    this.calculatePagination();
  }

  /**
   * Actualizar búsqueda
   */
  onSearchChange(): void {
    this.currentPage = 1;
    this.calculatePagination();
  }

  /**
   * Formatear fecha
   */
  formatDate(date: string | Date): string {
    return this.backupsService.formatDate(date);
  }

  /**
   * Obtener páginas para paginación
   */
  getPages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  /**
   * Manejar errores
   */
  private handleError(title: string, message: string): void {
    console.error(title, message);
    Swal.fire({
      title: title,
      text: message,
      icon: 'error',
      confirmButtonText: 'Entendido'
    });
  }

  /**
   * Verificar si el sistema está configurado correctamente
   */
  get isSystemHealthy(): boolean {
    return this.backupStatus?.status?.backupsDirectoryExists && 
           this.backupStatus?.status?.backupScriptExists;
  }

  /**
   * Obtener clase CSS para el estado del sistema
   */
  get systemStatusClass(): string {
    if (!this.backupStatus) return 'text-muted';
    
    if (this.isSystemHealthy && this.backupStatus.status.cronConfigured) {
      return 'text-success';
    } else if (this.isSystemHealthy) {
      return 'text-warning';
    } else {
      return 'text-danger';
    }
  }

  /**
   * Obtener texto del estado del sistema
   */
  get systemStatusText(): string {
    if (!this.backupStatus) return 'Cargando estado...';
    
    if (this.isSystemHealthy && this.backupStatus.status.cronConfigured) {
      return 'Sistema completamente configurado';
    } else if (this.isSystemHealthy) {
      return 'Sistema configurado (cron pendiente)';
    } else {
      return 'Sistema necesita configuración';
    }
  }

  /**
   * Configurar backups automáticos
   */
  public setupAutomaticBackups(): void {
    Swal.fire({
      title: '⚙️ Configurar Backups Automáticos',
      html: `
        <div class="text-start">
          <p class="mb-3"><strong>¿Deseas configurar backups automáticos?</strong></p>
          <div class="alert alert-info">
            <h6>📋 Lo que se configurará:</h6>
            <ul class="mb-0 text-start">
              <li>Backup diario automático a las 2:00 AM</li>
              <li>Limpieza automática de backups antiguos (>7 días)</li>
              <li>Logs detallados de cada operación</li>
              <li>Variables de entorno configuradas</li>
            </ul>
          </div>
          <div class="alert alert-warning">
            <strong>⚠️ Importante:</strong> Esta operación configurará un cron job en el sistema.
            Es seguro ejecutarla múltiples veces.
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: '🔄 Sí, Configurar',
      cancelButtonText: '❌ Cancelar',
      customClass: {
        popup: 'swal-wide'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.backupsService.setupAutomaticBackups().subscribe({
          next: (response) => {
            if (response.success) {
              Swal.fire({
                title: '✅ ¡Configuración Exitosa!',
                html: `
                  <div class="text-start">
                    <p class="mb-3"><strong>Backups automáticos configurados correctamente</strong></p>
                    <div class="alert alert-success">
                      <h6>📅 Detalles de la configuración:</h6>
                      <ul class="mb-0 text-start">
                        <li><strong>Horario:</strong> Diario a las 2:00 AM</li>
                        <li><strong>Retención:</strong> 7 días automática</li>
                        <li><strong>Logs:</strong> /api/backups/logs/cron-backup.log</li>
                      </ul>
                    </div>
                    <p class="text-muted mb-0">
                      <small>Los backups se crearán automáticamente sin necesidad de intervención manual.</small>
                    </p>
                  </div>
                `,
                icon: 'success',
                confirmButtonText: '👍 Entendido',
                customClass: {
                  popup: 'swal-wide'
                }
              });
              // Recargar estado después de configurar
              setTimeout(() => {
                this.loadBackupStatus();
              }, 1000);
            }
          },
          error: (error) => {
            console.error('Error configurando backups automáticos:', error);
            Swal.fire({
              title: '❌ Error en Configuración',
              html: `
                <div class="text-start">
                  <p class="mb-3"><strong>No se pudo configurar el sistema automático</strong></p>
                  <div class="alert alert-danger">
                    <strong>Error:</strong> ${error.error?.message || 'Error desconocido'}
                  </div>
                  <div class="alert alert-info">
                    <h6>💡 Posibles soluciones:</h6>
                    <ul class="mb-0 text-start">
                      <li>Verificar permisos del sistema</li>
                      <li>Asegurarse de que cron esté disponible</li>
                      <li>Revisar variables de entorno</li>
                      <li>Contactar al administrador del sistema</li>
                    </ul>
                  </div>
                </div>
              `,
              icon: 'error',
              confirmButtonText: '🔍 Entendido'
            });
          }
        });
      }
    });
  }

  /**
   * Limpiar duplicados del cron job
   */
  public cleanupCronDuplicates(): void {
    Swal.fire({
      title: '🧹 Limpiar Duplicados',
      html: `
        <div class="text-start">
          <p class="mb-3"><strong>¿Deseas limpiar las entradas duplicadas del cron?</strong></p>
          <div class="alert alert-info">
            <h6>🔧 Acción a realizar:</h6>
            <ul class="mb-0 text-start">
              <li>Eliminar entradas duplicadas de backup-database.sh</li>
              <li>Mantener solo una configuración activa</li>
              <li>Prevenir ejecuciones múltiples simultáneas</li>
              <li>Conservar otras tareas de cron existentes</li>
            </ul>
          </div>
          <div class="alert alert-warning">
            <strong>⚠️ Información:</strong> Se detectaron 
            <strong>" + (this.backupStatus?.status?.cronEntriesCount || 0) + "</strong> 
            entradas duplicadas que serán consolidadas en una sola.
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ffc107',
      cancelButtonColor: '#6c757d',
      confirmButtonText: '🧹 Sí, Limpiar',
      cancelButtonText: '❌ Cancelar',
      customClass: {
        popup: 'swal-wide'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.backupsService.cleanupCronDuplicates().subscribe({
          next: (response) => {
            if (response.success) {
              Swal.fire({
                title: '✅ ¡Duplicados Eliminados!',
                html: `
                  <div class="text-start">
                    <p class="mb-3"><strong>Limpieza completada exitosamente</strong></p>
                    <div class="alert alert-success">
                      <h6>📊 Resultados:</h6>
                      <ul class="mb-0 text-start">
                        <li><strong>Entradas antes:</strong> ${(response as any).details?.entriesBefore || 0}</li>
                        <li><strong>Entradas después:</strong> ${(response as any).details?.entriesAfter || 0}</li>
                        <li><strong>Duplicados eliminados:</strong> ${(response as any).details?.duplicatesRemoved || 0}</li>
                      </ul>
                    </div>
                    <p class="text-muted mb-0">
                      <small>El sistema ahora ejecutará los backups una sola vez según el horario programado.</small>
                    </p>
                  </div>
                `,
                icon: 'success',
                confirmButtonText: '👍 Perfecto',
                customClass: {
                  popup: 'swal-wide'
                }
              });
              // Recargar estado para reflejar cambios
              setTimeout(() => {
                this.loadBackupStatus();
              }, 1000);
            }
          },
          error: (error) => {
            console.error('Error limpiando duplicados:', error);
            Swal.fire({
              title: '❌ Error en Limpieza',
              html: `
                <div class="text-start">
                  <p class="mb-3"><strong>No se pudo limpiar los duplicados</strong></p>
                  <div class="alert alert-danger">
                    <strong>Error:</strong> ${error.error?.message || 'Error desconocido'}
                  </div>
                  <div class="alert alert-info">
                    <h6>💡 Posibles soluciones:</h6>
                    <ul class="mb-0 text-start">
                      <li>Verificar permisos para editar crontab</li>
                      <li>Asegurarse de tener acceso de administrador</li>
                      <li>Intentar limpiar manualmente: <code>crontab -e</code></li>
                      <li>Contactar al administrador del sistema</li>
                    </ul>
                  </div>
                </div>
              `,
              icon: 'error',
              confirmButtonText: '🔍 Entendido'
            });
          }
        });
      }
    });
  }

  /**
   * Ver logs de backups automáticos
   */
  public viewBackupLogs(): void {
    this.backupsService.getBackupLogs(100).subscribe({
      next: (response) => {
        if (response.success && response.logs.length > 0) {
          const logsHtml = response.logs
            .map(log => `<div class="log-line">${log}</div>`)
            .join('');
          
          Swal.fire({
            title: '📋 Logs de Backups Automáticos',
            html: `
              <div class="text-start">
                <div class="alert alert-info mb-3">
                  <strong>📁 Archivo:</strong> ${response.logFile}<br>
                  <strong>📊 Líneas mostradas:</strong> ${response.logs.length}
                </div>
                <div class="logs-container" style="max-height: 400px; overflow-y: auto; background: #f8f9fa; padding: 15px; border-radius: 5px; font-family: 'Courier New', monospace; font-size: 12px; text-align: left;">
                  ${logsHtml}
                </div>
              </div>
            `,
            icon: 'info',
            confirmButtonText: '✅ Cerrar',
            width: '80%',
            customClass: {
              popup: 'swal-wide',
              htmlContainer: 'text-start'
            }
          });
        } else {
          Swal.fire({
            title: '📋 Sin Logs Disponibles',
            html: `
              <div class="text-center">
                <div class="alert alert-warning">
                  <h6>⚠️ No hay logs de backups automáticos</h6>
                  <p class="mb-0">Los logs aparecerán aquí una vez que se ejecuten los primeros backups automáticos.</p>
                </div>
                <p class="text-muted">
                  <small>Los backups automáticos se ejecutan diariamente a las 2:00 AM.</small>
                </p>
              </div>
            `,
            icon: 'info',
            confirmButtonText: '👍 Entendido'
          });
        }
      },
      error: (error) => {
        console.error('Error obteniendo logs:', error);
        Swal.fire({
          title: '❌ Error',
          text: 'No se pudieron obtener los logs de backups',
          icon: 'error',
          confirmButtonText: '✅ Cerrar'
        });
      }
    });
  }

  /**
   * TrackBy function para optimizar ngFor
   */
  trackByFilename(index: number, backup: Backup): string {
    return backup.filename;
  }
}