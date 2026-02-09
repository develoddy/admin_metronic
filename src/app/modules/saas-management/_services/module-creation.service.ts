import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { URL_SERVICIOS } from '../../../config/config';

/**
 * Module Creation Service
 * 
 * Servicio para crear módulos formales desde MVPs validados.
 * Integra Gestión SaaS con Gestión de Módulos.
 * 
 * @author Claude (GitHub Copilot)
 * @date 2026-02-09
 */

// ==========================================
// INTERFACES
// ==========================================

export interface CreateModuleFromMVPRequest {
  auto_activate?: boolean;
  copy_preview_config?: boolean;
  initial_status?: 'draft' | 'testing' | 'live';
}

export interface CreateModuleFromMVPResponse {
  success: boolean;
  module: any;
  analytics: any;
  message: string;
  next_steps: string[];
}

// ==========================================
// SERVICE
// ==========================================

@Injectable({
  providedIn: 'root'
})
export class ModuleCreationService {
  private apiUrl = `${URL_SERVICIOS}/admin/saas/micro-saas`;

  constructor(private http: HttpClient) {}

  /**
   * Crear módulo formal desde MVP validado
   * 
   * @param moduleKey - Key del MVP (ej: 'video-express')
   * @param options - Opciones de creación
   * @returns Observable con el módulo creado y próximos pasos
   */
  createModuleFromMVP(
    moduleKey: string,
    options: CreateModuleFromMVPRequest = {}
  ): Observable<CreateModuleFromMVPResponse> {
    const headers = this.getAuthHeaders();
    
    const body: CreateModuleFromMVPRequest = {
      auto_activate: options.auto_activate || false,
      copy_preview_config: options.copy_preview_config !== false, // true por defecto
      initial_status: options.initial_status || 'testing'
    };
    
    return this.http.post<CreateModuleFromMVPResponse>(
      `${this.apiUrl}/${moduleKey}/create-module`,
      body,
      { headers }
    );
  }

  /**
   * Obtener URL para editar módulo en Gestión de Módulos
   * 
   * @param moduleKey - Key del módulo
   * @returns URL relativa para routing
   */
  getModuleEditUrl(moduleKey: string): string {
    return `/modules-management/edit/${moduleKey}`;
  }

  /**
   * Verificar si un MVP ya tiene módulo creado
   * 
   * @param moduleKey - Key del MVP
   * @returns Observable<boolean> indicando si existe
   */
  checkModuleExists(moduleKey: string): Observable<{ exists: boolean; module?: any }> {
    const headers = this.getAuthHeaders();
    
    // Usar endpoint de modules para verificar
    return this.http.get<{ exists: boolean; module?: any }>(
      `${URL_SERVICIOS}/modules/${moduleKey}`,
      { headers }
    );
  }

  /**
   * Headers con autenticación
   */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    });
  }
}
