import { Component, OnInit } from '@angular/core';

interface FiscalDataStatus {
  isComplete: boolean;
  missingFields: string[];
  completionPercentage: number;
}

@Component({
  selector: 'app-fiscal-data-warning',
  template: `
    <div class="card card-flush h-100" *ngIf="!fiscalStatus.isComplete">
      <!-- Header -->
      <div class="card-header pt-5">
        <div class="card-title d-flex flex-column">
          <div class="d-flex align-items-center">
            <i class="fas fa-exclamation-triangle text-warning fs-2x me-3"></i>
            <span class="fs-2hx fw-bold text-dark me-2">{{ fiscalStatus.completionPercentage }}%</span>
          </div>
          <span class="text-gray-600 pt-1 fw-semibold fs-6">Datos Fiscales Completados</span>
        </div>
      </div>

      <!-- Body -->
      <div class="card-body pt-2 pb-4 d-flex flex-wrap align-items-center">
        <div class="d-flex flex-column content-justify-center flex-row-fluid">
          <!-- Progress Bar -->
          <div class="d-flex justify-content-between w-100 mt-auto mb-2">
            <span class="fw-semibold fs-6 text-gray-600">Progreso</span>
            <span class="fw-bold fs-6 text-gray-800">{{ fiscalStatus.completionPercentage }}%</span>
          </div>
          
          <div class="h-8px mx-3 w-100 bg-light-warning rounded">
            <div class="bg-warning rounded h-8px" 
                 [style.width.%]="fiscalStatus.completionPercentage"></div>
          </div>

          <!-- Warning Message -->
          <div class="alert alert-warning d-flex align-items-center mt-4 mb-2" role="alert">
            <i class="fas fa-exclamation-circle me-3"></i>
            <div>
              <strong>⚠️ Acción requerida antes del lanzamiento</strong><br>
              <span class="text-muted">Completa los datos fiscales para cumplimiento legal (LSSI, RGPD)</span>
            </div>
          </div>

          <!-- Missing Fields -->
          <div class="mt-3">
            <h6 class="fw-bold text-gray-800 mb-2">Campos pendientes ({{ fiscalStatus.missingFields.length }}):</h6>
            <div class="d-flex flex-wrap gap-2">
              <span *ngFor="let field of fiscalStatus.missingFields" 
                    class="badge badge-light-danger fs-7">
                {{ field }}
              </span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="d-flex mt-4 gap-2">
            <button (click)="validateFiscalData()" 
                    class="btn btn-sm btn-warning">
              <i class="fas fa-check-circle me-1"></i>
              Verificar Estado
            </button>
            <button (click)="openFiscalGuide()" 
                    class="btn btn-sm btn-light-warning">
              <i class="fas fa-book me-1"></i>
              Guía Configuración
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Success State -->
    <div class="card card-flush h-100 border-success" *ngIf="fiscalStatus.isComplete">
      <div class="card-header pt-5">
        <div class="card-title d-flex flex-column">
          <div class="d-flex align-items-center">
            <i class="fas fa-check-circle text-success fs-2x me-3"></i>
            <span class="fs-2hx fw-bold text-success me-2">100%</span>
          </div>
          <span class="text-gray-600 pt-1 fw-semibold fs-6">Datos Fiscales Completos</span>
        </div>
      </div>
      <div class="card-body pt-2 pb-4">
        <div class="alert alert-success d-flex align-items-center" role="alert">
          <i class="fas fa-check-circle me-3"></i>
          <div>
            <strong>✅ ¡Datos fiscales completos!</strong><br>
            <span class="text-muted">La plataforma cumple con los requisitos legales</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: []
})
export class FiscalDataWarningComponent implements OnInit {
  
  fiscalStatus: FiscalDataStatus = {
    isComplete: false,
    missingFields: [],
    completionPercentage: 0
  };

  ngOnInit(): void {
    this.loadFiscalDataStatus();
  }

  /**
   * Simula la carga del estado de los datos fiscales
   * En el futuro esto debería conectar con el CompanyInfoService del frontend
   */
  private loadFiscalDataStatus(): void {
    // TODO: Conectar con el servicio real de datos de empresa
    // Por ahora simulamos datos pendientes
    this.fiscalStatus = {
      isComplete: false,
      missingFields: [
        'NIF/CIF',
        'Dirección fiscal',
        'Ciudad',
        'Código postal',
        'Forma jurídica'
      ],
      completionPercentage: 0
    };
  }

  validateFiscalData(): void {
    // Simular validación
    console.log('🔍 Validando estado de datos fiscales...');
    
    // Aquí se ejecutaría el script de validación o una llamada al backend
    this.loadFiscalDataStatus();
    
    // Mostrar notificación
    this.showNotification(
      `Estado verificado: ${this.fiscalStatus.missingFields.length} campos pendientes`,
      'warning'
    );
  }

  openFiscalGuide(): void {
    console.log('📖 Abriendo guía de configuración fiscal...');
    
    // En el futuro podría abrir un modal o redirigir a documentación
    window.open('/docs/DATOS-FISCALES-CONFIGURACION.md', '_blank');
  }

  private showNotification(message: string, type: 'success' | 'warning' | 'error'): void {
    // Implementar notificación usando el sistema de toasts del admin
    console.log(`[${type.toUpperCase()}] ${message}`);
  }
}