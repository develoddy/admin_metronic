import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { URL_SERVICIOS } from '../../../config/config';
import { AuthService } from '../../auth';

/**
 * Micro-SaaS Analytics Service
 * 
 * Servicio para consultar analytics, KPIs y scores de MVPs de micro-SaaS.
 * Integra con el motor de decisiones del backend.
 * 
 * @author Claude (GitHub Copilot)
 * @date 2026-02-09
 */

// ==========================================
// INTERFACES
// ==========================================

export interface MicroSaasKPIs {
  moduleKey: string;
  moduleId?: number;         // Module ID for API calls
  moduleName: string;
  status: 'draft' | 'testing' | 'live' | 'archived';

  /** Validation stage — determines which KPI panel is rendered in the admin UI */
  moduleType: 'landing' | 'wizard' | 'live';

  /** Phase tracking fields */
  conceptName?: string;      // Base concept name (e.g., 'inbox-zero-prevention')
  phaseOrder?: number;       // 0=landing, 1=wizard, 2=live
  parentModuleId?: number;   // Parent module ID for phase progression

  // Métricas básicas
  totalSessions: number;
  uniqueUsers: number;
  wizard_starts: number;
  wizard_completions: number;
  downloads: number;
  returningUsers: number;
  
  // Feedback
  total_feedback: number;
  helpful_feedback: number;
  feedback_rate: number; // %
  helpful_rate: number; // %
  
  // Objetivos (específico video-express)
  organic_count: number;
  ads_count: number;
  
  // Tasas de conversión
  conversion_rate: number; // completions / starts
  download_rate: number; // downloads / completions
  retention_rate: number; // returning users / total sessions
  
  // === MONETIZATION METRICS (Nuevo: Feb 2026) ===
  monetization_intent_count: number; // clicks en "Upgrade to Pro"
  pro_email_submitted_count: number; // emails capturados
  pro_modal_dismissed_count: number; // usuarios que cerraron modal sin email
  preview_to_intent_rate: number; // % completions → intent
  intent_to_email_rate: number; // % intent → email (key metric: WTP)
  modal_dismissal_rate: number; // % abandonos
  
  // Score agregado (0-100)
  healthScore: number;
  
  // Flag de datos insuficientes
  insufficient_data?: boolean;

  // === LANDING METRICS (only populated when moduleType === 'landing') ===
  landing_metrics?: {
    demo_views: number;          // prevention_demo_viewed events
    engagement_clicks: number;   // metric_clicked events total
    engagement_rate: number;     // engagement_clicks / demo_views (%)
    waitlist_signups: number;    // waitlist_success events
    waitlist_conversion: number; // waitlist_signups / demo_views (%)
    top_pain_points: Array<{     // sorted by click count
      metric: string;
      clicks: number;
    }>;
  } | null;
  
  // Metadata para debug
  _meta?: {
    total_events: number;
    events_with_session_id: number;
    events_with_user_id: number;
    unique_identifiers: number;
  };
  
  // Recomendación automatizada
  recommendation: Recommendation;
  
  // Alertas
  alerts: Alert[];
  
  // Tendencias
  trends: Trends;
  
  // Criterios de acciones (nuevo)
  actionCriteria: ActionCriteria;
  
  // Período
  period: '7d' | '30d' | '90d' | 'all';
  date_from: string;
  date_to: string;
}

export interface Recommendation {
  action: 'validate' | 'continue' | 'archive';
  confidence: 'low' | 'medium' | 'high';
  reason: string;
  next_steps: string[];
}

export interface Alert {
  type: 'success' | 'warning' | 'danger' | 'info';
  title: string;
  message: string;
  action?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface Trends {
  sessions_change: number; // % cambio vs período anterior
  completions_change: number;
  downloads_change: number;
  trend_direction: 'up' | 'down';
}

export interface ActionCriteria {
  can_validate: boolean;
  can_archive: boolean;
  can_continue: boolean;
  validation_criteria: {
    sessions_min: boolean;
    completions_min: boolean;
    feedback_min: boolean;
    days_min: boolean;
    signal_positive: boolean;
  };
  archive_criteria: {
    sessions_min: boolean;
    signal_negative: boolean;
  };
  days_running: number;
  blocking_reasons: {
    validate: string[];
    archive: string[];
  };
}

export interface AllAnalyticsSummary {
  total_modules: number;
  avg_score: number;
  ready_to_promote: number;
  needs_improvement: number;
  to_archive: number;
}

export interface AllAnalyticsResponse {
  success: boolean;
  analytics: MicroSaasKPIs[];
  summary: AllAnalyticsSummary;
}

export interface SingleAnalyticsResponse {
  success: boolean;
  analytics: MicroSaasKPIs;
}

export interface TrendingResponse {
  success: boolean;
  trending: MicroSaasKPIs[];
  period: string;
}

export interface DecisionResponse {
  success: boolean;
  action: string;
  result: any;
  analytics: MicroSaasKPIs;
}

// ==========================================
// SERVICE
// ==========================================

@Injectable({
  providedIn: 'root'
})
export class MicroSaasAnalyticsService {
  private apiUrl = `${URL_SERVICIOS}/admin/saas/micro-saas`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Obtener analytics de todos los micro-SaaS
   * 
   * @param period - Período de análisis: '7d', '30d', '90d', 'all'
   * @returns Observable con analytics de todos los módulos
   */
  getAllAnalytics(period: '7d' | '30d' | '90d' | 'all' = '30d'): Observable<AllAnalyticsResponse> {
    const params = new HttpParams().set('period', period);
    const headers = this.getAuthHeaders();
    
    return this.http.get<AllAnalyticsResponse>(`${this.apiUrl}/analytics`, { 
      headers, 
      params 
    });
  }

