import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { SaasTenantsService } from '../_services/saas-tenants.service';

interface DashboardMetrics {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  cancelledTenants: number;
  suspendedTenants: number;
  expiredTenants: number;
  mrr: number;
  conversionRate: number;
  churnRate: number;
  newTenantsThisMonth: number;
  expiringTrialsNext7Days: number;
}

@Component({
  selector: 'app-saas-dashboard',
  templateUrl: './saas-dashboard.component.html',
  styleUrls: ['./saas-dashboard.component.scss']
})
export class SaasDashboardComponent implements OnInit {
  isLoading = true;
  metrics: DashboardMetrics = {
    totalTenants: 0,
    activeTenants: 0,
    trialTenants: 0,
    cancelledTenants: 0,
    suspendedTenants: 0,
    expiredTenants: 0,
    mrr: 0,
    conversionRate: 0,
    churnRate: 0,
    newTenantsThisMonth: 0,
    expiringTrialsNext7Days: 0
  };

  recentTenants: any[] = [];
  expiringTrials: any[] = [];

  constructor(
    private tenantsService: SaasTenantsService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.cd.detectChanges();

    this.tenantsService.getTenants().subscribe({
      next: (response) => {
        if (response.success) {
          this.calculateMetrics(response.tenants);
          this.getRecentTenants(response.tenants);
          this.getExpiringTrials(response.tenants);
        }
        this.isLoading = false;
        this.cd.detectChanges();
      },
      error: (error) => {
        console.error('Error loading dashboard:', error);
        this.isLoading = false;
        this.cd.detectChanges();
      }
    });
  }

  calculateMetrics(tenants: any[]): void {
    this.metrics.totalTenants = tenants.length;
    
    // Contar por estado
    this.metrics.activeTenants = tenants.filter(t => t.status === 'active').length;
    this.metrics.trialTenants = tenants.filter(t => t.status === 'trial').length;
    this.metrics.cancelledTenants = tenants.filter(t => t.status === 'cancelled').length;
    this.metrics.suspendedTenants = tenants.filter(t => t.status === 'suspended').length;
    this.metrics.expiredTenants = tenants.filter(t => t.status === 'expired').length;

    // MRR - Monthly Recurring Revenue
    const planPrices = {
      'Starter': 29,
      'Professional': 79,
      'Enterprise': 199
    };
    
    this.metrics.mrr = tenants
      .filter(t => t.status === 'active')
      .reduce((sum, t) => sum + (planPrices[t.plan] || 0), 0);

    // Tasa de conversión (trial → active)
    const totalConverted = this.metrics.activeTenants + this.metrics.cancelledTenants;
    const totalTrialCompleted = totalConverted + this.metrics.expiredTenants;
    this.metrics.conversionRate = totalTrialCompleted > 0 
      ? (this.metrics.activeTenants / totalTrialCompleted) * 100 
      : 0;

    // Churn rate (cancelados / total activos alguna vez)
    const everActive = this.metrics.activeTenants + this.metrics.cancelledTenants;
    this.metrics.churnRate = everActive > 0 
      ? (this.metrics.cancelledTenants / everActive) * 100 
      : 0;

    // Nuevos tenants este mes
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    this.metrics.newTenantsThisMonth = tenants.filter(t => {
      const createdAt = new Date(t.createdAt || t.created_at);
      return createdAt >= firstDayOfMonth;
    }).length;

    // Trials expirando en 7 días
    const next7Days = new Date();
    next7Days.setDate(next7Days.getDate() + 7);
    this.metrics.expiringTrialsNext7Days = tenants.filter(t => {
      if (t.status !== 'trial' || !t.trial_ends_at) return false;
      const trialEnd = new Date(t.trial_ends_at);
      return trialEnd <= next7Days && trialEnd > now;
    }).length;
  }

  getRecentTenants(tenants: any[]): void {
    this.recentTenants = [...tenants]
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || a.created_at);
        const dateB = new Date(b.createdAt || b.created_at);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 5);
  }

  getExpiringTrials(tenants: any[]): void {
    const now = new Date();
    this.expiringTrials = tenants
      .filter(t => {
        if (t.status !== 'trial' || !t.trial_ends_at) return false;
        const trialEnd = new Date(t.trial_ends_at);
        return trialEnd > now;
      })
      .sort((a, b) => {
        const dateA = new Date(a.trial_ends_at);
        const dateB = new Date(b.trial_ends_at);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 5);
  }

  getStatusBadgeClass(status: string): string {
    const classes = {
      'trial': 'badge-warning',
      'active': 'badge-success',
      'cancelled': 'badge-danger',
      'expired': 'badge-secondary',
      'suspended': 'badge-dark'
    };
    return classes[status] || 'badge-secondary';
  }

  formatDate(date: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getDaysRemaining(trialEndsAt: string): number {
    if (!trialEndsAt) return 0;
    const now = new Date();
    const endDate = new Date(trialEndsAt);
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  refreshData(): void {
    this.loadDashboardData();
  }
}
