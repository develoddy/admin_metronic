import { Component, OnInit } from '@angular/core';
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
    private toaster: Toaster
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
      type: ['physical', [Validators.required]],
      status: ['draft'],
      validation_days: [14, [Validators.required, Validators.min(1)]],
      validation_target_sales: [1, [Validators.required, Validators.min(1)]],
      icon: ['fa-cube', [Validators.required]],
      color: ['primary', [Validators.required]],
      base_price: [null, [Validators.min(0)]],
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
    const moduleData = this.moduleForm.getRawValue();

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
}
