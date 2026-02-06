import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { VideoExpressService } from '../_services/video-express.service';
import { 
  VideoJob, 
  JobStatus, 
  JOB_STATUS_LABELS, 
  JOB_STATUS_CLASSES,
  ANIMATION_STYLE_LABELS 
} from '../_models/video-job.model';
import { interval, Subscription } from 'rxjs';
import Swal from 'sweetalert2';

/**
 * Componente de lista completa de video jobs con filtros y acciones
 */
@Component({
  selector: 'app-jobs-list',
  templateUrl: './jobs-list.component.html',
  styleUrls: ['./jobs-list.component.scss']
})
export class JobsListComponent implements OnInit, OnDestroy {
  jobs: VideoJob[] = [];
  loading = true;
  error: string | null = null;
  
  // Filtros
  statusFilter: JobStatus | 'all' = 'all';
  
  // Helpers para templates
  statusLabels = JOB_STATUS_LABELS;
  statusClasses = JOB_STATUS_CLASSES;
  animationLabels = ANIMATION_STYLE_LABELS;
  
  private pollingSubscription?: Subscription;

  constructor(
    private videoExpressService: VideoExpressService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadJobs();
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  /**
   * Cargar lista de jobs
   */
  loadJobs(): void {
    this.loading = true;
    this.error = null;

    const params = this.statusFilter !== 'all' 
      ? { status: this.statusFilter as JobStatus } 
      : {};

    this.videoExpressService.listJobs(params).subscribe({
      next: (response) => {
        if (response.status === 200 && response.data) {
          this.jobs = response.data.jobs;
        }
        this.loading = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error loading jobs:', err);
        this.error = 'Error al cargar los trabajos';
        this.loading = false;
        this.cd.detectChanges();
      }
    });
  }

  /**
   * Cambiar filtro de estado
   */
  filterByStatus(status: JobStatus | 'all'): void {
    this.statusFilter = status;
    this.loadJobs();
  }

  /**
   * Iniciar polling cada 10 segundos para jobs en proceso
   */
  startPolling(): void {
    this.pollingSubscription = interval(10000).subscribe(() => {
      // Solo hacer polling si hay jobs en proceso
      const hasActiveJobs = this.jobs.some(job => 
        this.videoExpressService.isJobInProgress(job)
      );
      
      if (hasActiveJobs) {
        this.loadJobs();
      }
    });
  }

  /**
   * Detener polling
   */
  stopPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  /**
   * Descargar video completado
   */
  downloadVideo(job: VideoJob): void {
    if (job.status !== 'completed') {
      Swal.fire({
        icon: 'warning',
        title: 'Video no disponible',
        text: 'El video aún no está listo para descargar',
      });
      return;
    }

    const downloadUrl = this.videoExpressService.getDownloadUrl(job.id);
    window.open(downloadUrl, '_blank');
  }

  /**
   * Ver detalles del job (implementar modal o página de detalle en futuro)
   */
  viewJob(job: VideoJob): void {
    Swal.fire({
      title: 'Detalles del Job',
      html: `
        <div class="text-left">
          <p><strong>ID:</strong> ${job.id}</p>
          <p><strong>Estado:</strong> ${this.statusLabels[job.status]}</p>
          <p><strong>Estilo:</strong> ${this.animationLabels[job.animation_style]}</p>
          <p><strong>Creado:</strong> ${new Date(job.created_at).toLocaleString()}</p>
          ${job.error_message ? `<p class="text-danger"><strong>Error:</strong> ${job.error_message}</p>` : ''}
        </div>
      `,
      imageUrl: job.product_image_url,
      imageWidth: 300,
      imageHeight: 300,
      imageAlt: 'Product Image'
    });
  }

  /**
   * Eliminar job
   */
  deleteJob(job: VideoJob): void {
    Swal.fire({
      title: '¿Eliminar job?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.videoExpressService.deleteJob(job.id).subscribe({
          next: (response) => {
            if (response.status === 200) {
              Swal.fire('¡Eliminado!', 'El job ha sido eliminado', 'success');
              this.loadJobs();
              this.cd.detectChanges();
            }
          },
          error: (err) => {
            console.error('Error deleting job:', err);
            Swal.fire('Error', 'No se pudo eliminar el job', 'error');
          }
        });
      }
    });
  }

  /**
   * Crear nuevo video
   */
  createNewVideo(): void {
    this.router.navigate(['/video-express/create']);
  }

  /**
   * Verificar si hay jobs en proceso
   */
  hasActiveJobs(): boolean {
    return this.jobs.some(job => this.videoExpressService.isJobInProgress(job));
  }

  /**
   * Contar jobs por estado
   */
  getJobCountByStatus(status: JobStatus): number {
    return this.jobs.filter(job => job.status === status).length;
  }
}
