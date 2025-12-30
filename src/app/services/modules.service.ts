import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { URL_SERVICIOS } from '../config/config';
import { AuthService } from '../modules/auth';

/**
 * Service: Modules
 * Gestión de módulos para sistema multi-producto (Levels-style)
 */

export interface Module {
  id: number;
  key: string;
  name: string;
  description: string;
  type: 'physical' | 'digital' | 'service' | 'integration';
  is_active: boolean;
  status: 'draft' | 'testing' | 'live' | 'archived';
  validation_days: number;
  validation_target_sales: number;
  launched_at: string | null;
  validated_at: string | null;
  archived_at: string | null;
  config: any;
  icon: string;
  color: string;
  base_price: number | null;
  currency: string;
  total_sales: number;
  total_revenue: number;
  total_orders: number;
  last_sale_at: string | null;
  created_at: string;
  updated_at: string;
  stats?: ModuleStats;
  validationStatus?: ValidationStatus;
}

export interface ModuleStats {
  totalProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: string;
}

export interface ValidationStatus {
  status: 'not_launched' | 'testing' | 'validated' | 'failed';
  daysSinceLaunch: number | null;
  daysRemaining: number | null;
  currentSales: number;
  targetSales: number;
  salesNeeded: number;
  isValidated: boolean;
  isExpired: boolean;
  validatedAt: string | null;
  message: string;
}

export interface ModulesSummary {
  total: number;
  active: number;
  validated: number;
  testing: number;
  archived: number;
  totalRevenue: string;
}

export interface ModuleResponse {
  success: boolean;
  module: Module;
  stats?: ModuleStats;
  validationStatus?: ValidationStatus;
  recentSales?: any[];
  message?: string;
}

export interface ModulesListResponse {
  success: boolean;
  modules: Module[];
  total: number;
}

export interface ModulesSummaryResponse {
  success: boolean;
  summary: ModulesSummary;
}

@Injectable({
  providedIn: 'root'
})
export class ModulesService {
  public url = URL_SERVICIOS;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Helper: Obtener headers con token de autenticación
   */
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'token': this.authService.token
    });
  }

  /**
   * Listar todos los módulos
   */
  listModules(): Observable<ModulesListResponse> {
    return this.http.get<ModulesListResponse>(`${this.url}/modules`, { headers: this.getHeaders() });
  }

  /**
   * Obtener detalles de un módulo específico
   */
  getModule(key: string): Observable<ModuleResponse> {
    return this.http.get<ModuleResponse>(`${this.url}/modules/${key}`, { headers: this.getHeaders() });
  }

  /**
   * Toggle activar/desactivar módulo
   */
  toggleModule(key: string): Observable<ModuleResponse> {
    return this.http.patch<ModuleResponse>(`${this.url}/modules/${key}/toggle`, {}, { headers: this.getHeaders() });
  }

  /**
   * Obtener estado de validación
   */
  getValidationStatus(key: string): Observable<{ success: boolean; validationStatus: ValidationStatus }> {
    return this.http.get<{ success: boolean; validationStatus: ValidationStatus }>(
      `${this.url}/modules/${key}/validation-status`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Archivar un módulo
   */
  archiveModule(key: string, reason?: string): Observable<ModuleResponse> {
    return this.http.post<ModuleResponse>(`${this.url}/modules/${key}/archive`, { reason }, { headers: this.getHeaders() });
  }

  /**
   * Marcar módulo como validado
   */
  markAsValidated(key: string): Observable<ModuleResponse> {
    return this.http.patch<ModuleResponse>(`${this.url}/modules/${key}/validate`, {}, { headers: this.getHeaders() });
  }

  /**
   * Obtener resumen general de módulos
   */
  getModulesSummary(): Observable<ModulesSummaryResponse> {
    return this.http.get<ModulesSummaryResponse>(`${this.url}/modules/stats/summary`, { headers: this.getHeaders() });
  }

  /**
   * Helpers
   */

  getStatusBadgeClass(status: string): string {
    const statusClasses = {
      'draft': 'badge-secondary',
      'testing': 'badge-warning',
      'live': 'badge-success',
      'archived': 'badge-dark'
    };
    return statusClasses[status] || 'badge-secondary';
  }

  getValidationStatusBadgeClass(status: string): string {
    const statusClasses = {
      'not_launched': 'badge-secondary',
      'testing': 'badge-warning',
      'validated': 'badge-success',
      'failed': 'badge-danger'
    };
    return statusClasses[status] || 'badge-secondary';
  }

  getTypeIcon(type: string): string {
    const typeIcons = {
      'physical': 'fa-box',
      'digital': 'fa-download',
      'service': 'fa-handshake',
      'integration': 'fa-plug'
    };
    return typeIcons[type] || 'fa-cube';
  }

  formatCurrency(amount: number | string): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(num || 0);
  }

  calculateProgress(current: number, target: number): number {
    if (target === 0) return 0;
    return Math.min(100, (current / target) * 100);
  }
}
