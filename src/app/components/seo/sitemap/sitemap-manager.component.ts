import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SeoService, SitemapUrl } from '../../../services/seo.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-sitemap-manager',
  templateUrl: './sitemap-manager.component.html',
  styleUrls: ['./sitemap-manager.component.scss']
})
export class SitemapManagerComponent implements OnInit {
  urls: SitemapUrl[] = [];
  loading = false;
  currentPage = 1;
  totalPages = 1;
  totalUrls = 0;
  limit = 20;

  // Filtros
  filterType: string = '';
  filterEnabled: string = '';

  // Modal
  showModal = false;
  editingUrl: SitemapUrl | null = null;
  urlForm!: FormGroup;

  changefreqOptions = [
    { value: 'always', label: 'Siempre' },
    { value: 'hourly', label: 'Cada hora' },
    { value: 'daily', label: 'Diariamente' },
    { value: 'weekly', label: 'Semanalmente' },
    { value: 'monthly', label: 'Mensualmente' },
    { value: 'yearly', label: 'Anualmente' },
    { value: 'never', label: 'Nunca' }
  ];

  typeOptions = [
    { value: 'static', label: 'Estática', badge: 'primary' },
    { value: 'product', label: 'Producto', badge: 'info' },
    { value: 'category', label: 'Categoría', badge: 'warning' },
    { value: 'custom', label: 'Personalizada', badge: 'secondary' }
  ];

  constructor(
    private fb: FormBuilder,
    private seoService: SeoService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadUrls();
  }

  initForm(): void {
    this.urlForm = this.fb.group({
      loc: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
      changefreq: ['weekly', Validators.required],
      priority: [0.5, [Validators.required, Validators.min(0), Validators.max(1)]],
      type: ['custom', Validators.required],
      enabled: [true]
    });
  }

  loadUrls(): void {
    this.loading = true;
    const params: any = {
      page: this.currentPage,
      limit: this.limit
    };

    if (this.filterType) params.type = this.filterType;
    if (this.filterEnabled) params.enabled = this.filterEnabled === 'true';

    this.seoService.listSitemapUrls(params).subscribe({
      next: (response) => {
        if (response.success) {
          this.urls = response.urls;
          this.totalPages = response.pages;
          this.totalUrls = response.total;
        }
        this.loading = false;
        this.cd.detectChanges();
      },
      error: (error) => {
        console.error('Error cargando URLs:', error);
        Swal.fire('Error', 'No se pudieron cargar las URLs del sitemap', 'error');
        this.loading = false;
        this.cd.detectChanges();
      }
    });
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadUrls();
  }

  clearFilters(): void {
    this.filterType = '';
    this.filterEnabled = '';
    this.currentPage = 1;
    this.loadUrls();
  }

  openAddModal(): void {
    this.editingUrl = null;
    this.urlForm.reset({
      loc: '',
      changefreq: 'weekly',
      priority: 0.5,
      type: 'custom',
      enabled: true
    });
    this.showModal = true;
  }

  openEditModal(url: SitemapUrl): void {
    this.editingUrl = url;
    this.urlForm.patchValue(url);
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingUrl = null;
    this.urlForm.reset();
  }

  saveUrl(): void {
    if (this.urlForm.invalid) {
      Swal.fire('Error', 'Por favor completa todos los campos correctamente', 'warning');
      return;
    }

    const urlData = this.urlForm.value;

    if (this.editingUrl) {
      // Actualizar
      this.seoService.updateSitemapUrl(this.editingUrl.id!, urlData).subscribe({
        next: (response) => {
          if (response.success) {
            this.closeModal();
            this.loadUrls();
            Swal.fire({
              icon: 'success',
              title: '¡Éxito!',
              text: 'URL actualizada correctamente',
              timer: 1500,
              showConfirmButton: false
            });
          }
        },
        error: (error) => {
          console.error('Error actualizando URL:', error);
          Swal.fire('Error', 'No se pudo actualizar la URL', 'error');
        }
      });
    } else {
      // Crear nueva
      this.seoService.addSitemapUrl(urlData).subscribe({
        next: (response) => {
          if (response.success) {
            this.closeModal();
            this.loadUrls();
            Swal.fire({
              icon: 'success',
              title: '¡Éxito!',
              text: 'URL añadida correctamente',
              timer: 1500,
              showConfirmButton: false
            });
          }
        },
        error: (error) => {
          console.error('Error añadiendo URL:', error);
          const errorMsg = error.error?.message || 'No se pudo añadir la URL';
          Swal.fire('Error', errorMsg, 'error');
        }
      });
    }
  }

  toggleEnabled(url: SitemapUrl): void {
    this.seoService.updateSitemapUrl(url.id!, { enabled: !url.enabled }).subscribe({
      next: (response) => {
        if (response.success) {
          url.enabled = !url.enabled;
          this.cd.detectChanges(); // Forzar detección de cambios
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: url.enabled ? 'URL habilitada' : 'URL deshabilitada',
            showConfirmButton: false,
            timer: 2000
          });
        }
      },
      error: (error) => {
        console.error('Error actualizando estado:', error);
        Swal.fire('Error', 'No se pudo actualizar el estado', 'error');
      }
    });
  }

  deleteUrl(url: SitemapUrl): void {
    Swal.fire({
      title: '¿Eliminar URL?',
      text: `¿Estás seguro de eliminar: ${url.loc}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.seoService.deleteSitemapUrl(url.id!).subscribe({
          next: (response) => {
            if (response.success) {
              Swal.fire('¡Eliminada!', 'La URL ha sido eliminada', 'success');
              this.loadUrls();
            }
          },
          error: (error) => {
            console.error('Error eliminando URL:', error);
            Swal.fire('Error', 'No se pudo eliminar la URL', 'error');
          }
        });
      }
    });
  }

  changePage(page: number): void {
    this.currentPage = page;
    this.loadUrls();
  }

  getTypeBadge(type: string): string {
    const typeOption = this.typeOptions.find(opt => opt.value === type);
    return typeOption ? typeOption.badge : 'secondary';
  }

  getTypeLabel(type: string): string {
    const typeOption = this.typeOptions.find(opt => opt.value === type);
    return typeOption ? typeOption.label : type;
  }

  getMetadataValue(metadata: any, key: string): string {
    try {
      if (typeof metadata === 'string') {
        const parsed = JSON.parse(metadata);
        return parsed[key] || '';
      }
      return metadata && metadata[key] ? metadata[key] : '';
    } catch (e) {
      return '';
    }
  }
}
