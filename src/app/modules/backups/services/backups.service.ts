import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { finalize, map, catchError } from 'rxjs/operators';
import { AuthService } from '../../auth';
import { URL_SERVICIOS } from 'src/app/config/config';
import { 
  BackupListResponse, 
  BackupStatusResponse, 
  BackupActionResponse, 
  RestoreRequest, 
  DeleteRequest,
  BackupStats,
  Backup,
  BackupOperationStatus,
  ApiResponse,
  BackupLogsResponse
} from '../models/backup.models';

@Injectable({
  providedIn: 'root'
})
export class BackupsService {

  isLoading$: Observable<boolean>;
  isLoadingSubject: BehaviorSubject<boolean>;
  operationStatus$: BehaviorSubject<BackupOperationStatus>;

  private API_URL = `${URL_SERVICIOS}/backups`;

  constructor(
    private http: HttpClient,
    public authService: AuthService
  ) {
    this.isLoadingSubject = new BehaviorSubject<boolean>(false);
    this.isLoading$ = this.isLoadingSubject.asObservable();
    
    this.operationStatus$ = new BehaviorSubject<BackupOperationStatus>({
      isLoading: false,
      operation: null,
      error: null,
      success: false
    });
  }

  /**
   * Get HTTP headers with auth token
   */
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({ 
      'token': this.authService.token,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Get HTTP headers for file download
   */
  private getFileHeaders(): HttpHeaders {
    return new HttpHeaders({ 
      'token': this.authService.token 
    });
  }

  /**
   * Set loading state for specific operation
   */
  private setOperationStatus(operation: BackupOperationStatus['operation'], isLoading: boolean, error: string | null = null, success: boolean = false): void {
    this.isLoadingSubject.next(isLoading);
    this.operationStatus$.next({
      isLoading,
      operation,
      error,
      success
    });
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: any, operation: string) {
    console.error(`Error en ${operation}:`, error);
    let errorMessage = 'Ha ocurrido un error inesperado';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    this.setOperationStatus(null, false, errorMessage, false);
    return throwError(errorMessage);
  }

  /**
   * Obtener lista de todos los backups disponibles
   */
  getBackups(): Observable<BackupListResponse> {
    this.setOperationStatus('list', true);
    
    return this.http.get<BackupListResponse>(this.API_URL, { 
      headers: this.getHeaders() 
    }).pipe(
      map((response: BackupListResponse) => {
        this.setOperationStatus('list', false, null, true);
        return response;
      }),
      catchError(error => this.handleError(error, 'obtener backups')),
      finalize(() => this.setOperationStatus(null, false))
    );
  }

  /**
   * Obtener estado del sistema de backups
   */
  getBackupStatus(): Observable<BackupStatusResponse> {
    this.setOperationStatus('status', true);
    
    return this.http.get<BackupStatusResponse>(`${this.API_URL}/status`, { 
      headers: this.getHeaders() 
    }).pipe(
      map((response: BackupStatusResponse) => {
        this.setOperationStatus('status', false, null, true);
        return response;
      }),
      catchError(error => this.handleError(error, 'obtener estado de backups')),
      finalize(() => this.setOperationStatus(null, false))
    );
  }

  /**
   * Descargar un backup específico
   */
  downloadBackup(filename: string): Observable<Blob> {
    this.setOperationStatus('download', true);
    
    return this.http.get(`${this.API_URL}/download/${filename}`, {
      headers: this.getFileHeaders(),
      responseType: 'blob',
      observe: 'response'
    }).pipe(
      map((response: HttpResponse<Blob>) => {
        this.setOperationStatus('download', false, null, true);
        
        // Crear enlace de descarga automática
        const blob = response.body as Blob;
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        return blob;
      }),
      catchError(error => this.handleError(error, 'descargar backup')),
      finalize(() => this.setOperationStatus(null, false))
    );
  }

  /**
   * Crear un backup manual
   */
  createManualBackup(): Observable<BackupActionResponse> {
    this.setOperationStatus('create', true);
    
    return this.http.post<BackupActionResponse>(`${this.API_URL}/create`, {}, { 
      headers: this.getHeaders() 
    }).pipe(
      map((response: BackupActionResponse) => {
        this.setOperationStatus('create', false, null, true);
        return response;
      }),
      catchError(error => this.handleError(error, 'crear backup manual')),
      finalize(() => this.setOperationStatus(null, false))
    );
  }

  /**
   * Restaurar un backup específico
   */
  restoreBackup(request: RestoreRequest): Observable<BackupActionResponse> {
    this.setOperationStatus('restore', true);
    
    return this.http.post<BackupActionResponse>(`${this.API_URL}/restore`, request, { 
      headers: this.getHeaders() 
    }).pipe(
      map((response: BackupActionResponse) => {
        this.setOperationStatus('restore', false, null, true);
        return response;
      }),
      catchError(error => this.handleError(error, 'restaurar backup')),
      finalize(() => this.setOperationStatus(null, false))
    );
  }

  /**
   * Eliminar un backup específico
   */
  deleteBackup(filename: string, request: DeleteRequest): Observable<BackupActionResponse> {
    this.setOperationStatus('delete', true);
    
    return this.http.request<BackupActionResponse>('DELETE', `${this.API_URL}/${filename}`, {
      headers: this.getHeaders(),
      body: request
    }).pipe(
      map((response: BackupActionResponse) => {
        this.setOperationStatus('delete', false, null, true);
        return response;
      }),
      catchError(error => this.handleError(error, 'eliminar backup')),
      finalize(() => this.setOperationStatus(null, false))
    );
  }

  /**
   * Calcular estadísticas de los backups
   */
  calculateBackupStats(backups: Backup[]): BackupStats {
    if (!backups || backups.length === 0) {
      return {
        totalBackups: 0,
        totalSize: 0,
        totalSizeFormatted: '0 Bytes',
        oldestBackup: null,
        newestBackup: null,
        averageSize: 0,
        averageSizeFormatted: '0 Bytes'
      };
    }

    const totalSize = backups.reduce((acc, backup) => acc + backup.size, 0);
    const averageSize = totalSize / backups.length;

    // Ordenar por fecha
    const sortedByDate = [...backups].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return {
      totalBackups: backups.length,
      totalSize,
      totalSizeFormatted: this.formatFileSize(totalSize),
      oldestBackup: sortedByDate[0] || null,
      newestBackup: sortedByDate[sortedByDate.length - 1] || null,
      averageSize,
      averageSizeFormatted: this.formatFileSize(averageSize)
    };
  }

  /**
   * Formatear tamaño de archivo en formato legible
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Formatear fecha para mostrar
   */
  formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  /**
   * Validar nombre de archivo de backup
   */
  isValidBackupFilename(filename: string): boolean {
    return filename.endsWith('.sql.gz') && filename.length > 7;
  }

  /**
   * Extraer fecha del nombre de archivo de backup
   */
  extractDateFromFilename(filename: string): string | null {
    const dateMatch = filename.match(/(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})/);
    return dateMatch ? dateMatch[1] : null;
  }

  /**
   * Obtener estado de operación actual
   */
  getOperationStatus(): Observable<BackupOperationStatus> {
    return this.operationStatus$.asObservable();
  }

  /**
   * Limpiar estado de operación
   */
  clearOperationStatus(): void {
    this.setOperationStatus(null, false, null, false);
  }

  /**
   * Configurar backups automáticos (cron job)
   */
  setupAutomaticBackups(): Observable<ApiResponse> {
    this.setOperationStatus('setup', true, 'Configurando backups automáticos...');
    
    return this.http.post<ApiResponse>(`${this.API_URL}/setup-automatic`, {}, { 
      headers: this.getHeaders() 
    }).pipe(
      map((response: ApiResponse) => {
        this.setOperationStatus('setup', false, response.message, true);
        return response;
      }),
      catchError(error => this.handleError(error, 'configurar backups automáticos')),
      finalize(() => this.setOperationStatus(null, false))
    );
  }

  /**
   * Obtener logs de backups automáticos
   */
  getBackupLogs(lines: number = 50): Observable<BackupLogsResponse> {
    this.setOperationStatus('logs', true, 'Obteniendo logs...');
    
    return this.http.get<BackupLogsResponse>(`${this.API_URL}/logs?lines=${lines}`, { 
      headers: this.getHeaders() 
    }).pipe(
      map((response: BackupLogsResponse) => {
        this.setOperationStatus('logs', false, null, true);
        return response;
      }),
      catchError(error => this.handleError(error, 'obtener logs de backups')),
      finalize(() => this.setOperationStatus(null, false))
    );
  }

  /**
   * Limpiar entradas duplicadas del cron
   */
  cleanupCronDuplicates(): Observable<ApiResponse> {
    this.setOperationStatus('cleanup', true, 'Limpiando duplicados...');
    
    return this.http.post<ApiResponse>(`${this.API_URL}/cleanup-cron`, {}, { 
      headers: this.getHeaders() 
    }).pipe(
      map((response: ApiResponse) => {
        this.setOperationStatus('cleanup', false, response.message, true);
        return response;
      }),
      catchError(error => this.handleError(error, 'limpiar duplicados de cron')),
      finalize(() => this.setOperationStatus(null, false))
    );
  }
}