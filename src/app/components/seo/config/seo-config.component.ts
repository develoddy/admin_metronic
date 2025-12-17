import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SeoService, SeoConfig, SitemapStats } from '../../../services/seo.service';
import Swal from 'sweetalert2';
import { URL_BACKEND } from '../../../config/config';

@Component({
  selector: 'app-seo-config',
  templateUrl: './seo-config.component.html',
  styleUrls: ['./seo-config.component.scss']
})
export class SeoConfigComponent implements OnInit {
  configForm!: FormGroup;
  loading = false;
  saving = false;
  syncing = false;
  notifying = false;
  loadingStats = true; // Nuevo: estado de carga de estadísticas
  stats: SitemapStats = { // Valores por defecto
    total: 0,
    byType: {
      static: 0,
      product: 0,
      category: 0,
      custom: 0
    },
    disabled: 0,
    lastGeneration: null,
    lastRobotsUpdate: null,
    lastGoogleNotification: null
  };

  changefreqOptions = [
    { value: 'always', label: 'Siempre' },
    { value: 'hourly', label: 'Cada hora' },
    { value: 'daily', label: 'Diariamente' },
    { value: 'weekly', label: 'Semanalmente' },
    { value: 'monthly', label: 'Mensualmente' },
    { value: 'yearly', label: 'Anualmente' },
    { value: 'never', label: 'Nunca' }
  ];

  constructor(
    private fb: FormBuilder,
    private seoService: SeoService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadConfig();
    this.loadStats();
  }

