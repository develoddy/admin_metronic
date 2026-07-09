import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { PrintfulService } from '../_services/printful.service';

interface SyncStats {
  productsProcessed: number;
  created: number;
  updated: number;
  deleted: number;
  skipped?: number;
  errors?: any[];
}

@Component({
  selector: 'app-list-printful',
  templateUrl: './list-printful.component.html',
  styleUrls: ['./list-printful.component.scss']
})
export class ListPrintfulComponent implements OnInit, OnDestroy {

  // Estado de sincronización
  public isLoading = false;
  public isLoaded = false;
  public syncCompleted = false;
  
  // Estadísticas de sincronización
  public syncStats: SyncStats | null = null;
  
  // Mensajes
  public successMessage: string | null = null;
  public errorMessage: string | null = null;
  public warningMessage: string | null = null;
  
  // Progreso
  public syncProgress = 0;
  public syncStartTime: Date | null = null;
  public syncDuration: string | null = null;
  private progressInterval: any = null;
  private syncEventSource: EventSource | null = null;
  
  // Terminal de logs en tiempo real
  public terminalLogs: Array<{message: string, type: 'info' | 'success' | 'warning' | 'error', timestamp: Date}> = [];
  public showTerminal = false;
  public terminalCollapsed = false;

  constructor(
    public _printfulService: PrintfulService,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // Inicialización
  }

  ngOnDestroy(): void {
    // Limpiar interval si existe
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }

