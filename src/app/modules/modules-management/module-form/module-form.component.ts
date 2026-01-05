import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Toaster } from 'ngx-toast-notifications';
import { ModulesService, Module } from 'src/app/services/modules.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-module-form',
  templateUrl: './module-form.component.html',
  styleUrls: ['./module-form.component.scss']
})
export class ModuleFormComponent implements OnInit {

  moduleForm: FormGroup;
  isEditMode = false;
  isSaving = false;
  isLoading = false;
  moduleKey: string | null = null;

  // 🆕 Screenshots management
  screenshots: string[] = [];
  uploadingScreenshot = false;
  selectedFiles: File[] = [];
  features: string[] = [];
  techStack: string[] = [];
  newFeature = '';
  newTech = '';

  // 🆕 ZIP file management
  uploadingZip = false;
  selectedZipFile: File | null = null;
  zipFileName: string = '';
  zipFileSize: number = 0;

  // Opciones
  typeOptions = [
    { value: 'physical', label: 'Producto Físico', icon: 'fa-box' },
    { value: 'digital', label: 'Producto Digital', icon: 'fa-download' },
    { value: 'service', label: 'Servicio', icon: 'fa-handshake' },
    { value: 'integration', label: 'Integración', icon: 'fa-plug' }
  ];

  colorOptions = [
    { value: 'primary', label: 'Azul', class: 'bg-primary' },
    { value: 'success', label: 'Verde', class: 'bg-success' },
    { value: 'warning', label: 'Amarillo', class: 'bg-warning' },
    { value: 'danger', label: 'Rojo', class: 'bg-danger' },
    { value: 'info', label: 'Cyan', class: 'bg-info' },
    { value: 'dark', label: 'Negro', class: 'bg-dark' }
  ];

  statusOptions = [
    { value: 'draft', label: 'Borrador', description: 'Módulo en desarrollo' },
    { value: 'testing', label: 'Testing', description: 'En validación activa' },
    { value: 'live', label: 'Live', description: 'Público y funcionando' },
    { value: 'archived', label: 'Archivado', description: 'Módulo archivado' }
  ];

  iconOptions = [
    'fa-cube', 'fa-box', 'fa-download', 'fa-handshake', 'fa-plug',
    'fa-graduation-cap', 'fa-shopping-bag', 'fa-gift', 'fa-rocket',
    'fa-chart-line', 'fa-code', 'fa-paint-brush', 'fa-camera',
    'fa-music', 'fa-video', 'fa-book', 'fa-newspaper', 'fa-file-alt'
  ];

