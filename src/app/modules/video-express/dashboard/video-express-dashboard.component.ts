import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { VideoExpressService } from '../_services/video-express.service';
import { UserVideoStats, VideoJob } from '../_models/video-job.model';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

/**
 * Dashboard principal de Product Video Express
 * Muestra estadísticas y jobs recientes
 */
@Component({
  selector: 'app-video-express-dashboard',
  templateUrl: './video-express-dashboard.component.html',
  styleUrls: ['./video-express-dashboard.component.scss']
})
export class VideoExpressDashboardComponent implements OnInit, OnDestroy {
  stats: UserVideoStats | null = null;
  recentJobs: VideoJob[] = [];
  loading = true;
  error: string | null = null;
  
  private pollingSubscription?: Subscription;

  constructor(
    private videoExpressService: VideoExpressService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  /**
   * Cargar datos del dashboard
   */
  loadDashboardData(): void {
    this.loading = true;
    this.error = null;

    // Cargar estadísticas
    this.videoExpressService.getStats().subscribe({
      next: (response) => {
        if (response.status === 200 && response.data) {
          this.stats = response.data;
          this.cd.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error loading stats:', err);
        this.error = 'Error al cargar estadísticas';
        this.cd.detectChanges();
      }
    });

    // Cargar jobs recientes (últimos 5)
    this.videoExpressService.listJobs({ limit: 5 }).subscribe({
      next: (response) => {
        if (response.status === 200 && response.data) {
          this.recentJobs = response.data.jobs;
        }
        this.loading = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error loading jobs:', err);
        this.error = 'Error al cargar trabajos recientes';
        this.loading = false;
        this.cd.detectChanges();
      }
    });
  }

  /**
   * Iniciar polling cada 10 segundos para actualizar datos
   */
  startPolling(): void {
    this.pollingSubscription = interval(10000)
      .pipe(
        switchMap(() => this.videoExpressService.getStats())
      )
      .subscribe({
        next: (response) => {
          if (response.status === 200 && response.data) {
            this.stats = response.data;
            this.cd.detectChanges();
          }
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
   * Navegar a crear nuevo video
   */
  createNewVideo(): void {
    this.router.navigate(['/video-express/create']);
  }

  /**
   * Navegar a lista completa de jobs
   */
  viewAllJobs(): void {
    this.router.navigate(['/video-express/jobs']);
  }

  /**
   * Ver detalles de un job
   */
  viewJob(jobId: string): void {
    this.router.navigate(['/video-express/jobs', jobId]);
  }

  /**
   * Calcular porcentaje de éxito
   */
  getSuccessRate(): number {
    if (!this.stats || this.stats.total === 0) return 0;
    return Math.round((this.stats.completed / this.stats.total) * 100);
  }

  /**
   * Verificar si hay jobs en proceso
   */
  hasActiveJobs(): boolean {
    return !!(this.stats && (this.stats.processing > 0 || this.stats.pending > 0));
  }
}