    if (this.syncEventSource) {
      this.syncEventSource.close();
      this.syncEventSource = null;
    }
  }

  /**
   * Sincroniza productos desde Printful
   * Maneja respuestas exitosas y errores con estadísticas detalladas
   */
  synProducts() {
    // Resetear estado
    this.resetSyncState();
    
    // Iniciar sincronización
    this.isLoading = true;
    this.showTerminal = true; // Mostrar terminal
    this.syncStartTime = new Date();
    this.syncProgress = 10; // Progreso inicial
    
    // Forzar detección de cambios al inicio
    this.cd.detectChanges();
    
    console.log('🔄 Iniciando sincronización con Printful...');
    
    // Agregar log inicial al terminal
    this.addTerminalLog('🚀 Iniciando sincronización con Printful...', 'info');
    
    // Progreso real por eventos del backend (SSE)
    this.addTerminalLog('📡 Abriendo canal de progreso en tiempo real...', 'info');

    if (this.syncEventSource) {
      this.syncEventSource.close();
      this.syncEventSource = null;
    }

    this.syncEventSource = this._printfulService.synPrintfulProductsStream({
      onStart: (payload: any) => {
        this.syncProgress = 12;
        this.addTerminalLog(payload?.message || '🚀 Sincronización iniciada', 'info');
      },
      onProgress: (payload: any) => {
        const msg = payload?.message;
        if (msg) {
          const type = payload?.type === 'error' ? 'error' : payload?.type === 'summary' ? 'success' : 'info';
          this.addTerminalLog(msg, type as 'info' | 'success' | 'warning' | 'error');
        }

        if (payload?.type === 'product' && payload?.total > 0) {
          const pct = 15 + Math.round((payload.processed / payload.total) * 75);
          this.syncProgress = Math.min(95, Math.max(this.syncProgress, pct));
        }

        this.cd.detectChanges();
      },
      onComplete: (resp: any) => {
        console.log('✅ Sincronización completada:', resp);
        this.syncEventSource = null;

        if (this.syncStartTime) {
          const duration = new Date().getTime() - this.syncStartTime.getTime();
          this.syncDuration = this.formatDuration(duration);
        }

        if (resp.sync) {
          this.syncStats = {
            productsProcessed: resp.productsProcessed || 0,
            created: resp.created || 0,
            updated: resp.updated || 0,
            deleted: resp.deleted || 0,
            skipped: resp.skipped || 0,
            errors: resp.errors || []
          };

          this.addTerminalLog('', 'info');
          this.addTerminalLog('📊 RESUMEN DE SINCRONIZACIÓN:', 'info');
          this.addTerminalLog(`   • Total procesados: ${this.syncStats?.productsProcessed}`, 'success');
          this.addTerminalLog(`   • Creados: ${this.syncStats?.created}`, this.syncStats?.created! > 0 ? 'success' : 'info');
          this.addTerminalLog(`   • Actualizados: ${this.syncStats?.updated}`, this.syncStats?.updated! > 0 ? 'success' : 'info');
          this.addTerminalLog(`   • Eliminados: ${this.syncStats?.deleted}`, this.syncStats?.deleted! > 0 ? 'warning' : 'info');
          this.addTerminalLog(`   • Sin cambios: ${this.syncStats?.skipped}`, 'info');

          if (this.syncStats?.errors && this.syncStats.errors.length > 0) {
            this.addTerminalLog(`   • Errores: ${this.syncStats.errors.length}`, 'error');
            this.warningMessage = `⚠️ Se completó con ${this.syncStats.errors.length} errores. Revisa los detalles abajo.`;
          }

          this.successMessage = this.generateSuccessMessage(this.syncStats);
        } else {
          this.errorMessage = '❌ La sincronización no se completó correctamente';
          this.addTerminalLog('❌ Error: La sincronización no se completó correctamente', 'error');
        }

        this.syncProgress = 100;
        this.isLoaded = true;
        this.syncCompleted = true;

        setTimeout(() => {
          this.isLoading = false;
          this.cd.detectChanges();
        }, 500);
      },
      onError: (error: any) => {
        console.error('❌ Error en sincronización stream:', error);
        this.syncEventSource = null;
        this.isLoading = false;
        this.syncCompleted = false;
        this.syncProgress = 0;

        const errorMsg = error?.message || 'Error desconocido al sincronizar con Printful';
        this.errorMessage = `❌ Error: ${errorMsg}`;

        this.addTerminalLog('', 'info');
        this.addTerminalLog(`❌ ERROR: ${errorMsg}`, 'error');

        if (error?.details) {
          this.addTerminalLog(`   Detalles: ${error.details}`, 'error');
        }

        this.cd.detectChanges();
      }
    });
  }

  /**
   * Agrega un log al terminal
   */
  private addTerminalLog(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    this.terminalLogs.push({
      message,
      type,
      timestamp: new Date()
    });
    
    // Limitar a los últimos 50 logs para no saturar el DOM
    if (this.terminalLogs.length > 50) {
      this.terminalLogs.shift();
    }
    
    this.cd.detectChanges();
    
    // Auto-scroll al final del terminal
    setTimeout(() => {
      const terminal = document.querySelector('.sync-terminal-body');
      if (terminal) {
        terminal.scrollTop = terminal.scrollHeight;
      }
    }, 50);
  }
  
  /**
   * Colapsa/expande el terminal
   */
  toggleTerminal(): void {
    this.terminalCollapsed = !this.terminalCollapsed;
  }
  
  /**
   * Cierra el terminal completamente
   */
  closeTerminal(): void {
    this.showTerminal = false;
    this.terminalCollapsed = false;
  }

  /**
   * Resetea el estado de sincronización
   */
  private resetSyncState(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }

    if (this.syncEventSource) {
      this.syncEventSource.close();
      this.syncEventSource = null;
    }

    this.isLoaded = false;
    this.syncCompleted = false;
    this.successMessage = null;
    this.errorMessage = null;
    this.warningMessage = null;
    this.syncStats = null;
    this.syncProgress = 0;
    this.syncStartTime = null;
    this.syncDuration = null;
    this.terminalLogs = [];
    this.showTerminal = false;
    this.terminalCollapsed = false;
  }

  /**
   * Genera mensaje de éxito detallado
   */
  private generateSuccessMessage(stats: SyncStats): string {
    const parts: string[] = [];
    
    if (stats.created > 0) parts.push(`${stats.created} creados`);
    if (stats.updated > 0) parts.push(`${stats.updated} actualizados`);
    if (stats.deleted > 0) parts.push(`${stats.deleted} eliminados`);
    if (stats.skipped && stats.skipped > 0) parts.push(`${stats.skipped} sin cambios`);
    
    const summary = parts.length > 0 ? parts.join(', ') : 'sin cambios';
    
    return `✅ Sincronización completada: ${stats.productsProcessed} productos procesados (${summary})`;
  }

  /**
   * Formatea duración en formato legible
   */
  private formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  }

  /**
   * Obtiene clase CSS para el badge de estadística
   */
  getBadgeClass(type: 'created' | 'updated' | 'deleted' | 'skipped'): string {
    const classes = {
      created: 'badge-success',
      updated: 'badge-primary',
      deleted: 'badge-warning',
      skipped: 'badge-secondary'
    };
    return classes[type] || 'badge-light';
  }

  /**
   * Obtiene icono para el tipo de estadística
   */
  getStatIcon(type: 'created' | 'updated' | 'deleted' | 'skipped'): string {
    const icons = {
      created: 'fas fa-plus-circle',
      updated: 'fas fa-sync-alt',
      deleted: 'fas fa-trash-alt',
      skipped: 'fas fa-minus-circle'
    };
    return icons[type] || 'fas fa-info-circle';
  }
}