  constructor(
    private fb: FormBuilder,
    private modulesService: ModulesService,
    private route: ActivatedRoute,
    private router: Router,
    private toaster: Toaster,
    private cd: ChangeDetectorRef
  ) {
    this.moduleForm = this.createForm();
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['key']) {
        this.isEditMode = true;
        this.moduleKey = params['key'];
        this.loadModule(this.moduleKey);
      }
    });
  }

  /**
   * Crear formulario
   */
  createForm(): FormGroup {
    return this.fb.group({
      key: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required]],
      tagline: [''],
      detailed_description: [''],
      type: ['physical', [Validators.required]],
      status: ['draft'],
      validation_days: [14, [Validators.required, Validators.min(1)]],
      validation_target_sales: [1, [Validators.required, Validators.min(1)]],
      icon: ['fa-cube', [Validators.required]],
      color: ['primary', [Validators.required]],
      base_price: [null, [Validators.min(0)]],
      download_url: [''],
      post_purchase_email: [''],
    });
  }

  /**
   * Cargar módulo para edición
   */
  loadModule(key: string): void {
    this.isLoading = true;
    
    console.log(`🔍 Cargando módulo para edición: ${key}`);
    
    this.modulesService.getModule(key).subscribe({
      next: (response) => {
        console.log('✅ Módulo recibido del backend:', response);
        
        if (response.success && response.module) {
          this.moduleForm.patchValue(response.module);
          // Deshabilitar key en modo edición
          this.moduleForm.get('key')?.disable();
          
          // 🆕 Cargar screenshots y features
          this.screenshots = response.module.screenshots || [];
          this.features = response.module.features || [];
          this.techStack = response.module.tech_stack || [];
          
          // 🆕 Cargar información del ZIP si existe
          if (response.module.download_url) {
            this.zipFileName = response.module.download_url.split('/').pop() || '';
            // Nota: El tamaño no se almacena, solo se muestra durante la carga
          }
          
          console.log('✅ Formulario cargado correctamente');
        } else {
          console.error('⚠️ Respuesta del backend sin módulo:', response);
          this.toaster.open({
            text: 'No se encontró el módulo',
            caption: '⚠️ Error',
            type: 'warning',
            duration: 3000
          });
          this.router.navigate(['/modules-management']);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error loading module:', error);
        console.error('Error details:', {
          status: error.status,
          statusText: error.statusText,
          message: error.error?.error || error.message,
          url: error.url
        });
        
        const errorMessage = error.status === 404 
          ? 'Módulo no encontrado' 
          : error.error?.error || 'Error al cargar el módulo';
        
        this.toaster.open({
          text: errorMessage,
          caption: '❌ Error',
          type: 'danger',
          duration: 4000
        });
        this.isLoading = false;
        this.router.navigate(['/modules-management']);
      }
    });
  }

  /**
   * Guardar módulo
   */
  save(): void {
    if (this.moduleForm.invalid) {
      Object.keys(this.moduleForm.controls).forEach(key => {
        this.moduleForm.get(key)?.markAsTouched();
      });
      this.toaster.open({
        text: 'Por favor completa todos los campos requeridos',
        caption: '⚠️ Validación',
        type: 'warning',
        duration: 3000
      });
      return;
    }

    this.isSaving = true;
    const moduleData = {
      ...this.moduleForm.getRawValue(),
      screenshots: this.screenshots,
      features: this.features,
      tech_stack: this.techStack,
      requirements: {} // Por ahora vacío, se puede agregar UI después
    };

    const request = this.isEditMode
      ? this.modulesService.updateModule(this.moduleKey!, moduleData)
      : this.modulesService.createModule(moduleData);

    request.subscribe({
      next: (response) => {
        this.isSaving = false;
        
        if (response.success) {
          this.toaster.open({
            text: `Módulo ${this.isEditMode ? 'actualizado' : 'creado'} correctamente`,
            caption: '✅ Éxito',
            type: 'success',
            duration: 3000
          });
          this.router.navigate(['/modules-management']);
        }
      },
      error: (error) => {
        console.error('❌ Error saving module:', error);
        this.isSaving = false;
        
        // Manejar errores del backend (409 = key duplicado, etc.)
        const errorMessage = error.error?.error || error.message || `Error al ${this.isEditMode ? 'actualizar' : 'crear'} el módulo`;
        
        this.toaster.open({
          text: errorMessage,
          caption: '❌ Error',
          type: 'danger',
          duration: 4000
        });
      }
    });
  }

  /**
   * Cancelar y volver
   */
  async cancel(): Promise<void> {
    // Si el formulario está limpio (sin cambios), navegar directamente
    if (this.moduleForm.pristine) {
      this.router.navigate(['/modules-management']);
      return;
    }

    // Si hay cambios, mostrar modal de confirmación
    const result = await Swal.fire({
      title: '¿Descartar cambios?',
      html: `
        <div class="text-start">
          <p>Tienes cambios sin guardar en el formulario.</p>
          <p class="text-muted mt-3">
            <strong>Cambios detectados:</strong>
          </p>
          <ul class="text-muted">
            <li>📋 Campos modificados</li>
            <li>⚠️ Los cambios no se guardarán</li>
          </ul>
          <p class="text-muted mt-3">
            <em>¿Estás seguro de que deseas salir sin guardar?</em>
          </p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, descartar',
      cancelButtonText: 'Seguir editando',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      width: '500px'
    });

    if (result.isConfirmed) {
      this.router.navigate(['/modules-management']);
    }
  }

  /**
   * Generar key automáticamente desde el nombre
   */
  generateKey(): void {
    const name = this.moduleForm.get('name')?.value || '';
    const key = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    
    this.moduleForm.patchValue({ key });
  }

  /**
   * Validación de errores
   */
  hasError(controlName: string, errorName: string): boolean {
    const control = this.moduleForm.get(controlName);
    return !!(control && control.hasError(errorName) && control.touched);
  }

  /**
   * 🆕 Maneja la selección de archivos
   */
  onFileSelected(event: any): void {
    const files: FileList = event.target.files;
    if (files && files.length > 0) {
      this.selectedFiles = Array.from(files);
      this.uploadScreenshots();
    }
  }

  /**
   * 🆕 Drag & Drop - Prevenir default
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * 🆕 Drag & Drop - Manejar drop
   */
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.selectedFiles = Array.from(files);
      this.uploadScreenshots();
    }
  }

  /**
   * 🆕 Sube screenshots al servidor
   */
  uploadScreenshots(): void {
    if (!this.selectedFiles || this.selectedFiles.length === 0) {
      return;
    }

    const moduleKey = this.moduleForm.get('key')?.value;
    if (!moduleKey || !moduleKey.trim()) {
      this.toaster.open({
        text: 'Por favor ingresa un "key" antes de subir imágenes',
        caption: '⚠️ Key requerido',
        type: 'warning',
        duration: 4000
      });
      return;
    }

    this.uploadingScreenshot = true;
    const formData = new FormData();
    
    this.selectedFiles.forEach(file => {
      formData.append('screenshots', file);
    });

    this.modulesService.uploadModuleScreenshots(moduleKey, formData).subscribe({
      next: (response: any) => {
        console.log('✅ Upload successful:', response);
        this.uploadingScreenshot = false;
        this.cd.detectChanges(); // 🔄 Forzar actualización de la UI
        
        if (response.ok && response.screenshots) {
          // Agregar las URLs generadas al array de screenshots
          this.screenshots.push(...response.screenshots);
          
          this.toaster.open({
            text: `${response.screenshots.length} imagen(es) subida(s) correctamente`,
            caption: '✅ Éxito',
            type: 'success',
            duration: 3000
          });

          // Limpiar archivos seleccionados
          this.selectedFiles = [];
          this.cd.detectChanges(); // 🔄 Forzar actualización después de agregar screenshots
        }
      },
      error: (error) => {
        console.error('❌ Upload error:', error);
        this.uploadingScreenshot = false;
        this.cd.detectChanges(); // 🔄 Forzar actualización en caso de error
        
        this.toaster.open({
          text: error.error?.message || 'Error al subir las imágenes',
          caption: '❌ Error',
          type: 'danger',
          duration: 4000
        });
      }
    });
  }

  /**
   * 🆕 Agregar screenshot por URL
   */
  addScreenshot(url: string): void {
    if (!url || !url.trim()) {
      this.toaster.open({
        text: 'Ingresa una URL válida',
        caption: '⚠️ Validación',
        type: 'warning',
        duration: 2000
      });
      return;
    }

    if (this.screenshots.includes(url.trim())) {
      this.toaster.open({
        text: 'Esta URL ya está agregada',
        caption: '⚠️ Duplicado',
        type: 'warning',
        duration: 2000
      });
      return;
    }

    this.screenshots.push(url.trim());
    this.toaster.open({
      text: 'Screenshot agregado',
      caption: '✅ Éxito',
      type: 'success',
      duration: 2000
    });
  }

  /**
   * 🆕 Remover screenshot
   */
  removeScreenshot(index: number): void {
    this.screenshots.splice(index, 1);
    this.toaster.open({
      text: 'Screenshot eliminado',
      caption: '✅ Éxito',
      type: 'success',
      duration: 2000
    });
  }

  /**
   * 🆕 Agregar feature
   */
  addFeature(): void {
    if (!this.newFeature || !this.newFeature.trim()) {
      return;
    }

    if (this.features.includes(this.newFeature.trim())) {
      this.toaster.open({
        text: 'Esta característica ya está agregada',
        caption: '⚠️ Duplicado',
        type: 'warning',
        duration: 2000
      });
      return;
    }

    this.features.push(this.newFeature.trim());
    this.newFeature = '';
    this.toaster.open({
      text: 'Característica agregada',
      caption: '✅ Éxito',
      type: 'success',
      duration: 2000
    });
  }

  /**
   * 🆕 Remover feature
   */
  removeFeature(index: number): void {
    this.features.splice(index, 1);
  }

  /**
   * 🆕 Agregar tech stack
   */
  addTech(): void {
    if (!this.newTech || !this.newTech.trim()) {
      return;
    }

    if (this.techStack.includes(this.newTech.trim())) {
      this.toaster.open({
        text: 'Esta tecnología ya está agregada',
        caption: '⚠️ Duplicado',
        type: 'warning',
        duration: 2000
      });
      return;
    }

    this.techStack.push(this.newTech.trim());
    this.newTech = '';
    this.toaster.open({
      text: 'Tecnología agregada',
      caption: '✅ Éxito',
      type: 'success',
      duration: 2000
    });
  }

  /**
   * 🆕 Remover tech
   */
  removeTech(index: number): void {
    this.techStack.splice(index, 1);
  }

  /**
   * 🐛 Debug: Error al cargar imagen
   */
  onImageError(event: any): void {
    console.error('❌ Error loading image:', event.target.src);
    event.target.style.display = 'none';
    event.target.parentElement.innerHTML = `
      <div class="d-flex flex-column align-items-center justify-content-center h-100 text-danger">
        <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
        <small>Error cargando imagen</small>
      </div>
    `;
  }

  /**
   * 🐛 Debug: Imagen cargada correctamente
   */
  onImageLoad(event: any): void {
    console.log('✅ Image loaded successfully:', event.target.src);
  }

  /**
   * 📦 Maneja la selección de archivo ZIP
   */
  onZipFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.handleZipFile(file);
    }
  }

  /**
   * 📦 Drag & Drop - Manejar drop para ZIP
   */
  onZipDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleZipFile(files[0]);
    }
  }

  /**
   * 📦 Procesa y valida el archivo ZIP
   */
  handleZipFile(file: File): void {
    // Validar extensión
    if (!file.name.toLowerCase().endsWith('.zip')) {
      this.toaster.open({
        text: 'Solo se permiten archivos .zip',
        caption: '⚠️ Formato inválido',
        type: 'warning',
        duration: 3000
      });
      return;
    }

    // Validar tamaño (máx. 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB en bytes
    if (file.size > maxSize) {
      this.toaster.open({
        text: `El archivo es muy grande. Máximo 100MB (actual: ${(file.size / 1024 / 1024).toFixed(2)}MB)`,
        caption: '⚠️ Archivo muy grande',
        type: 'warning',
        duration: 4000
      });
      return;
    }

    this.selectedZipFile = file;
    this.zipFileName = file.name;
    this.zipFileSize = file.size;
    
    // Subir automáticamente
    this.uploadZipFile();
  }

  /**
   * 📦 Sube el archivo ZIP al servidor
   */
  uploadZipFile(): void {
    if (!this.selectedZipFile) {
      return;
    }

    const moduleKey = this.moduleForm.get('key')?.value;
    if (!moduleKey || !moduleKey.trim()) {
      this.toaster.open({
        text: 'Por favor ingresa un "key" antes de subir el archivo ZIP',
        caption: '⚠️ Key requerido',
        type: 'warning',
        duration: 4000
      });
      return;
    }

    this.uploadingZip = true;
    const formData = new FormData();
    formData.append('zip', this.selectedZipFile);

    this.modulesService.uploadModuleZip(moduleKey, formData).subscribe({
      next: (response: any) => {
        console.log('✅ ZIP upload successful:', response);
        this.uploadingZip = false;
        this.cd.detectChanges();
        
        if (response.ok && response.url) {
          // Asignar la URL al campo download_url
          this.moduleForm.patchValue({ download_url: response.url });
          
          this.toaster.open({
            text: 'Archivo ZIP subido correctamente',
            caption: '✅ Éxito',
            type: 'success',
            duration: 3000
          });
        }
      },
      error: (error) => {
        console.error('❌ ZIP upload error:', error);
        this.uploadingZip = false;
        this.selectedZipFile = null;
        this.zipFileName = '';
        this.zipFileSize = 0;
        this.cd.detectChanges();
        
        this.toaster.open({
          text: error.error?.message || 'Error al subir el archivo ZIP',
          caption: '❌ Error',
          type: 'danger',
          duration: 4000
        });
      }
    });
  }

  /**
   * 📦 Elimina el archivo ZIP subido
   */
  removeZipFile(): void {
    const moduleKey = this.moduleForm.get('key')?.value;
    
    if (!moduleKey) {
      // Si no hay key, solo limpiar localmente
      this.selectedZipFile = null;
      this.zipFileName = '';
      this.zipFileSize = 0;
      this.moduleForm.patchValue({ download_url: '' });
      return;
    }

    this.modulesService.deleteModuleZip(moduleKey).subscribe({
      next: (response) => {
        this.selectedZipFile = null;
        this.zipFileName = '';
        this.zipFileSize = 0;
        this.moduleForm.patchValue({ download_url: '' });
        
        this.toaster.open({
          text: 'Archivo ZIP eliminado',
          caption: '✅ Éxito',
          type: 'success',
          duration: 2000
        });
      },
      error: (error) => {
        console.error('❌ Error deleting ZIP:', error);
        
        // Limpiar localmente aunque falle el backend
        this.selectedZipFile = null;
        this.zipFileName = '';
        this.zipFileSize = 0;
        this.moduleForm.patchValue({ download_url: '' });
      }
    });
  }

  /**
   * 📦 Formatea el tamaño del archivo
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}
