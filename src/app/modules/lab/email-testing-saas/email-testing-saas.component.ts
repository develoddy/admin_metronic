/**
 * 🧪 SAAS EMAIL TESTING COMPONENT
 * Component to test emails for trial and subscription system from admin
 */

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { SaasEmailTestingService } from '../_services/saas-email-testing.service';

interface Tenant {
  id: number;
  name: string;
  email: string;
  module_key: string;
  plan: string;
  trial_ends_at: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  status: string;
  created_at: string;
}

interface EmailTestResult {
  success: boolean;
  message: string;
  tenantId?: number;
  emailType?: string;
  timestamp?: string;
}

@Component({
  selector: 'app-email-testing-saas',
  templateUrl: './email-testing-saas.component.html',
  styleUrls: ['./email-testing-saas.component.scss']
})
export class EmailTestingSaasComponent implements OnInit {

  // Estados de carga
  isLoading = false;
  isLoadingTenants = false;
  isTesting = false;
  
  // Datos
  availableTenants: Tenant[] = [];
  selectedTenant: Tenant | null = null;
  
  // Resultados de testing
  lastTestResults: EmailTestResult[] = [];
  
  // SMTP Status
  smtpStatus: any = null;
  
  // Tipos de email disponibles
  emailTypes = [
    {
      key: 'trial-welcome',
      name: '🎉 Trial Welcome',
      description: 'Email sent when a tenant starts their trial'
    },
    {
      key: 'trial-expiring',
      name: '⏰ Trial Expiring',
      description: 'Email sent 3 days before trial expires'
    },
    {
      key: 'trial-expired',
      name: '❌ Trial Expired',
      description: 'Email sent when trial has expired'
    },
    {
      key: 'payment-success',
      name: '💳 Payment Successful',
      description: 'Email sent after successful payment'
    },
    {
      key: 'subscription-cancelled',
      name: '🚫 Subscription Cancelled',
      description: 'Email sent when subscription is cancelled'
    },
    {
      key: 'access-lost',
      name: '🔒 Access Lost',
      description: 'Email sent when access is lost'
    }
  ];

  constructor(
    private emailTestingService: SaasEmailTestingService,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    console.log('🧪 [EmailTestingSaasComponent] ngOnInit called');
    console.log('🧪 [EmailTestingSaasComponent] Service:', this.emailTestingService);
    this.loadTenants();
    this.testSMTPConfiguration();
  }

  /**
   * Load available tenants
   */
  loadTenants(): void {
    console.log('🧪 [EmailTestingSaasComponent] loadTenants() called');
    this.isLoadingTenants = true;
    this.cd.detectChanges();
    
    this.emailTestingService.getTenants().subscribe({
      next: (response) => {
        console.log('🧪 [EmailTestingSaasComponent] Response:', response);
        if (response && response.success) {
          this.availableTenants = response.tenants || [];
          console.log('🧪 [EmailTestingSaasComponent] Tenants loaded:', this.availableTenants.length);
        }
        this.cd.detectChanges();
      },
      error: (error) => {
        console.error('❌ [EmailTestingSaasComponent] Error loading tenants:', error);
        this.isLoadingTenants = false;
        this.cd.detectChanges();
      },
      complete: () => {
        console.log('🧪 [EmailTestingSaasComponent] Loading complete');
        this.isLoadingTenants = false;
        this.cd.detectChanges();
      }
    });
  }

  /**
   * Test SMTP configuration
   */
  testSMTPConfiguration(): void {
    console.log('🧪 [EmailTestingSaasComponent] testSMTPConfiguration() called');
    this.emailTestingService.testSMTPConfiguration().subscribe({
      next: (result) => {
        console.log('🧪 [EmailTestingSaasComponent] SMTP result:', result);
        this.smtpStatus = result;
        this.cd.detectChanges();
      },
      error: (error) => {
        console.error('❌ [EmailTestingSaasComponent] Error testing SMTP:', error);
        this.smtpStatus = { success: false, message: 'Error testing SMTP' };
        this.cd.detectChanges();
      }
    });
  }

  /**
   * Select tenant
   */
  selectTenant(tenant: Tenant): void {
    this.selectedTenant = tenant;
  }

  /**
   * Send test email
   */
  sendTestEmail(emailType: string): void {
    if (!this.selectedTenant) {
      return;
    }

    this.isLoading = true;

    let apiCall$;

    switch (emailType) {
      case 'trial-welcome':
        apiCall$ = this.emailTestingService.sendTrialWelcomeEmail(this.selectedTenant.id);
        break;
      case 'trial-expiring':
        apiCall$ = this.emailTestingService.sendTrialExpiringEmail(this.selectedTenant.id);
        break;
      case 'trial-expired':
        apiCall$ = this.emailTestingService.sendTrialExpiredEmail(this.selectedTenant.id);
        break;
      case 'payment-success':
        apiCall$ = this.emailTestingService.sendPaymentSuccessEmail(this.selectedTenant.id);
        break;
      case 'subscription-cancelled':
        apiCall$ = this.emailTestingService.sendSubscriptionCancelledEmail(this.selectedTenant.id);
        break;
      case 'access-lost':
        apiCall$ = this.emailTestingService.sendAccessLostEmail(this.selectedTenant.id);
        break;
      default:
        this.isLoading = false;
        return;
    }

    apiCall$.subscribe({
      next: (result) => {
        const testResult: EmailTestResult = {
          success: result.success,
          message: result.message,
          tenantId: this.selectedTenant!.id,
          emailType: emailType,
          timestamp: new Date().toISOString()
        };
        
        this.lastTestResults.unshift(testResult);
        
        if (this.lastTestResults.length > 10) {
          this.lastTestResults = this.lastTestResults.slice(0, 10);
        }
        
        this.cd.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error sending email:', error);
        
        const testResult: EmailTestResult = {
          success: false,
          message: error.error?.message || 'Unknown error',
          tenantId: this.selectedTenant!.id,
          emailType: emailType,
          timestamp: new Date().toISOString()
        };
        
        this.lastTestResults.unshift(testResult);
        this.isLoading = false;
        this.cd.detectChanges();
      },
      complete: () => {
        this.isLoading = false;
        this.cd.detectChanges();
      }
    });
  }

  /**
   * Run trial notifications cron manually
   */
  runTrialNotificationsNow(): void {
    this.isTesting = true;
    
    this.emailTestingService.runTrialNotificationsNow().subscribe({
      next: (result) => {
        console.log('✅ Cron executed:', result);
        alert('✅ Cron executed successfully. Check console for more details.');
        this.isTesting = false;
        this.cd.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error executing cron:', error);
        alert('❌ Error executing cron');
        this.isTesting = false;
        this.cd.detectChanges();
      }
    });
  }

  /**
   * Format date
   */
  formatDate(dateString: string | null): string {
    if (!dateString) return 'N/A';
    
    return new Date(dateString).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Get status badge
   */
  getStatusBadge(tenant: Tenant): string {
    if (tenant.plan === 'trial' || tenant.status === 'trial') {
      return 'trial';
    } else if (tenant.stripe_subscription_id || tenant.status === 'active') {
      return 'active';
    } else {
      return 'inactive';
    }
  }

  /**
   * Clear results
   */
  clearResults(): void {
    this.lastTestResults = [];
  }

  /**
   * Reload tenants
   */
  refreshTenants(): void {
    this.selectedTenant = null;
    this.loadTenants();
  }
}
