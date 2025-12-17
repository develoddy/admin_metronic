import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { URL_SERVICIOS, URL_BACKEND } from '../config/config';
import { AuthService } from '../modules/auth';

export interface SeoConfig {
  id?: number;
  robotsTxtContent?: string;
  robotsRules?: {
    userAgents: Array<{
      agent: string;
      allow: string[];
      disallow: string[];
    }>;
    sitemap: string;
  };
  sitemapBaseUrl: string;
  sitemapIncludeProducts: boolean;
  sitemapIncludeCategories: boolean;
  sitemapProductChangefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  sitemapProductPriority: number;
  googleSearchConsoleEnabled: boolean;
  googleSearchConsoleApiKey?: string;
  googleSearchConsoleSiteUrl?: string;
  lastSitemapGeneration?: Date;
  lastRobotsTxtUpdate?: Date;
  lastGoogleNotification?: Date;
  version?: number;
}

export interface SitemapUrl {
  id?: number;
  loc: string;
  lastmod?: Date;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
  type: 'static' | 'product' | 'category' | 'custom';
  enabled: boolean;
  metadata?: any;
}

export interface SitemapStats {
  total: number;
  byType: {
    static: number;
    product: number;
    category: number;
    custom: number;
  };
  disabled: number;
  lastGeneration: Date | null;
  lastRobotsUpdate: Date | null;
  lastGoogleNotification: Date | null;
}

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private apiUrl = URL_SERVICIOS;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Get HTTP headers with auth token
   */
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({ 'token': this.authService.token });
  }

  // ==========================================
  // CONFIGURACIÓN SEO
  // ==========================================

  getConfig(): Observable<{ success: boolean; config: SeoConfig }> {
    return this.http.get<{ success: boolean; config: SeoConfig }>(
      `${this.apiUrl}/admin/seo/config`,
      { headers: this.getHeaders() }
    );
  }

  updateConfig(config: Partial<SeoConfig>): Observable<{ success: boolean; message: string; config: SeoConfig }> {
    return this.http.put<{ success: boolean; message: string; config: SeoConfig }>(
      `${this.apiUrl}/admin/seo/config`,
      config,
      { headers: this.getHeaders() }
    );
  }

  // ==========================================
  // SITEMAP URLS
  // ==========================================

  listSitemapUrls(params: {
    page?: number;
    limit?: number;
    type?: string;
    enabled?: boolean;
  } = {}): Observable<{
    success: boolean;
    total: number;
    page: number;
    pages: number;
    urls: SitemapUrl[];
  }> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.type) queryParams.append('type', params.type);
    if (params.enabled !== undefined) queryParams.append('enabled', params.enabled.toString());

    return this.http.get<{
      success: boolean;
      total: number;
      page: number;
      pages: number;
      urls: SitemapUrl[];
    }>(
      `${this.apiUrl}/admin/seo/sitemap-urls?${queryParams.toString()}`,
      { headers: this.getHeaders() }
    );
  }

  addSitemapUrl(url: Partial<SitemapUrl>): Observable<{ success: boolean; message: string; url: SitemapUrl }> {
    return this.http.post<{ success: boolean; message: string; url: SitemapUrl }>(
      `${this.apiUrl}/admin/seo/sitemap-urls`,
      url,
      { headers: this.getHeaders() }
    );
  }

  updateSitemapUrl(id: number, url: Partial<SitemapUrl>): Observable<{ success: boolean; message: string; url: SitemapUrl }> {
    return this.http.put<{ success: boolean; message: string; url: SitemapUrl }>(
      `${this.apiUrl}/admin/seo/sitemap-urls/${id}`,
      url,
      { headers: this.getHeaders() }
    );
  }

  deleteSitemapUrl(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.apiUrl}/admin/seo/sitemap-urls/${id}`,
      { headers: this.getHeaders() }
    );
  }

  // ==========================================
  // SINCRONIZACIÓN Y NOTIFICACIONES
  // ==========================================

  syncProducts(): Observable<{
    success: boolean;
    message: string;
    stats: {
      products: { added: number; updated: number; disabled: number; total: number };
      categories: { added: number; updated: number; total: number };
    };
  }> {
    return this.http.post<{
      success: boolean;
      message: string;
      stats: {
        products: { added: number; updated: number; disabled: number; total: number };
        categories: { added: number; updated: number; total: number };
      };
    }>(
      `${this.apiUrl}/admin/seo/sync-products`,
      {},
      { headers: this.getHeaders() }
    );
  }

  notifyGoogle(): Observable<{ success: boolean; message: string; data?: any }> {
    return this.http.post<{ success: boolean; message: string; data?: any }>(
      `${this.apiUrl}/admin/seo/notify-google`,
      {},
      { headers: this.getHeaders() }
    );
  }

  getStats(): Observable<{ success: boolean; stats: SitemapStats }> {
    return this.http.get<{ success: boolean; stats: SitemapStats }>(
      `${this.apiUrl}/admin/seo/stats`,
      { headers: this.getHeaders() }
    );
  }

  // ==========================================
  // VISUALIZACIÓN PÚBLICA
  // ==========================================

  getSitemapXml(): Observable<string> {
    return this.http.get(`${URL_BACKEND}/sitemap.xml`, {
      responseType: 'text'
    });
  }

  getRobotsTxt(): Observable<string> {
    return this.http.get(`${URL_BACKEND}/robots.txt`, {
      responseType: 'text'
    });
  }
}
