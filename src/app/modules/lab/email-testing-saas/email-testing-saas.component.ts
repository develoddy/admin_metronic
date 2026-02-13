/**
 * 🧪 SAAS EMAIL TESTING COMPONENT
 * Componente para probar emails del sistema de trials y suscripciones desde admin
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
      name: '🎉 Bienvenida Trial',
      description: 'Email enviado cuando un tenant inicia su trial'
    },
    {
      key: 'trial-expiring',
      name: '⏰ Trial por Expirar',
      description: 'Email enviado 3 días antes de que expire el trial'
    },
    {
      key: 'trial-expired',
      name: '❌ Trial Expirado',
      description: 'Email enviado cuando el trial ha expirado'
    },
    {
      key: 'payment-success',
      name: '💳 Pago Exitoso',
      description: 'Email enviado tras un pago exitoso'
    },
    {
      key: 'subscription-cancelled',
      name: '🚫 Suscripción Cancelada',
      description: 'Email enviado cuando se cancela la suscripción'
    },
    {
      key: 'access-lost',
      name: '🔒 Acceso Perdido',
      description: 'Email enviado cuando se pierde el acceso'
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
   * Cargar tenants disponibles
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
        console.error('❌ [EmailTestingSaasComponent] Error cargando tenants:', error);
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
   * Probar configuración SMTP
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
        this.smtpStatus = { success: false, message: 'Error al probar SMTP' };
        this.cd.detectChanges();
      }
    });
  }

  /**
   * Seleccionar tenant
   */
  selectTenant(tenant: Tenant): void {
    this.selectedTenant = tenant;
  }

  /**
   * Enviar email de prueba
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
        console.error('❌ Error enviando email:', error);
        
        const testResult: EmailTestResult = {
          success: false,
          message: error.error?.message || 'Error desconocido',
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
   * Ejecutar cron de notificaciones manualmente
   */
  runTrialNotificationsNow(): void {
    this.isTesting = true;
    
    this.emailTestingService.runTrialNotificationsNow().subscribe({
      next: (result) => {
        console.log('✅ Cron ejecutado:', result);
        alert('✅ Cron ejecutado correctamente. Revisa la consola para más detalles.');
        this.isTesting = false;
        this.cd.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error ejecutando cron:', error);
        alert('❌ Error ejecutando cron');
        this.isTesting = false;
        this.cd.detectChanges();
      }
    });
  }

  /**
   * Formatear fecha
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
   * Obtener badge de status
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
   * Limpiar resultados
   */
  clearResults(): void {
    this.lastTestResults = [];
  }

  /**
   * Recargar tenants
   */
  refreshTenants(): void {
    this.selectedTenant = null;
    this.loadTenants();
  }
}