  /**
   * Obtener analytics detallados de un micro-SaaS específico
   * 
   * @param moduleKey - Key del módulo (ej: 'video-express')
   * @param period - Período de análisis
   * @returns Observable con analytics del módulo
   */
  getModuleAnalytics(
    moduleKey: string, 
    period: '7d' | '30d' | '90d' | 'all' = '30d'
  ): Observable<SingleAnalyticsResponse> {
    const params = new HttpParams().set('period', period);
    const headers = this.getAuthHeaders();
    
    return this.http.get<SingleAnalyticsResponse>(
      `${this.apiUrl}/analytics/${moduleKey}`, 
      { headers, params }
    );
  }

  /**
   * Obtener MVPs con mejor performance (trending)
   * 
   * @returns Observable con top 5 MVPs por score
   */
  getTrendingMVPs(): Observable<TrendingResponse> {
    const headers = this.getAuthHeaders();
    return this.http.get<TrendingResponse>(`${this.apiUrl}/trending`, { headers });
  }

  /**
   * Ejecutar decisión sobre un Module
   * 
   * @param moduleKey - Key del módulo
   * @param action - Acción a ejecutar: 'validate' (live), 'continue' (testing), 'archive'
   * @param reason - Razón de la decisión (opcional)
   * @returns Observable con resultado de la decisión
   */
  executeDecision(
    moduleKey: string,
    action: 'validate' | 'continue' | 'archive',
    reason?: string
  ): Observable<DecisionResponse> {
    const headers = this.getAuthHeaders();
    const body = { action, reason };
    
    return this.http.post<DecisionResponse>(
      `${this.apiUrl}/${moduleKey}/decision`,
      body,
      { headers }
    );
  }

  /**
   * Headers con autenticación para endpoints de saas-admin
   * Usa Authorization: Bearer {token}
   */
  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.authService.token}`
    });
  }

  /**
   * Headers con autenticación para endpoints legacy de modules
   * Usa token: {token}
   */
  private getLegacyAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      'token': this.authService.token
    });
  }

  // ==========================================
  // UTILIDADES
  // ==========================================

  /**
   * Obtener color según health score
   */
  getScoreColor(score: number): string {
    if (score >= 70) return 'success';
    if (score >= 50) return 'warning';
    return 'danger';
  }

  /**
   * Obtener icono según recomendación
   */
  getRecommendationIcon(action: string): string {
    switch (action) {
      case 'validate':
        return '🚀';
      case 'continue':
        return '⏸️';
      case 'archive':
        return '🗄️';
      default:
        return '❓';
    }
  }

  /**
   * Obtener badge según action
   */
  getActionBadgeClass(action: string): string {
    switch (action) {
      case 'validate':
        return 'badge-success';
      case 'continue':
        return 'badge-warning';
      case 'archive':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  }

  /**
   * Formatear cambio (trend) con signo y color
   */
  formatTrendChange(change: number): { text: string; class: string; icon: string } {
    const sign = change > 0 ? '+' : '';
    const icon = change > 0 ? '📈' : change < 0 ? '📉' : '➖';
    const cssClass = change > 0 ? 'text-success' : change < 0 ? 'text-danger' : 'text-muted';
    
    return {
      text: `${sign}${change}%`,
      class: cssClass,
      icon
    };
  }

  /**
   * Obtener label del período
   */
  getPeriodLabel(period: string): string {
    const labels = {
      '7d': 'Últimos 7 días',
      '30d': 'Últimos 30 días',
      '90d': 'Últimos 90 días',
      'all': 'Todo el tiempo'
    };
    
    return labels[period] || labels['30d'];
  }

  /**
   * 🆕 Create Next Phase for MVP progression
   * Creates wizard from landing or live from wizard
   */
  createNextPhase(parentModuleId: number, reason: string, nameOverride?: string): Observable<any> {
    const url = `${URL_SERVICIOS}/modules/create-next-phase`;
    const headers = this.getLegacyAuthHeaders();
    
    return this.http.post(url, {
      parent_module_id: parentModuleId,
      reason: reason,
      name_override: nameOverride
    }, { headers });
  }

  /**
   * 🆕 Get all phases for a concept
   * Returns landing, wizard, and live phases for a concept
   */
  getConceptPhases(conceptName: string): Observable<any> {
    const url = `${URL_SERVICIOS}/modules/concepts/${conceptName}/phases`;
    const headers = this.getLegacyAuthHeaders();
    
    return this.http.get(url, { headers });
  }
}
