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
  
  // Terminal de logs en tiempo real
  public terminalLogs: Array<{message: string, type: 'info' | 'success' | 'warning' | 'error', timestamp: Date}> = [];
  public showTerminal = false;

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
    
    // Simular progreso gradual mientras se sincroniza (10% -> 80%)
    this.startProgressSimulation();
    
    // Simular logs del proceso
    this.simulateSyncLogs();

    this._printfulService.synPrintfulProducts().subscribe({
      next: (resp: any) => {
        console.log('✅ Sincronización completada:', resp);
        
        // Detener simulación de progreso
        this.stopProgressSimulation();
        
        // Actualizar progreso a 90% primero (para transición visual suave)
        this.syncProgress = 90;
        this.cd.detectChanges(); // Forzar actualización inmediata
        
        // Calcular duración
        if (this.syncStartTime) {
          const duration = new Date().getTime() - this.syncStartTime.getTime();
          this.syncDuration = this.formatDuration(duration);
        }
        
        // Agregar logs finales al terminal
        this.addTerminalLog('💾 Guardando cambios en base de datos...', 'info');
        
        // Extraer estadísticas
        if (resp.sync) {
          this.syncStats = {
            productsProcessed: resp.productsProcessed || 0,
            created: resp.created || 0,
            updated: resp.updated || 0,
            deleted: resp.deleted || 0,
            skipped: resp.skipped || 0,
            errors: resp.errors || []
          };
          
          // Agregar resumen al terminal
          setTimeout(() => {
            this.addTerminalLog('', 'info'); // Línea vacía
            this.addTerminalLog('📊 RESUMEN DE SINCRONIZACIÓN:', 'info');
            this.addTerminalLog(`   • Total procesados: ${this.syncStats?.productsProcessed}`, 'success');
            this.addTerminalLog(`   • Creados: ${this.syncStats?.created}`, this.syncStats?.created! > 0 ? 'success' : 'info');
            this.addTerminalLog(`   • Actualizados: ${this.syncStats?.updated}`, this.syncStats?.updated! > 0 ? 'success' : 'info');
            this.addTerminalLog(`   • Eliminados: ${this.syncStats?.deleted}`, this.syncStats?.deleted! > 0 ? 'warning' : 'info');
            this.addTerminalLog(`   • Sin cambios: ${this.syncStats?.skipped}`, 'info');
            
            if (this.syncStats?.errors && this.syncStats.errors.length > 0) {
              this.addTerminalLog(`   • Errores: ${this.syncStats.errors.length}`, 'error');
            }
            
            this.addTerminalLog('', 'info'); // Línea vacía
            this.addTerminalLog(`✅ Sincronización completada en ${this.syncDuration}`, 'success');
          }, 500);
          
          // Generar mensaje de éxito
          this.successMessage = this.generateSuccessMessage(this.syncStats);
          
          // Verificar si hay errores parciales
          if (this.syncStats.errors && this.syncStats.errors.length > 0) {
            this.warningMessage = `⚠️ Se completó con ${this.syncStats.errors.length} errores. Revisa los detalles abajo.`;
          }
        } else {
          this.errorMessage = '❌ La sincronización no se completó correctamente';
          this.addTerminalLog('❌ Error: La sincronización no se completó correctamente', 'error');
        }
        
        // Progreso a 100% y finalizar carga después de procesar
        setTimeout(() => {
          this.syncProgress = 100;
          this.isLoaded = true;
          this.syncCompleted = true;
          this.cd.detectChanges(); // Forzar actualización a 100%
          
          console.log('📊 Estado actualizado - Progreso: 100%, isLoaded: true, syncCompleted: true');
          
          // Ocultar barra de progreso después de 800ms (permite ver el 100%)
          setTimeout(() => {
            this.isLoading = false;
            this.cd.detectChanges(); // Forzar ocultación de barra
            console.log('✅ Barra de progreso ocultada - isLoading: false');
          }, 800);
        }, 300);
      },
      error: (error: any) => {
        console.error('❌ Error en sincronización:', error);
        
        // Detener simulación y resetear estado
        this.stopProgressSimulation();
        this.isLoading = false;
        this.syncCompleted = false;
        this.syncProgress = 0;
        
        // Extraer mensaje de error
        const errorMsg = error.error?.message || error.message || 'Error desconocido al sincronizar con Printful';
        this.errorMessage = `❌ Error: ${errorMsg}`;
        
        // Agregar error al terminal
        this.addTerminalLog('', 'info'); // Línea vacía
        this.addTerminalLog(`❌ ERROR: ${errorMsg}`, 'error');
        
        // Si hay detalles adicionales
        if (error.error?.details) {
          console.error('Detalles del error:', error.error.details);
          this.addTerminalLog(`   Detalles: ${error.error.details}`, 'error');
        }
        
        // Forzar actualización del DOM con estado de error
        this.cd.detectChanges();
      },
      complete: () => {
        console.log('🏁 Proceso de sincronización finalizado');
        // El isLoading se maneja en el bloque next con setTimeout
      }
    });
  }

  /**
   * Simula progreso gradual mientras se realiza la sincronización
   * Incrementa de 10% a 80% en intervalos
   */
  private startProgressSimulation(): void {
    // Limpiar interval previo si existe
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }
    
    // Incrementar progreso cada 2 segundos hasta 80%
    this.progressInterval = setInterval(() => {
      if (this.syncProgress < 80 && this.isLoading) {
        // Incremento variable: más rápido al inicio, más lento cerca del 80%
        const increment = this.syncProgress < 40 ? 5 : this.syncProgress < 60 ? 3 : 2;
        this.syncProgress = Math.min(this.syncProgress + increment, 80);
        
        // Forzar detección de cambios para actualizar la barra de progreso
        this.cd.detectChanges();
      }
    }, 2000);
  }
  
  /**
   * Detiene la simulación de progreso
   */
  private stopProgressSimulation(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
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
   * Simula logs del proceso de sincronización
   */
  private simulateSyncLogs(): void {
    this.addTerminalLog('🚀 Iniciando conexión con Printful API...', 'info');
    
    setTimeout(() => {
      this.addTerminalLog('📥 Obteniendo lista de productos...', 'info');
    }, 800);
    
    setTimeout(() => {
      this.addTerminalLog('🔍 Analizando productos en base de datos...', 'info');
    }, 1600);
    
    setTimeout(() => {
      this.addTerminalLog('⚙️ Comparando productos...', 'info');
    }, 2400);
    
    // Simular procesamiento de productos
    const totalProducts = 12; // Esto debería venir del backend idealmente
    for (let i = 1; i <= totalProducts; i++) {
      setTimeout(() => {
        this.addTerminalLog(`✓ Producto ${i}/${totalProducts} procesado`, 'success');
      }, 3000 + (i * 1500));
    }
  }

  /**
   * Resetea el estado de sincronización
   */
  private resetSyncState(): void {
    this.stopProgressSimulation();
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
