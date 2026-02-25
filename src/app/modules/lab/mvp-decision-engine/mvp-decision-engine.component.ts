import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { 
  MicroSaasAnalyticsService, 
  MicroSaasKPIs 
} from '../_services/micro-saas-analytics.service';

/**
 * MVP Decision Engine Component
 * 
 * Detailed view of a Module with decision engine for:
 * - Validate and activate (status = live)
 * - Archive (status = archived)
 * - Continue validation (status = testing)
 * 
 * Note: There's no longer "module conversion" - a Module with status=testing IS the MVP.
 * 
 * @author Claude (GitHub Copilot)
 * @date 2026-02-13
 */

@Component({
  selector: 'app-mvp-decision-engine',
  templateUrl: './mvp-decision-engine.component.html',
  styleUrls: ['./mvp-decision-engine.component.scss']
})
export class MvpDecisionEngineComponent implements OnInit {
  
  moduleKey: string = '';
  isLoading = false;
  error: string | null = null;
  
  // Data
  analytics: MicroSaasKPIs | null = null;
  
  // Period selector
  selectedPeriod: '7d' | '30d' | '90d' | 'all' = '30d';
  
  // Decision actions
  isExecutingDecision = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private analyticsService: MicroSaasAnalyticsService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.moduleKey = params['moduleKey'];
      if (this.moduleKey) {
        this.loadAnalytics();
      }
    });
  }

  /**
   * Load MVP analytics
   */
  loadAnalytics(): void {
    this.isLoading = true;
    this.error = null;
    
    this.analyticsService.getModuleAnalytics(this.moduleKey, this.selectedPeriod).subscribe({
      next: (response) => {
        if (response.success) {
          this.analytics = response.analytics;
        } else {
          this.error = 'No data found for this MVP';
        }
        this.isLoading = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error loading analytics:', err);
        this.error = 'Error loading MVP analytics';
        this.isLoading = false;
        this.cd.detectChanges();
      }
    });
  }

  /**
   * Change period
   */
  changePeriod(period: '7d' | '30d' | '90d' | 'all'): void {
    this.selectedPeriod = period;
    this.loadAnalytics();
  }

  /**
   * Execute decision: Validate and Activate (change status to live)
   */
  async createModule(): Promise<void> {
    const result = await Swal.fire({
      title: '✅ Validate & Activate Module',
      html: `
        <p class="mb-3">Are you sure you want to validate and activate <strong>${this.analytics?.moduleName}</strong>?</p>
        <p class="text-muted small">The module will change its status from "testing" to "live".</p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, activate module',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d'
    });

    if (!result.isConfirmed) return;

    this.isExecutingDecision = true;
    
    // Use executeDecision with action 'validate' to change status to 'live'
    this.analyticsService.executeDecision(
      this.moduleKey,
      'validate',
      'Module validated and activated from decision engine'
    ).subscribe({
      next: (response) => {
        if (response.success) {
          Swal.fire({
            icon: 'success',
            title: '✅ Module Activated',
            html: `
              <p>The module <strong>${this.analytics?.moduleName}</strong> has been activated successfully.</p>
              <p class="text-muted small">You can now configure it in module management.</p>
            `,
            confirmButtonText: 'View Module',
            showCancelButton: true,
            cancelButtonText: 'Continue here'
          }).then((result) => {
            if (result.isConfirmed) {
              // Navigate to module edit in lab/modules
              this.router.navigate(['/lab/modules/edit', this.moduleKey]);
            } else {
              this.loadAnalytics(); // Reload data
            }
          });
        }
        this.isExecutingDecision = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error validating module:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.error?.message || 'Error validating module'
        });
        this.isExecutingDecision = false;
        this.cd.detectChanges();
      }
    });
  }

  /**
   * Execute decision: Continue Validation
   */
  async continueValidation(): Promise<void> {
    const result = await Swal.fire({
      title: '⏸️ Continue Validation',
      html: `
        <p class="mb-3">MVP <strong>${this.analytics?.moduleName}</strong> will continue in validation phase.</p>
        <p class="text-muted small">Tracking data will continue to be collected to evaluate its performance.</p>
      `,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Continue',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#007bff'
    });

    if (!result.isConfirmed) return;

    this.isExecutingDecision = true;

    this.analyticsService.executeDecision(
      this.moduleKey, 
      'continue',
      'Manual decision: continue collecting data'
    ).subscribe({
      next: (response) => {
        if (response.success) {
          Swal.fire({
            icon: 'success',
            title: '✅ Decision Registered',
            text: 'MVP will continue in validation phase.',
            timer: 2000,
            showConfirmButton: false
          });
          this.loadAnalytics();
        }
        this.isExecutingDecision = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error executing decision:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error registering decision'
        });
        this.isExecutingDecision = false;
        this.cd.detectChanges();
      }
    });
  }

  /**
   * Execute decision: Archive MVP
   */
  async archiveMVP(): Promise<void> {
    const result = await Swal.fire({
      title: '🗄️ Archive MVP',
      html: `
        <p class="mb-3">Are you sure you want to archive <strong>${this.analytics?.moduleName}</strong>?</p>
        <p class="text-danger small">This action will mark the MVP as archived and it will stop appearing in the main dashboard.</p>
      `,
      icon: 'warning',
      input: 'textarea',
      inputLabel: 'Archive reason (optional)',
      inputPlaceholder: 'E.g.: Insufficient performance, product pivot...',
      showCancelButton: true,
      confirmButtonText: 'Yes, archive',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    });

    if (!result.isConfirmed) return;

    this.isExecutingDecision = true;

    this.analyticsService.executeDecision(
      this.moduleKey,
      'archive',
      result.value || 'Manually archived from decision engine'
    ).subscribe({
      next: (response) => {
        if (response.success) {
          Swal.fire({
            icon: 'success',
            title: '✅ MVP Archived',
            text: 'MVP has been archived successfully.',
            timer: 2000,
            showConfirmButton: false
          }).then(() => {
            this.router.navigate(['/lab/analytics']);
          });
        }
        this.isExecutingDecision = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error archiving MVP:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error archiving MVP'
        });
        this.isExecutingDecision = false;
        this.cd.detectChanges();
      }
    });
  }

  /**
   * Go back to list
   */
  goBack(): void {
    this.router.navigate(['/lab/analytics']);
  }

  /**
   * Utilities
   */
  getScoreClass(score: number): string {
    return this.analyticsService.getScoreColor(score);
  }

  getActionBadge(action: string): string {
    switch (action) {
      case 'validate':
        return 'badge-success';
      case 'continue':
        return 'badge-primary';
      case 'archive':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  }

  formatTrend(change: number): any {
    const sign = change > 0 ? '+' : '';
    const icon = change > 0 ? '📈' : change < 0 ? '📉' : '➖';
    const cssClass = change > 0 ? 'trend-up' : change < 0 ? 'trend-down' : 'trend-neutral';
    
    return {
      text: `${sign}${change}%`,
      class: cssClass,
      icon
    };
  }

  getRecommendationIcon(action: string): string {
    return this.analyticsService.getRecommendationIcon(action);
  }

  /**
   * Format rate with insufficient data context
   */
  formatRate(rate: number, context: 'conversion' | 'download' | 'retention' | 'feedback'): string {
    if (!this.analytics) return '0%';
    
    // If there's insufficient data and rate is 0, show N/A
    if (this.analytics.insufficient_data && rate === 0) {
      return 'N/A (low data)';
    }
    
    // If rate is 0 due to lack of base events, show context
    if (rate === 0) {
      switch (context) {
        case 'conversion':
          return this.analytics.wizard_starts === 0 ? 'N/A (no starts)' : '0%';
        case 'download':
          return this.analytics.wizard_completions === 0 ? 'N/A (no completions)' : '0%';
        case 'feedback':
          return this.analytics.total_feedback === 0 ? 'N/A (no feedback)' : '0%';
        case 'retention':
          return this.analytics.totalSessions === 0 ? 'N/A (no sessions)' : '0%';
      }
    }
    
    return `${rate}%`;
  }

  /**
   * 🆕 Check if this module can progress to next phase
   */
  canProgressToNextPhase(): boolean {
    if (!this.analytics) return false;
    
    const phaseMap: { [key: string]: string | null } = {
      'landing': 'wizard',
      'wizard': 'live',
      'live': null
    };
    
    const nextPhase = phaseMap[this.analytics.moduleType];
    return nextPhase !== null && nextPhase !== undefined;
  }

  /**
   * 🆕 Get next phase name
   */
  getNextPhaseName(): string {
    if (!this.analytics) return '';
    
    const phaseNames: { [key: string]: string } = {
      'landing': 'Wizard',
      'wizard': 'Live Product',
      'live': ''
    };
    
    return phaseNames[this.analytics.moduleType] || '';
  }

  /**
   * 🆕 Check if progression criteria is met (soft validation)
   */
  getProgressionValidation(): { canProgress: boolean; warnings: string[]; criteriaMet: boolean } {
    if (!this.analytics) {
      return { canProgress: false, warnings: ['No analytics data'], criteriaMet: false };
    }
    
    const warnings: string[] = [];
    let criteriaMet = true;
    
    if (this.analytics.moduleType === 'landing') {
      // Landing → Wizard criteria
      if (this.analytics.healthScore < 60) {
        warnings.push(`Health Score should be ≥ 60 (current: ${this.analytics.healthScore})`);
        criteriaMet = false;
      }
      if (this.analytics.totalSessions < 20) {
        warnings.push(`Need ≥ 20 sessions (current: ${this.analytics.totalSessions})`);
        criteriaMet = false;
      }
      if ((this.analytics.landing_metrics?.waitlist_signups || 0) < 10) {
        warnings.push(`Need ≥ 10 waitlist signups (current: ${this.analytics.landing_metrics?.waitlist_signups || 0})`);
        criteriaMet = false;
      }
    } else if (this.analytics.moduleType === 'wizard') {
      // Wizard → Live criteria
      if (this.analytics.healthScore < 70) {
        warnings.push(`Health Score should be ≥ 70 (current: ${this.analytics.healthScore})`);
        criteriaMet = false;
      }
      if (this.analytics.wizard_completions < 50) {
        warnings.push(`Need ≥ 50 completions (current: ${this.analytics.wizard_completions})`);
        criteriaMet = false;
      }
      if (this.analytics.conversion_rate < 40) {
        warnings.push(`Conversion rate should be ≥ 40% (current: ${this.analytics.conversion_rate}%)`);
        criteriaMet = false;
      }
    }
    
    return {
      canProgress: true, // Always allow, but show warnings
      warnings,
      criteriaMet
    };
  }

  /**
   * 🆕 Create next phase (wizard or live)
   */
  async createNextPhase(): Promise<void> {
    if (!this.analytics) return;
    
    const validation = this.getProgressionValidation();
    const nextPhaseName = this.getNextPhaseName();
    
    // Build warning message if criteria not met
    let warningHtml = '';
    if (!validation.criteriaMet) {
      warningHtml = `
        <div class="alert alert-warning" style="text-align: left; margin-bottom: 1rem;">
          <strong>⚠️ Recommended criteria not met:</strong>
          <ul style="margin-bottom: 0; margin-top: 0.5rem;">
            ${validation.warnings.map(w => `<li>${w}</li>`).join('')}
          </ul>
          <p style="margin-top: 0.5rem; margin-bottom: 0;">
            <strong>You can still proceed</strong>, but it's recommended to meet these criteria first.
          </p>
        </div>
      `;
    }
    
    const result = await Swal.fire({
      title: `Create ${nextPhaseName} Phase`,
      html: `
        ${warningHtml}
        <p style="margin-bottom: 1rem;">
          You're about to create a <strong>${nextPhaseName}</strong> phase for 
          <strong>${this.analytics.conceptName || this.analytics.moduleKey}</strong>.
        </p>
        <textarea 
          id="progression-reason" 
          class="swal2-input" 
          placeholder="Why are you progressing to ${nextPhaseName}? (e.g., '150 waitlist signups, pain validated')"
          style="height: 100px; width: 90%;"
        ></textarea>
      `,
      icon: validation.criteriaMet ? 'success' : 'warning',
      showCancelButton: true,
      confirmButtonText: `Create ${nextPhaseName}`,
      cancelButtonText: 'Cancel',
      confirmButtonColor: validation.criteriaMet ? '#28a745' : '#ffc107',
      preConfirm: () => {
        const reason = (document.getElementById('progression-reason') as HTMLTextAreaElement)?.value;
        if (!reason || reason.trim().length < 10) {
          Swal.showValidationMessage('Please provide a reason (at least 10 characters)');
          return false;
        }
        return reason;
      }
    });
    
    if (!result.isConfirmed) return;
    
    const reason = result.value as string;
    
    // Show loading
    Swal.fire({
      title: `Creating ${nextPhaseName}...`,
      text: 'Please wait',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    
    // Call API
    this.analyticsService.createNextPhase(
      this.analytics.moduleId || 0,
      reason
    ).subscribe({
      next: (response) => {
        Swal.fire({
          title: 'Success!',
          html: `
            <p><strong>${nextPhaseName}</strong> phase created successfully.</p>
            <p>Module key: <code>${response.module.key}</code></p>
            <p style="margin-top: 1rem;">
              <strong>Next steps:</strong>
            </p>
            <ul style="text-align: left; margin-left: 2rem;">
              ${response.next_steps.map((step: string) => `<li>${step}</li>`).join('')}
            </ul>
          `,
          icon: 'success',
          confirmButtonText: 'Go to new module',
          showCancelButton: true,
          cancelButtonText: 'Stay here'
        }).then((navResult) => {
          if (navResult.isConfirmed) {
            // Navigate to the new module
            this.router.navigate(['/lab/mvp-decision-engine', response.module.key]);
          } else {
            // Reload current analytics to show updated parent relationship
            this.loadAnalytics();
          }
        });
      },
      error: (error) => {
        console.error('Error creating next phase:', error);
        Swal.fire({
          title: 'Error',
          text: error.error?.error || 'Failed to create next phase. Please try again.',
          icon: 'error'
        });
      }
    });
  }
}
