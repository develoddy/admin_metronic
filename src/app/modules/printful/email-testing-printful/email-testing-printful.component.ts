/**
 * 🧪 EMAIL TESTING COMPONENT
 * Componente para probar templates de email desde el admin panel
 * Integrado en módulo Printful sin afectar funcionalidad existente
 */

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { EmailTestingService } from '../_services/email-testing.service';

interface Sale {
  saleId: number;
  transaction: string;
  total: string;
  country: string;
  locale: string;
  customer: string;
  email: string;
  createdAt: string;
  printfulId?: number;
}

interface EmailTestResult {
  success: boolean;
  message: string;
  saleId: number;
  country: string;
  locale: string;
  emailSent: boolean;
  recipient: string;
  trackingNumber?: string;
  deliveredDate?: string;
}

@Component({
  selector: 'app-email-testing-printful',
  templateUrl: './email-testing-printful.component.html',
  styleUrls: ['./email-testing-printful.component.scss']
})
export class EmailTestingPrintfulComponent implements OnInit {

  // Estados de carga
  isLoading = false;
  isLoadingSales = false;
  
  // Datos
  availableSales: Sale[] = [];
  selectedSale: Sale | null = null;
  testEmail = '';
  
  // Resultados de testing
  lastTestResults: EmailTestResult[] = [];
  
  // Tiempo actual para mostrar en historial
  currentTime = new Date();
  
  // Tipos de email disponibles
  emailTypes = [
    {
      key: 'printing',
      name: '🎨 Email de Impresión',
      description: 'Email enviado cuando Printful recibe la orden'
    },
    {
      key: 'shipped',
      name: '📦 Email de Envío', 
      description: 'Email enviado cuando Printful envía el paquete'
    },
    {
      key: 'delivered',
      name: '✅ Email de Entrega',
      description: 'Email enviado cuando el paquete es entregado'
    }
  ];

  constructor(
    private emailTestingService: EmailTestingService,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadAvailableSales();
  }

  /**
   * Cargar ventas disponibles para testing
   */
  loadAvailableSales(): void {
    console.log('🧪 [Email Testing] Iniciando carga de ventas...');
    this.isLoadingSales = true;
    this.cd.detectChanges();
    
    this.emailTestingService.getAvailableSales().subscribe({
      next: (response) => {
        console.log('🧪 [Email Testing] Respuesta recibida:', response);
        if (response && response.success) {
          this.availableSales = response.sales || [];
          console.log('🧪 [Email Testing] Ventas cargadas:', this.availableSales.length);
        } else {
          console.warn('🧪 [Email Testing] Respuesta sin éxito:', response);
          this.availableSales = [];
        }
        this.cd.detectChanges();
      },
      error: (error) => {
        console.error('🧪 [Email Testing] Error cargando ventas:', error);
        this.isLoadingSales = false;
        this.availableSales = [];
        this.cd.detectChanges();
        // Aquí puedes mostrar un toast de error
      },
      complete: () => {
        this.isLoadingSales = false;
        this.cd.detectChanges();
        console.log('🧪 [Email Testing] Carga completada');
      }
    });
  }

  /**
   * Seleccionar una venta para testing
   */
  selectSale(sale: Sale): void {
    this.selectedSale = sale;
    if (!this.testEmail) {
      this.testEmail = sale.email; // Pre-rellenar con el email de la venta
    }
  }

  /**
   * Enviar email de prueba
   */
  sendTestEmail(emailType: string): void {
    if (!this.selectedSale || !this.testEmail) {
      // Mostrar mensaje de error
      return;
    }

    this.isLoading = true;

    this.emailTestingService.sendTestEmail(emailType, {
      saleId: this.selectedSale.saleId,
      testEmail: this.testEmail
    }).subscribe({
      next: (result: EmailTestResult) => {
        this.currentTime = new Date(); // Actualizar tiempo actual
        this.lastTestResults.unshift(result); // Agregar al inicio
        
        // Mantener solo los últimos 10 resultados
        if (this.lastTestResults.length > 10) {
          this.lastTestResults = this.lastTestResults.slice(0, 10);
        }
        
        // Mostrar toast de éxito o error
        if (result.success) {
          this.showSuccessToast(`✅ Email ${emailType} enviado correctamente`);
        } else {
          this.showErrorToast(`❌ Error: ${result.message}`);
        }
        this.cd.detectChanges();
      },
      error: (error) => {
        console.error('Error enviando email:', error);
        this.showErrorToast('Error enviando email de prueba');
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
   * Formatear fecha para mostrar
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Obtener flag de país
   */
  getCountryFlag(country: string): string {
    const flags: { [key: string]: string } = {
      'es': '🇪🇸',
      'fr': '🇫🇷', 
      'de': '🇩🇪',
      'it': '🇮🇹'
    };
    return flags[country] || '🌍';
  }

  /**
   * Limpiar resultados
   */
  clearResults(): void {
    this.lastTestResults = [];
  }

  /**
   * Mostrar toast de éxito (implementar según tu sistema de notificaciones)
   */
  private showSuccessToast(message: string): void {
    // Implementar según tu sistema de toasts/notificaciones
    console.log('✅', message);
  }

  /**
   * Mostrar toast de error (implementar según tu sistema de notificaciones)  
   */
  private showErrorToast(message: string): void {
    // Implementar según tu sistema de toasts/notificaciones
    console.error('❌', message);
  }

  /**
   * Recargar ventas
   */
  refreshSales(): void {
    this.selectedSale = null;
    this.loadAvailableSales();
  }
}