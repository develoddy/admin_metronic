/**
 * Modelo de Video Job - Product Video Express MVP
 * Representa un trabajo de generación de video con IA
 */

export interface VideoJob {
  id: string;
  user_id: number;
  product_image_url: string;
  animation_style: AnimationStyle;
  status: JobStatus;
  fal_request_id?: string;
  output_video_url?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export type AnimationStyle = 'zoom_in' | 'parallax' | 'subtle_float';

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * DTO para crear un nuevo video job
 */
export interface CreateVideoJobRequest {
  animation_style: AnimationStyle;
  product_image: File;
}

/**
 * Respuesta del backend para operaciones de video jobs
 */
export interface VideoJobResponse<T = any> {
  status: number;
  data?: T;
  message?: string;
}

/**
 * Estadísticas de usuario
 */
export interface UserVideoStats {
  total: number;
  completed: number;
  failed: number;
  processing: number;
  pending: number;
}

/**
 * Parámetros para listar jobs
 */
export interface ListJobsParams {
  status?: JobStatus;
  page?: number;
  limit?: number;
}

/**
 * Respuesta paginada de jobs
 */
export interface JobsListResponse {
  jobs: VideoJob[];
  total: number;
}

/**
 * Helper para labels de animación
 */
export const ANIMATION_STYLE_LABELS: Record<AnimationStyle, string> = {
  zoom_in: 'Zoom In (Acercamiento dramático)',
  parallax: 'Parallax (Efecto 3D suave)',
  subtle_float: 'Subtle Float (Flotación minimalista)'
};

/**
 * Helper para labels de estado
 */
export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  pending: 'Pendiente',
  processing: 'Procesando',
  completed: 'Completado',
  failed: 'Fallido'
};

/**
 * Helper para clases CSS según estado
 */
export const JOB_STATUS_CLASSES: Record<JobStatus, string> = {
  pending: 'badge-secondary',
  processing: 'badge-warning',
  completed: 'badge-success',
  failed: 'badge-danger'
};
