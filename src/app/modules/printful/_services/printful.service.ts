import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { AuthService } from '../../auth';
import { finalize, timeout, retry, catchError } from 'rxjs/operators';
import { URL_SERVICIOS } from 'src/app/config/config';

@Injectable({
  providedIn: 'root'
})
export class PrintfulService {

  isLoading$: Observable<boolean>;
  isLoadingSubject: BehaviorSubject<boolean>;

  // Configuración de timeouts y retries
  private readonly SYNC_TIMEOUT = 300000; // 5 minutos
  private readonly MAX_RETRIES = 2; // Reintentar 2 veces

  constructor(
    private _http: HttpClient,
    public _authservice: AuthService,
  ) {
    this.isLoadingSubject = new BehaviorSubject<boolean>(false);
    this.isLoading$ = this.isLoadingSubject.asObservable();
  }

  /**
   * Sincroniza productos desde Printful
   * - Timeout de 5 minutos
   * - Reintentos automáticos (2 intentos)
   * - Manejo de errores robusto
   */
  synPrintfulProducts(): Observable<any> {
    this.isLoadingSubject.next(true);
    
    const headers = new HttpHeaders({
      'token': this._authservice.token
    });

    const url = `${URL_SERVICIOS}/products/synPrintfulProducts`;
    
    console.log('🔄 Iniciando petición de sincronización a:', url);

    return this._http.get(url, { headers }).pipe(
      timeout(this.SYNC_TIMEOUT), // Timeout de 5 minutos
      retry(this.MAX_RETRIES), // Reintentar 2 veces si falla
      catchError(error => {
        console.error('❌ Error en sincronización Printful:', error);
        
        // Manejar diferentes tipos de errores
        if (error.name === 'TimeoutError') {
          return throwError(() => ({
            message: 'La sincronización tardó demasiado tiempo. Por favor, intenta de nuevo.',
            error: error
          }));
        }
        
        if (error.status === 0) {
          return throwError(() => ({
            message: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
            error: error
          }));
        }
        
        if (error.status === 401 || error.status === 403) {
          return throwError(() => ({
            message: 'No tienes permisos para realizar esta acción. Inicia sesión nuevamente.',
            error: error
          }));
        }
        
        // Error genérico
        return throwError(() => error);
      }),
      finalize(() => {
        this.isLoadingSubject.next(false);
        console.log('🏁 Petición de sincronización finalizada');
      })
    );
  }

  /**
   * Sincroniza productos con progreso en tiempo real (SSE)
   */
  synPrintfulProductsStream(handlers: {
    onStart?: (payload: any) => void;
    onProgress?: (payload: any) => void;
    onComplete: (payload: any) => void;
    onError: (payload: any) => void;
  }): EventSource {
    this.isLoadingSubject.next(true);

    const token = encodeURIComponent(this._authservice.token || '');
    const url = `${URL_SERVICIOS}/products/synPrintfulProducts/stream?token=${token}`;

    console.log('🔄 Iniciando stream de sincronización a:', url);

    const eventSource = new EventSource(url);

    eventSource.addEventListener('start', (event: MessageEvent) => {
      const data = JSON.parse(event.data || '{}');
      handlers.onStart?.(data);
    });

    eventSource.addEventListener('progress', (event: MessageEvent) => {
      const data = JSON.parse(event.data || '{}');
      handlers.onProgress?.(data);
    });

    eventSource.addEventListener('complete', (event: MessageEvent) => {
      const data = JSON.parse(event.data || '{}');
      handlers.onComplete(data);
      this.isLoadingSubject.next(false);
      eventSource.close();
      console.log('🏁 Stream de sincronización finalizado');
    });

    eventSource.addEventListener('error', (event: any) => {
      let payload: any = {
        message: 'Error en el stream de sincronización'
      };

      if (event?.data) {
        try {
          payload = JSON.parse(event.data);
        } catch (parseError) {
          payload = { message: payload.message };
        }
      }

      handlers.onError(payload);
      this.isLoadingSubject.next(false);
      eventSource.close();
      console.error('❌ Error en stream de sincronización:', payload);
    });

    return eventSource;
  }

  /**
   * Obtiene las estadísticas del dashboard Printful
   * - KPIs (total productos, variantes, categorías, etc.)
   * - Distribución por categorías
   * - Análisis de precios
   * - Alertas del sistema
   * - Productos destacados (más caros/baratos)
   */
  getDashboardStats(): Observable<any> {
    this.isLoadingSubject.next(true);
    
    const headers = new HttpHeaders({
      'token': this._authservice.token
    });

    const url = `${URL_SERVICIOS}/printful/dashboard-stats`;
    
    console.log('📊 Obteniendo estadísticas del dashboard:', url);

    return this._http.get(url, { headers }).pipe(
      timeout(30000), // Timeout de 30 segundos
      catchError(error => {
        console.error('❌ Error al obtener estadísticas del dashboard:', error);
        return throwError(() => error);
      }),
      finalize(() => {
        this.isLoadingSubject.next(false);
      })
    );
  }
}
