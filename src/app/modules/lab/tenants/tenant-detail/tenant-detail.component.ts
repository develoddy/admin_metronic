import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SaasTenantsService, TenantListItem } from '../../_services/saas-tenants.service';

@Component({
  selector: 'app-tenant-detail',
  templateUrl: './tenant-detail.component.html',
  styleUrls: ['./tenant-detail.component.scss']
})
export class TenantDetailComponent implements OnInit {
  tenantId: number;
  tenant: any = null;
  isLoading = true;

  // Tabs
  activeTab = 'info'; // 'info', 'subscription', 'history', 'notes'
  
  // Notes
  notes: any[] = [];
  isLoadingNotes = false;
  newNote = {
    note: '',
    note_type: 'general',
    is_important: false
  };
  noteTypes = [
    { value: 'general', label: 'General' },
    { value: 'support', label: 'Soporte' },
    { value: 'billing', label: 'Facturación' },
    { value: 'technical', label: 'Técnico' },
    { value: 'cancellation', label: 'Cancelación' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tenantsService: SaasTenantsService,
    private cd: ChangeDetectorRef
  ) {
    this.tenantId = Number(this.route.snapshot.paramMap.get('id'));
  }

  ngOnInit(): void {
    this.loadTenantDetails();
    this.loadNotes();
  }

  loadTenantDetails(): void {
    this.isLoading = true;
    this.cd.detectChanges();
    
    this.tenantsService.getTenantById(this.tenantId).subscribe({
      next: (response) => {
        if (response.success) {
          this.tenant = response.tenant;
        }
        this.isLoading = false;
        this.cd.detectChanges();
      },
      error: (error) => {
        console.error('Error loading tenant:', error);
        this.isLoading = false;
        this.cd.detectChanges();
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/lab/tenants']);
  }

  switchTab(tab: string): void {
    this.activeTab = tab;
  }

  getStatusBadgeClass(status: string): string {
    const classes = {
      'trial': 'badge-warning',
      'active': 'badge-success',
      'cancelled': 'badge-danger',
      'expired': 'badge-secondary',
      'suspended': 'badge-dark'
    };
    return classes[status] || 'badge-secondary';
  }

  formatDate(date: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getDaysRemaining(trialEndsAt: string): number {
    if (!trialEndsAt) return 0;
    const now = new Date();
    const endDate = new Date(trialEndsAt);
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  extendTrial(days: number): void {
    if (confirm(`¿Extender trial por ${days} días?`)) {
      this.isLoading = true;
      this.cd.detectChanges();
      
      this.tenantsService.extendTrial(this.tenantId, days).subscribe({
        next: (response) => {
          if (response.success) {
            alert('Trial extendido exitosamente');
            this.loadTenantDetails();
          }
        },
        error: (error) => {
          console.error('Error extending trial:', error);
          alert('Error al extender trial');
          this.isLoading = false;
          this.cd.detectChanges();
        }
      });
    }
  }

  cancelSubscription(): void {
    if (confirm(`¿Cancelar suscripción de ${this.tenant.name}?`)) {
      this.isLoading = true;
      this.cd.detectChanges();
      
      this.tenantsService.cancelSubscription(this.tenantId).subscribe({
        next: (response) => {
          if (response.success) {
            alert('Suscripción cancelada');
            this.loadTenantDetails();
          }
        },
        error: (error) => {
          console.error('Error canceling subscription:', error);
          alert('Error al cancelar suscripción');
          this.isLoading = false;
          this.cd.detectChanges();
        }
      });
    }
  }

  reactivateTenant(): void {
    if (confirm(`¿Reactivar cuenta de ${this.tenant.name}?`)) {
      this.isLoading = true;
      this.cd.detectChanges();
      
      this.tenantsService.reactivateTenant(this.tenantId).subscribe({
        next: (response) => {
          if (response.success) {
            alert('Cuenta reactivada exitosamente');
            this.loadTenantDetails();
          }
        },
        error: (error) => {
          console.error('Error reactivating tenant:', error);
          alert('Error al reactivar cuenta');
          this.isLoading = false;
          this.cd.detectChanges();
        }
      });
    }
  }

  // ===== NOTES METHODS =====
  
  loadNotes(): void {
    this.isLoadingNotes = true;
    this.cd.detectChanges();

    this.tenantsService.getTenantNotes(this.tenantId).subscribe({
      next: (response: any) => {
        this.notes = response.notes || [];
        this.isLoadingNotes = false;
        this.cd.detectChanges();
      },
      error: (error) => {
        console.error('Error loading notes:', error);
        this.isLoadingNotes = false;
        this.cd.detectChanges();
      }
    });
  }

  addNote(): void {
    if (!this.newNote.note.trim()) {
      alert('Por favor ingresa una nota');
      return;
    }

    this.isLoadingNotes = true;
    this.cd.detectChanges();

    this.tenantsService.addNote(this.tenantId, this.newNote).subscribe({
      next: (response: any) => {
        if (response.success) {
          // Reset form
          this.newNote = {
            note: '',
            note_type: 'general',
            is_important: false
          };
          
          // Reload notes
          this.loadNotes();
          
          alert('Nota agregada exitosamente');
        }
      },
      error: (error) => {
        console.error('Error adding note:', error);
        alert('Error al agregar nota');
        this.isLoadingNotes = false;
        this.cd.detectChanges();
      }
    });
  }

  getNoteTypeLabel(type: string): string {
    const noteType = this.noteTypes.find(t => t.value === type);
    return noteType ? noteType.label : type;
  }

  getNoteTypeBadgeClass(type: string): string {
    const classes = {
      'general': 'badge-light-primary',
      'support': 'badge-light-info',
      'billing': 'badge-light-warning',
      'technical': 'badge-light-success',
      'cancellation': 'badge-light-danger'
    };
    return classes[type] || 'badge-light-secondary';
  }
}
