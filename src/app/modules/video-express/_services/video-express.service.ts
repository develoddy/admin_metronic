import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { URL_SERVICIOS } from '../../../config/config';
import { AuthService } from '../../auth/_services/auth.service';
import {
  VideoJob,
  VideoJobResponse,
  UserVideoStats,
  ListJobsParams,
  JobsListResponse,
  AnimationStyle
} from '../_models/video-job.model';

/**
 * Servicio para gestionar Product Video Express
 * Comunicación con backend API /api/video-express
 */
@Injectable({
  providedIn: 'root'
})
export class VideoExpressService {
  private baseUrl = `${URL_SERVICIOS}/video-express`;

  constructor(
    private http: HttpClient,
    private _auth: AuthService
  ) {}

  /**
   * Genera headers con token de autenticación
   */
  private getAuthHeaders() {
    const headers = new HttpHeaders({ 'token': this._auth.token || '' });
    return { headers };
  }

  /**
   * Obtener estadísticas del usuario actual
   */
  getStats(): Observable<VideoJobResponse<UserVideoStats>> {
    return this.http.get<VideoJobResponse<UserVideoStats>>(
      `${this.baseUrl}/stats`,
      { ...this.getAuthHeaders() }
    );
  }

  /**
   * Listar jobs del usuario con filtros opcionales
   */
  listJobs(params?: ListJobsParams): Observable<VideoJobResponse<JobsListResponse>> {
    let httpParams = new HttpParams();
    
    if (params?.status) {
      httpParams = httpParams.set('status', params.status);
    }
    if (params?.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }

    return this.http.get<VideoJobResponse<JobsListResponse>>(
      `${this.baseUrl}/jobs`,
      { ...this.getAuthHeaders(), params: httpParams }
    );
  }

  /**
   * Obtener detalles de un job específico
   */
  getJob(jobId: string): Observable<VideoJobResponse<VideoJob>> {
    return this.http.get<VideoJobResponse<VideoJob>>(
      `${this.baseUrl}/jobs/${jobId}`,
      { ...this.getAuthHeaders() }
    );
  }

  /**
   * Crear nuevo video job (upload de imagen)
   */
  createJob(productImage: File, animationStyle: AnimationStyle): Observable<VideoJobResponse<VideoJob>> {
    const formData = new FormData();
    formData.append('product_image', productImage);
    formData.append('animation_style', animationStyle);

    // HttpClient maneja automáticamente multipart/form-data con FormData
    // No incluir Content-Type, el navegador lo setea automáticamente con boundary
    const headers = new HttpHeaders({
      'token': this._auth.token || ''
    });

    return this.http.post<VideoJobResponse<VideoJob>>(
      `${this.baseUrl}/jobs`,
      formData,
      { headers }
    );
  }

  /**
   * Eliminar un job
   */
  deleteJob(jobId: string): Observable<VideoJobResponse> {
    return this.http.delete<VideoJobResponse>(
      `${this.baseUrl}/jobs/${jobId}`,
      { ...this.getAuthHeaders() }
    );
  }

  /**
   * Descargar video completado
   * Retorna la URL para descarga directa
   */
  getDownloadUrl(jobId: string): string {
    return `${this.baseUrl}/download/${jobId}?token=${this._auth.token}`;
  }

  /**
   * Polling helper: verificar si un job está en progreso
   */
  isJobInProgress(job: VideoJob): boolean {
    return job.status === 'pending' || job.status === 'processing';
  }

  /**
   * Polling helper: verificar si un job está finalizado
   */
  isJobFinished(job: VideoJob): boolean {
    return job.status === 'completed' || job.status === 'failed';
  }
}