  initForm(): void {
    this.configForm = this.fb.group({
      sitemapBaseUrl: ['https://tienda.lujandev.com', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
      sitemapIncludeProducts: [true],
      sitemapIncludeCategories: [true],
      sitemapProductChangefreq: ['weekly', Validators.required],
      sitemapProductPriority: [0.8, [Validators.required, Validators.min(0), Validators.max(1)]],
      googleSearchConsoleEnabled: [false],
      googleSearchConsoleApiKey: [''],
      googleSearchConsoleSiteUrl: ['']
    });
  }

  loadConfig(): void {
    this.loading = true;
    this.seoService.getConfig().subscribe({
      next: (response) => {
        if (response.success && response.config) {
          this.configForm.patchValue(response.config);
        }
        this.loading = false;
        this.cd.detectChanges();
      },
      error: (error) => {
        console.error('Error cargando configuración:', error);
        // Si es error de red (status 0), reintentar una vez
        if (error.status === 0) {
          console.log('Reintentando cargar configuración...');
          setTimeout(() => this.retryLoadConfig(), 1000);
        } else {
          Swal.fire('Error', 'No se pudo cargar la configuración SEO', 'error');
        }
        this.loading = false;
        this.cd.detectChanges();
      }
    });
  }

  private retryLoadConfig(): void {
    this.seoService.getConfig().subscribe({
      next: (response) => {
        if (response.success && response.config) {
          this.configForm.patchValue(response.config);
        }
        this.cd.detectChanges();
      },
      error: (error) => {
        console.error('Error en reintento:', error);
        Swal.fire('Error', 'No se pudo cargar la configuración SEO después de reintentar', 'error');
      }
    });
  }

  loadStats(): void {
    this.loadingStats = true;
    this.seoService.getStats().subscribe({
      next: (response) => {
        if (response.success) {
          this.stats = response.stats;
        }
        this.loadingStats = false;
        this.cd.detectChanges();
      },
      error: (error) => {
        console.error('Error cargando estadísticas:', error);
        // Reintentar si es error de red
        if (error.status === 0) {
          setTimeout(() => this.retryLoadStats(), 1000);
        }
        this.loadingStats = false;
        this.cd.detectChanges();
      }
    });
  }

  private retryLoadStats(): void {
    this.seoService.getStats().subscribe({
      next: (response) => {
        if (response.success) {
          this.stats = response.stats;
        }
        this.cd.detectChanges();
      },
      error: (error) => {
        console.error('Error en reintento de estadísticas:', error);
      }
    });
  }

  onSubmit(): void {
    if (this.configForm.invalid) {
      Swal.fire('Error', 'Por favor completa todos los campos requeridos correctamente', 'warning');
      return;
    }

    this.saving = true;
    this.cd.detectChanges();
    
    this.seoService.updateConfig(this.configForm.value).subscribe({
      next: (response) => {
        if (response.success) {
          Swal.fire('¡Éxito!', response.message, 'success');
          this.loadStats();
        }
        this.saving = false;
        this.cd.detectChanges();
      },
      error: (error) => {
        console.error('Error guardando configuración:', error);
        Swal.fire('Error', 'No se pudo guardar la configuración', 'error');
        this.saving = false;
        this.cd.detectChanges();
      }
    });
  }

  syncProducts(): void {
    Swal.fire({
      title: '¿Sincronizar productos y categorías?',
      text: 'Esto actualizará todas las URLs de productos y categorías en el sitemap',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, sincronizar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.syncing = true;
        this.cd.detectChanges();
        
        this.seoService.syncProducts().subscribe({
          next: (response) => {
            if (response.success) {
              const productsHtml = response.stats.products ? `
                <div class="mb-3">
                  <h6>📦 Productos:</h6>
                  <ul class="text-left">
                    <li><strong>Añadidos:</strong> ${response.stats.products.added}</li>
                    <li><strong>Actualizados:</strong> ${response.stats.products.updated}</li>
                    <li><strong>Deshabilitados:</strong> ${response.stats.products.disabled}</li>
                    <li><strong>Total:</strong> ${response.stats.products.total}</li>
                  </ul>
                </div>
              ` : '';
              
              const categoriesHtml = response.stats.categories ? `
                <div class="mb-3">
                  <h6>📂 Categorías:</h6>
                  <ul class="text-left">
                    <li><strong>Añadidas:</strong> ${response.stats.categories.added}</li>
                    <li><strong>Actualizadas:</strong> ${response.stats.categories.updated}</li>
                    <li><strong>Total:</strong> ${response.stats.categories.total}</li>
                  </ul>
                </div>
              ` : '';

              Swal.fire({
                title: '¡Sincronización completa!',
                html: `
                  <p>${response.message}</p>
                  ${productsHtml}
                  ${categoriesHtml}
                `,
                icon: 'success'
              });
              this.loadStats();
            }
            this.syncing = false;
            this.cd.detectChanges();
          },
          error: (error) => {
            console.error('Error sincronizando productos:', error);
            Swal.fire('Error', 'No se pudo sincronizar los productos', 'error');
            this.syncing = false;
            this.cd.detectChanges();
          }
        });
      }
    });
  }

  notifyGoogle(): void {
    if (!this.configForm.value.googleSearchConsoleEnabled) {
      Swal.fire('Aviso', 'Debes habilitar la integración con Google Search Console primero', 'warning');
      return;
    }

    Swal.fire({
      title: '¿Notificar a Google?',
      text: 'Esto enviará el sitemap actualizado a Google Search Console',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, notificar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.notifying = true;
        this.seoService.notifyGoogle().subscribe({
          next: (response) => {
            if (response.success) {
              Swal.fire('¡Éxito!', response.message, 'success');
              this.loadStats();
            }
            this.notifying = false;
          },
          error: (error) => {
            console.error('Error notificando a Google:', error);
            const errorMsg = error.error?.message || 'No se pudo enviar la notificación a Google';
            Swal.fire('Error', errorMsg, 'error');
            this.notifying = false;
          }
        });
      }
    });
  }

  viewSitemap(): void {
    // Usar URL del backend donde está el endpoint dinámico
    const backendUrl = URL_BACKEND.replace(/\/$/, ''); // Remover barra final si existe
    window.open(`${backendUrl}/api/sitemap.xml`, '_blank');
  }

  viewRobots(): void {
    // Usar URL del backend donde está el endpoint dinámico
    const backendUrl = URL_BACKEND.replace(/\/$/, ''); // Remover barra final si existe
    window.open(`${backendUrl}/api/robots.txt`, '_blank');
  }
}
