import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { PrelaunchCampaignsService, PrelaunchStats } from '../services/prelaunch-campaigns.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  stats: PrelaunchStats | null = null;
  loading = false;
  error: string | null = null;

  constructor(
    private prelaunchService: PrelaunchCampaignsService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;
    this.error = null;

    this.prelaunchService.getStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
        console.log('Stats loaded:', data);
        // Forzar detección de cambios
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error loading stats:', err);
        this.error = 'Error al cargar estadísticas. Por favor, intenta de nuevo.';
        this.loading = false;
        this.cd.detectChanges();
      }
    });
  }

  refresh(): void {
    this.loadStats();
  }
}
