import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NewsletterCampaignsService } from '../services/newsletter-campaigns.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-campaign-create',
  templateUrl: './campaign-create.component.html',
  styleUrls: ['./campaign-create.component.scss']
})
export class CampaignCreateComponent implements OnInit {
  campaignForm: FormGroup;
  sending = false;
  testEmailsString = '';
  recipientsCount = 0;
  showPreview = false;
  previewHtml = '';

  constructor(
    private fb: FormBuilder,
    private newsletterService: NewsletterCampaignsService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {
    this.campaignForm = this.fb.group({
      name: ['', Validators.required],
      subject: ['', Validators.required],
      htmlBody: ['', Validators.required],
      filterSource: [''],
      filterVerified: [true], // Por defecto solo suscriptores verificados
      scheduledAt: ['']
    });
  }

  ngOnInit(): void {
    this.calculateRecipients();
    
    // Recalcular cuando cambien los filtros
    this.campaignForm.get('filterSource')?.valueChanges.subscribe(() => {
      this.calculateRecipients();
    });
    
    this.campaignForm.get('filterVerified')?.valueChanges.subscribe(() => {
      this.calculateRecipients();
    });
  }

  calculateRecipients(): void {
    const filters: any = {};
    
    // Solo agregar source si tiene valor
    if (this.campaignForm.value.filterSource) {
      filters.source = this.campaignForm.value.filterSource;
    }
    
    // Convertir boolean a string 'true' o 'false' para el backend
    // Si filterVerified es true, buscar solo verificados
    // Si es false, incluir todos (no enviar el filtro)
    if (this.campaignForm.value.filterVerified === true) {
      filters.verified = 'true';
    }

    console.log('🔍 Calculating recipients with filters:', filters);

    this.newsletterService.getRecipientsCount(filters).subscribe({
      next: (data) => {
        this.recipientsCount = data.count;
        this.cd.detectChanges();
        console.log('✅ Recipients count updated:', this.recipientsCount);
      },
      error: (err) => {
        console.error('❌ Error calculating recipients:', err);
        this.cd.detectChanges();
      }
    });
  }

  sendTestEmails(): void {
    if (!this.testEmailsString.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Email Requerido',
        text: 'Introduce al menos un email de prueba'
      });
      return;
    }

    const testEmails = this.testEmailsString.split(',').map(e => e.trim()).filter(e => e);
    
    if (testEmails.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Formato Inválido',
        text: 'El formato de los emails no es válido'
      });
      return;
    }

    if (this.campaignForm.invalid) {
      Swal.fire({
        icon: 'warning',
        title: 'Formulario Incompleto',
        text: 'Por favor, completa asunto y contenido HTML'
      });
      return;
    }

    this.sending = true;
    this.cd.detectChanges();

    this.newsletterService.sendTestEmails(
      this.campaignForm.value.subject,
      this.campaignForm.value.htmlBody,
      testEmails
    ).subscribe({
      next: (result) => {
        this.sending = false;
        this.cd.detectChanges();
        Swal.fire({
          icon: 'success',
          title: '✅ Emails Enviados',
          html: `
            <p><strong>Emails de prueba enviados exitosamente</strong></p>
            <p>Enviados: <strong>${result.data?.sent || testEmails.length}/${testEmails.length}</strong></p>
          `
        });
      },
      error: (err) => {
        this.sending = false;
        this.cd.detectChanges();
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron enviar los emails de prueba',
          footer: err.message
        });
        console.error('❌ Error sending test emails:', err);
      }
    });
  }

  async sendCampaign(): Promise<void> {
    if (this.campaignForm.invalid) {
      Swal.fire({
        icon: 'warning',
        title: 'Formulario Incompleto',
        text: 'Por favor, completa todos los campos requeridos'
      });
      return;
    }

    // Confirmación crítica antes de enviar
    const confirmation = await Swal.fire({
      title: '📧 ¿Enviar Campaña Newsletter?',
      html: `
        <div class="text-left">
          <p><strong>Estás a punto de enviar emails a:</strong></p>
          <ul>
            <li>Destinatarios: <strong>${this.recipientsCount} suscriptores</strong></li>
            <li>Asunto: <strong>${this.campaignForm.value.subject}</strong></li>
          </ul>
          <p class="text-danger mt-3">⚠️ Esta acción NO se puede deshacer.</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, enviar campaña',
      cancelButtonText: 'Cancelar',
      allowOutsideClick: false
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    this.sending = true;
    this.cd.detectChanges();

    const campaignData = {
      name: this.campaignForm.value.name,
      subject: this.campaignForm.value.subject,
      html_body: this.campaignForm.value.htmlBody,
      filters: {
        source: this.campaignForm.value.filterSource,
        verified: this.campaignForm.value.filterVerified
      },
      scheduleAt: this.campaignForm.value.scheduledAt || null
    };

    this.newsletterService.sendCampaign(campaignData).subscribe({
      next: (result) => {
        this.sending = false;
        this.cd.detectChanges();
        Swal.fire({
          icon: 'success',
          title: '🎉 ¡Campaña Enviada!',
          html: `
            <div class="text-left">
              <p><strong>${result.message || 'Campaña enviada exitosamente'}</strong></p>
              ${result.data?.sent ? `<p>Emails enviados: <strong>${result.data.sent}</strong></p>` : ''}
            </div>
          `,
          confirmButtonText: 'Ver Dashboard'
        }).then(() => {
          this.router.navigate(['/newsletter-campaigns/dashboard']);
        });
      },
      error: (err) => {
        this.sending = false;
        this.cd.detectChanges();
        Swal.fire({
          icon: 'error',
          title: 'Error Crítico',
          text: 'No se pudo enviar la campaña',
          footer: err.message
        });
        console.error('❌ Error sending campaign:', err);
      }
    });
  }

  preview(): void {
    if (!this.campaignForm.value.htmlBody) {
      Swal.fire({
        icon: 'warning',
        title: 'Contenido Vacío',
        text: 'Por favor, escribe el contenido HTML antes de previsualizar'
      });
      return;
    }

    this.newsletterService.previewCampaign(this.campaignForm.value.htmlBody).subscribe({
      next: (data) => {
        this.previewHtml = data.html;
        this.showPreview = true;
        this.cd.detectChanges();
        // Bloquear scroll del body
        document.body.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo generar la vista previa',
          footer: err.message
        });
        console.error('❌ Error generating preview:', err);
      }
    });
  }

  closePreview(): void {
    this.showPreview = false;
    this.previewHtml = '';
    // Restaurar scroll del body
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
  }
}
