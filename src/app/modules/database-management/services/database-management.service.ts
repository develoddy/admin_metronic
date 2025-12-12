import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, finalize, catchError } from 'rxjs/operators';
import { AuthService } from '../../auth/_services/auth.service';
import { BackupsService } from '../../backups/services/backups.service';
import { environment } from '../../../../environments/environment';
import {
  DatabaseStatus,
  DatabaseResetRequest,
  DatabaseResetResponse,
  MigrationRequest,
  MigrationResponse,
  RollbackRequest,
  DatabaseOperation,
  DatabaseManagementState
} from '../models/database-management.models';

@Injectable({
  providedIn: 'root'
})
export class DatabaseManagementService {

  private API_URL = `${environment.URL_SERVICIOS}/database-management`;

  // Estado reactivo del módulo
  private stateSubject = new BehaviorSubject<DatabaseManagementState>({
    status: null,
    operation: {
      type: 'status',
      isLoading: false,
      error: null,
      success: false,
      lastResult: null
    },
    lastReset: null,
    lastMigration: null
  });

  public state$ = this.stateSubject.asObservable();
  public operation$ = this.stateSubject.pipe(map(state => state.operation));

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private backupsService: BackupsService // 🔗 Integración con módulo existente
  ) {}

  /**
   * Obtener headers de autenticación
   */
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({ 
      'token': this.authService.token || '',
      'Content-Type': 'application/json'
    });
  }

  /**
   * Actualizar estado de operación
   */
  private updateOperationState(
    type: DatabaseOperation['type'], 
    isLoading: boolean, 
    error: string | null = null,
    success: boolean = false,
    result: any = null
  ): void {
    const currentState = this.stateSubject.value;
    this.stateSubject.next({
      ...currentState,
      operation: {
        type,
        isLoading,
        error,
        success,
        lastResult: result
      }
    });
  }

  /**
   * 📊 Obtener estado de la base de datos
   */
  getDatabaseStatus(): Observable<DatabaseStatus> {
    this.updateOperationState('status', true);

    return this.http.get<DatabaseStatus>(`${this.API_URL}/status`, { 
      headers: this.getHeaders() 
    }).pipe(
      map(response => {
        const currentState = this.stateSubject.value;
        this.stateSubject.next({
          ...currentState,
          status: response
        });
        return response;
      }),
      finalize(() => this.updateOperationState('status', false, null, true)),
      catchError(error => {
        this.updateOperationState('status', false, error.error?.message || error.message);
        throw error;
      })
    );
  }

  /**
   * 🚨 Reset completo de la base de datos (OPERACIÓN DESTRUCTIVA)
   */
  resetDatabase(request: DatabaseResetRequest): Observable<DatabaseResetResponse> {
    this.updateOperationState('reset', true);

    return this.http.post<DatabaseResetResponse>(`${this.API_URL}/reset`, request, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        const currentState = this.stateSubject.value;
        this.stateSubject.next({
          ...currentState,
          lastReset: response
        });
        this.updateOperationState('reset', false, null, true, response);
        return response;
      }),
      catchError(error => {
        this.updateOperationState('reset', false, error.error?.message || error.message);
        throw error;
      })
    );
  }

  /**
   * 🏃‍♂️ Ejecutar migraciones pendientes
   */
  runMigrations(request: MigrationRequest): Observable<MigrationResponse> {
    this.updateOperationState('migrate', true);

    return this.http.post<MigrationResponse>(`${this.API_URL}/migrate`, request, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        const currentState = this.stateSubject.value;
        this.stateSubject.next({
          ...currentState,
          lastMigration: response
        });
        this.updateOperationState('migrate', false, null, true, response);
        return response;
      }),
      catchError(error => {
        this.updateOperationState('migrate', false, error.error?.message || error.message);
        throw error;
      })
    );
  }

  /**
   * ↩️ Rollback de migración
   */
  rollbackMigration(request: RollbackRequest): Observable<MigrationResponse> {
    this.updateOperationState('rollback', true);

    return this.http.post<MigrationResponse>(`${this.API_URL}/rollback`, request, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        const currentState = this.stateSubject.value;
        this.stateSubject.next({
          ...currentState,
          lastMigration: response
        });
        this.updateOperationState('rollback', false, null, true, response);
        return response;
      }),
      catchError(error => {
        this.updateOperationState('rollback', false, error.error?.message || error.message);
        throw error;
      })
    );
  }

  /**
   * 🔗 INTEGRACIÓN: Reset con backup automático
   * Usa el servicio de backups existente para crear un backup antes del reset
   */
  resetWithAutomaticBackup(request: Omit<DatabaseResetRequest, 'createBackupFirst'>): Observable<DatabaseResetResponse> {
    // Forzar creación de backup
    const resetRequest: DatabaseResetRequest = {
      ...request,
      createBackupFirst: true
    };

    return this.resetDatabase(resetRequest);
  }

  /**
   * 📦 Crear backup manual antes de operaciones
   * Wrapper del servicio de backups existente
   */
  createBackupBeforeOperation(reason: string = 'Before database operation'): Observable<any> {
    return this.backupsService.createManualBackup();
  }

  /**
   * 📋 Obtener lista de backups (delegado al servicio existente)
   */
  getBackupsList(): Observable<any> {
    return this.backupsService.getBackups();
  }

  /**
   * 🔄 Refresh completo del estado
   */
  refreshState(): void {
    this.getDatabaseStatus().subscribe({
      next: () => console.log('Estado actualizado'),
      error: (error) => console.error('Error actualizando estado:', error)
    });
  }

  /**
   * 🧹 Limpiar estado del módulo
   */
  clearState(): void {
    this.stateSubject.next({
      status: null,
      operation: {
        type: 'status',
        isLoading: false,
        error: null,
        success: false,
        lastResult: null
      },
      lastReset: null,
      lastMigration: null
    });
  }

  /**
   * ✅ Verificar si el usuario actual tiene permisos de Super Admin
   * (Implementar según tu sistema de autenticación)
   */
  checkSuperAdminPermissions(): boolean {
    const currentUser = this.authService.user;
    
    if (!currentUser) {
      console.log('🚫 No current user found');
      return false;
    }

    console.log('👤 Current user data:', currentUser);
    console.log('🔑 User rol:', currentUser.rol);
    console.log('🔑 User role:', currentUser.role);

    // Ajustar según tu sistema de roles (usando 'rol' como en tu BD)
    return currentUser.rol === 'admin' ||           // 🔧 Campo 'rol' de tu BD
           currentUser.role === 'admin' ||          // 🔧 Fallback para 'role'
           currentUser.role === 'super_admin' || 
           currentUser.role === 'SUPER_ADMIN' ||
           currentUser.rol === 'super_admin' ||     // 🔧 Campo 'rol' de tu BD
           currentUser.rol === 'SUPER_ADMIN' ||     // 🔧 Campo 'rol' de tu BD
           currentUser.is_super_admin === true ||
           currentUser.roles?.includes('SUPER_ADMIN') ||
           currentUser.roles?.includes('admin');
  }

  /**
   * 🔒 Configuración de seguridad del módulo
   */
  getSecurityConfig() {
    return {
      requireSuperAdmin: true,
      requireConfirmationText: true,
      requiredConfirmationText: 'DELETE ALL DATA',
      allowInProduction: false, // Cambiar según necesidades
      createBackupByDefault: true
    };
  }
}