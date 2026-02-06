import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { VideoExpressService } from '../_services/video-express.service';
import { AnimationStyle, ANIMATION_STYLE_LABELS } from '../_models/video-job.model';

/**
 * Componente para crear nuevo video job
 * Formulario de upload de imagen y selección de estilo
 */
@Component({
  selector: 'app-job-creator',
  templateUrl: './job-creator.component.html',
  styleUrls: ['./job-creator.component.scss']
})
export class JobCreatorComponent implements OnInit {
  selectedFile: File | null = null;
  selectedStyle: AnimationStyle = 'zoom_in';
  imagePreview: string | null = null;
  
  loading = false;
  error: string | null = null;
  success = false;

  // Estilos de animación disponibles
  animationStyles: Array<{ value: AnimationStyle; label: string; description: string }> = [
    {
      value: 'zoom_in',
      label: 'Zoom In',
      description: 'Acercamiento dramático al producto con efecto cinematográfico'
    },
    {
      value: 'parallax',
      label: 'Parallax 3D',
      description: 'Efecto de profundidad suave con movimiento de capas'
    },
    {
      value: 'subtle_float',
      label: 'Subtle Float',
      description: 'Flotación minimalista ideal para productos de lujo'
    }
  ];

  constructor(
    private videoExpressService: VideoExpressService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {}

  /**
   * Handler cuando se selecciona un archivo
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validar tipo de archivo
      if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
        this.error = 'Solo se permiten imágenes JPG o PNG';
        this.selectedFile = null;
        this.imagePreview = null;
        return;
      }

      // Validar tamaño (10MB máximo)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        this.error = 'La imagen no puede superar 10MB';
        this.selectedFile = null;
        this.imagePreview = null;
        return;
      }

      this.selectedFile = file;
      this.error = null;

      // Generar preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
        this.cd.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * Limpiar archivo seleccionado
   */
  clearFile(): void {
    this.selectedFile = null;
    this.imagePreview = null;
    this.error = null;
    this.cd.detectChanges();
  }

  /**
   * Seleccionar estilo de animación
   */
  selectStyle(style: AnimationStyle): void {
    this.selectedStyle = style;
    this.cd.detectChanges();
  }

  /**
   * Enviar formulario para crear video job
   */
  onSubmit(): void {
    if (!this.selectedFile) {
      this.error = 'Por favor selecciona una imagen';
      return;
    }

    if (!this.selectedStyle) {
      this.error = 'Por favor selecciona un estilo de animación';
      return;
    }

    this.loading = true;
    this.error = null;

    this.videoExpressService.createJob(this.selectedFile, this.selectedStyle).subscribe({
      next: (response) => {
        if (response.status === 201 && response.data) {
          this.success = true;
          this.loading = false;
          this.cd.detectChanges();
          
          // Redirigir a la lista de jobs después de 2 segundos
          setTimeout(() => {
            this.router.navigate(['/video-express/jobs']);
          }, 2000);
        } else {
          this.error = response.message || 'Error al crear el video job';
          this.loading = false;
          this.cd.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error creating job:', err);
        this.error = err.error?.message || 'Error al procesar la solicitud. Intenta de nuevo.';
        this.loading = false;
        this.cd.detectChanges();
      }
    });
  }

  /**
   * Cancelar y volver al dashboard
   */
  cancel(): void {
    this.router.navigate(['/video-express']);
  }

  /**
   * Obtener tamaño de archivo en formato legible
   */
  getFileSize(): string {
    if (!this.selectedFile) return '';
    const bytes = this.selectedFile.size;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  }
}
