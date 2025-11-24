import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NewsletterCampaignsService, NewsletterStats } from '../services/newsletter-campaigns.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  stats: NewsletterStats | null = null;
  loading = false;
  error: string | null = null;

  constructor(
    private newsletterService: NewsletterCampaignsService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;
    this.error = null;

    this.newsletterService.getStats().subscribe({
      next: (data) => {
        console.log('✅ Newsletter stats loaded:', data);
        this.stats = data;
        this.loading = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        this.error = 'Error al cargar estadísticas. Verifica tu sesión.';
        this.loading = false;
        console.error('❌ Error loading stats:', err);
        
        // Si es error 401, redirigir a login
        if (err.status === 401 || err.status === 403) {
          this.error = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
        }
        this.cd.detectChanges();
      }
    });
  }

  getSourceKeys(): string[] {
    return this.stats?.by_source ? Object.keys(this.stats.by_source) : [];
  }

  getSourceCount(source: string): number {
    return this.stats?.by_source?.[source] || 0;
  }

  getRecentCampaigns(): any[] {
    return this.stats?.recent_campaigns || [];
  }
}
