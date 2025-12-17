import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { SeoService, SeoConfig } from '../../../services/seo.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-robots-manager',
  templateUrl: './robots-manager.component.html',
  styleUrls: ['./robots-manager.component.scss']
})
export class RobotsManagerComponent implements OnInit {
  robotsForm!: FormGroup;
  loading = false;
  saving = false;
  mode: 'simple' | 'advanced' = 'simple';
  currentContent: string = '';
  previewContent: string = '';

  constructor(
    private fb: FormBuilder,
    private seoService: SeoService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadConfig();
  }

  initForm(): void {
    this.robotsForm = this.fb.group({
      userAgents: this.fb.array([]),
      sitemap: ['https://tienda.lujandev.com/sitemap.xml', Validators.required],
      robotsTxtContent: ['']
    });

    // Añadir un User-Agent por defecto
    this.addUserAgent();
  }

  get userAgents(): FormArray {
    return this.robotsForm.get('userAgents') as FormArray;
  }

  createUserAgent(data?: any): FormGroup {
    return this.fb.group({
      agent: [data?.agent || '*', Validators.required],
      allow: [data?.allow?.join('\n') || '/', Validators.required],
      disallow: [data?.disallow?.join('\n') || '/admin\n/api', Validators.required]
    });
  }

  addUserAgent(): void {
    this.userAgents.push(this.createUserAgent());
  }

  removeUserAgent(index: number): void {
    if (this.userAgents.length > 1) {
      this.userAgents.removeAt(index);
    } else {
      Swal.fire('Aviso', 'Debe haber al menos un User-Agent configurado', 'warning');
    }
  }

  loadConfig(): void {
    this.loading = true;
    this.seoService.getConfig().subscribe({
      next: (response) => {
        if (response.success && response.config) {
          const config = response.config;

          // Cargar contenido avanzado
          if (config.robotsTxtContent) {
            this.robotsForm.patchValue({
              robotsTxtContent: config.robotsTxtContent
            });
            this.mode = 'advanced';
          }

          // Cargar reglas simples
          if (config.robotsRules) {
            this.robotsForm.patchValue({
              sitemap: config.robotsRules.sitemap || 'https://tienda.lujandev.com/sitemap.xml'
            });

            // Limpiar y cargar user agents
            while (this.userAgents.length) {
              this.userAgents.removeAt(0);
            }

            if (config.robotsRules.userAgents && config.robotsRules.userAgents.length > 0) {
              config.robotsRules.userAgents.forEach((ua: any) => {
                this.userAgents.push(this.createUserAgent(ua));
              });
            } else {
              this.addUserAgent();
            }
          }

          this.generatePreview();
        }
        this.loading = false;
        this.cd.detectChanges();
      },
      error: (error) => {
        console.error('Error cargando configuración:', error);
        Swal.fire('Error', 'No se pudo cargar la configuración', 'error');
        this.loading = false;
        this.cd.detectChanges();
      }
    });
  }

  switchMode(newMode: 'simple' | 'advanced'): void {
    if (newMode !== this.mode) {
      Swal.fire({
        title: '¿Cambiar modo?',
        text: newMode === 'advanced' 
          ? 'Podrás editar el robots.txt directamente como texto'
          : 'Se generará el robots.txt desde las reglas estructuradas',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, cambiar',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          this.mode = newMode;
          this.generatePreview();
          this.cd.detectChanges(); // Forzar actualización de vista
        }
      });
    }
  }

  generatePreview(): void {
    if (this.mode === 'advanced') {
      this.previewContent = this.robotsForm.value.robotsTxtContent || '';
    } else {
      let content = '';
      const userAgents = this.robotsForm.value.userAgents || [];

      userAgents.forEach((ua: any) => {
        content += `User-agent: ${ua.agent}\n`;
        
        // Parsear allows (líneas separadas)
        const allows = (ua.allow || '').split('\n').map((s: string) => s.trim()).filter(Boolean);
        allows.forEach((path: string) => {
          content += `Allow: ${path}\n`;
        });
        
        // Parsear disallows (líneas separadas)
        const disallows = (ua.disallow || '').split('\n').map((s: string) => s.trim()).filter(Boolean);
        disallows.forEach((path: string) => {
          content += `Disallow: ${path}\n`;
        });
        
        content += '\n';
      });

      content += `Sitemap: ${this.robotsForm.value.sitemap}\n`;
      
      this.previewContent = content;
    }
    this.cd.detectChanges(); // Forzar actualización de vista
  }

  onSubmit(): void {
    if (this.robotsForm.invalid) {
      Swal.fire('Error', 'Por favor completa todos los campos requeridos', 'warning');
      return;
    }

    this.saving = true;

    const updateData: any = {};

    if (this.mode === 'advanced') {
      // Modo avanzado: enviar contenido directo
      updateData.robotsTxtContent = this.robotsForm.value.robotsTxtContent;
      updateData.robotsRules = null;
    } else {
      // Modo simple: enviar reglas estructuradas
      const userAgents = this.robotsForm.value.userAgents.map((ua: any) => ({
        agent: ua.agent,
        allow: (ua.allow || '').split('\n').map((s: string) => s.trim()).filter(Boolean),
        disallow: (ua.disallow || '').split('\n').map((s: string) => s.trim()).filter(Boolean)
      }));

      updateData.robotsRules = {
        userAgents,
        sitemap: this.robotsForm.value.sitemap
      };
      updateData.robotsTxtContent = null;
    }

    this.seoService.updateConfig(updateData).subscribe({
      next: (response) => {
        if (response.success) {
          Swal.fire('¡Éxito!', 'Robots.txt actualizado correctamente', 'success');
        }
        this.saving = false;
        this.cd.detectChanges();
      },
      error: (error) => {
        console.error('Error guardando robots.txt:', error);
        Swal.fire('Error', 'No se pudo guardar la configuración', 'error');
        this.saving = false;
        this.cd.detectChanges();
      }
    });
  }

  viewRobots(): void {
    this.seoService.getRobotsTxt().subscribe({
      next: (content) => {
        this.currentContent = content;
        Swal.fire({
          title: 'Robots.txt Actual',
          html: `<pre class="text-left">${content}</pre>`,
          width: '600px',
          confirmButtonText: 'Cerrar'
        });
      },
      error: (error) => {
        console.error('Error cargando robots.txt:', error);
        Swal.fire('Error', 'No se pudo cargar el robots.txt actual', 'error');
      }
    });
  }

  copyToClipboard(): void {
    navigator.clipboard.writeText(this.previewContent).then(() => {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Copiado al portapapeles',
        showConfirmButton: false,
        timer: 2000
      });
    });
  }
}
