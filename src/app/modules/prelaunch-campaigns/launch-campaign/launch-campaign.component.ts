import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { PrelaunchCampaignsService, LaunchCampaignConfig, LaunchCampaignResult } from '../services/prelaunch-campaigns.service';
import { CuponeService } from '../../cupone/_services/cupone.service';
import { environment } from '../../../../environments/environment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-launch-campaign',
  templateUrl: './launch-campaign.component.html',
  styleUrls: ['./launch-campaign.component.scss']
})
export class LaunchCampaignComponent implements OnInit {
  campaignForm: FormGroup;
  loading = false;
  previewLoading = false;
  emailPreview: string | null = null;
  showPreview = false;
  
  // Estado del envío
  sending = false;
  sendingProgress = 0;
  result: LaunchCampaignResult | null = null;
  
  // Cupones disponibles
  availableCoupons: any[] = [];
  loadingCoupons = false;
  selectedCoupon: any = null;

  constructor(
    private fb: FormBuilder,
    private prelaunchService: PrelaunchCampaignsService,
    private cuponeService: CuponeService,
    private cd: ChangeDetectorRef
  ) {
    this.campaignForm = this.createForm();
  }

  ngOnInit(): void {
    // Subscribirse a cambios de progreso en tiempo real
    this.prelaunchService.campaignProgress$.subscribe(progress => {
      if (progress) {
        this.sendingProgress = progress.percentage || 0;
      }
    });
    
    // Cargar cupones disponibles
    this.loadAvailableCoupons();
  }

  createForm(): FormGroup {
    return this.fb.group({
      selected_coupon_id: ['', [Validators.required]],
      coupon_code: [{ value: '', disabled: true }],
      coupon_discount: [{ value: '', disabled: true }],
      coupon_expiry_days: [{ value: '7', disabled: true }],
      featured_products: this.fb.array([
        this.createProductGroup('Camiseta Premium', '€24.95', 'camiseta-preview.jpg'),
        this.createProductGroup('Taza Personalizada', '€12.95', 'taza-preview.jpg'),
        this.createProductGroup('Hoodie Exclusivo', '€39.95', 'hoodie-preview.jpg'),
        this.createProductGroup('Gorra Bordada', '€19.95', 'gorra-preview.jpg')
      ])
    });
  }

  createProductGroup(name: string, price: string, image: string): FormGroup {
    return this.fb.group({
      name: [name, Validators.required],
      price: [price, Validators.required],
      image: [`${environment.URL_BACKEND}api/products/uploads/product/${image}`, Validators.required]
    });
  }

  get featuredProducts(): FormArray {
    return this.campaignForm.get('featured_products') as FormArray;
  }

  addProduct(): void {
    this.featuredProducts.push(this.createProductGroup('', '', ''));
  }

  removeProduct(index: number): void {
    if (this.featuredProducts.length > 1) {
      this.featuredProducts.removeAt(index);
    }
  }

  /**
   * Cargar cupones disponibles desde la base de datos
   */
  loadAvailableCoupons(): void {
    this.loadingCoupons = true;
    this.cuponeService.allCupones().subscribe({
      next: (response: any) => {
        if (response && response.cupones) {
          // Filtrar solo cupones activos
          this.availableCoupons = response.cupones.filter((coupon: any) => 
            coupon.state === 1 || coupon.state === '1'
          );
          console.log('📋 Cupones disponibles cargados:', this.availableCoupons.length);
        }
        this.loadingCoupons = false;
        this.cd.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error cargando cupones:', error);
        this.loadingCoupons = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los cupones disponibles'
        });
      }
    });
  }

  /**
   * Manejar selección de cupón
   */
  onCouponSelect(couponId: string): void {
    const selectedCoupon = this.availableCoupons.find(c => c.id == couponId);
    
    if (selectedCoupon) {
      this.selectedCoupon = selectedCoupon;
      
      // Actualizar campos del formulario con datos del cupón seleccionado
      this.campaignForm.patchValue({
        coupon_code: selectedCoupon.code,
        coupon_discount: selectedCoupon.type_discount === 'MONEDA' 
          ? `€${selectedCoupon.discount}` 
          : `${selectedCoupon.discount}%`,
        coupon_expiry_days: this.calculateDaysUntilExpiry(selectedCoupon.date_expire)
      });
      
      console.log('🎫 Cupón seleccionado:', selectedCoupon);
    } else {
      // Limpiar si no hay selección
      this.selectedCoupon = null;
      this.campaignForm.patchValue({
        coupon_code: '',
        coupon_discount: '',
        coupon_expiry_days: '7'
      });
    }
  }

  /**
   * Calcular días hasta que expire el cupón
   */
  private calculateDaysUntilExpiry(expireDate: string): number {
    if (!expireDate) return 7; // Default 7 días
    
    const expire = new Date(expireDate);
    const now = new Date();
    const diffTime = expire.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 7; // Mínimo 7 días si ya expiró
  }

  async previewEmail(): Promise<void> {
    if (this.campaignForm.invalid) {
      Swal.fire({
        icon: 'warning',
        title: 'Formulario Incompleto',
        text: 'Por favor completa todos los campos requeridos'
      });
      return;
    }

    this.previewLoading = true;
    const config: LaunchCampaignConfig = {
      ...this.campaignForm.value,
      preview_only: true
    };

    this.prelaunchService.getEmailPreview(config).subscribe({
      next: (response) => {
        console.log('✅ Preview received, HTML length:', response.html?.length);
        this.emailPreview = response.html;
        this.showPreview = true;
        this.previewLoading = false;
        // Bloquear scroll del body
        document.body.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
        // Forzar detección de cambios
        this.cd.detectChanges();
        console.log('🎭 Modal should be visible now. showPreview =', this.showPreview);
      },
      error: (err) => {
        console.error('❌ Error getting preview:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo generar el preview del email'
        });
        this.previewLoading = false;
      }
    });
  }

  async launchCampaign(): Promise<void> {
    if (this.campaignForm.invalid) {
      Swal.fire({
        icon: 'warning',
        title: 'Formulario Incompleto',
        text: 'Por favor completa todos los campos requeridos'
      });
      return;
    }

    // Confirmación crítica
    const confirmation = await Swal.fire({
      title: '🚀 ¿Enviar Campaña de Lanzamiento?',
      html: `
        <div class="text-left">
          <p><strong>Estás a punto de enviar emails masivos a todos los suscriptores verificados.</strong></p>
          <ul>
            <li>Descuento: <strong>${this.campaignForm.value.coupon_discount}</strong></li>
            <li>Válido por: <strong>${this.campaignForm.value.coupon_expiry_days} días</strong></li>
            <li>Productos destacados: <strong>${this.featuredProducts.length}</strong></li>
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
      showLoaderOnConfirm: true,
      allowOutsideClick: false
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    this.sending = true;
    this.sendingProgress = 0;
    this.result = null;

    const config: LaunchCampaignConfig = this.campaignForm.value;

    this.prelaunchService.launchCampaign(config).subscribe({
      next: (result) => {
        this.result = result;
        this.sending = false;
        
        if (result.success) {
          Swal.fire({
            icon: 'success',
            title: '🎉 ¡Campaña Enviada!',
            html: `
              <div class="text-left">
                <p><strong>Estadísticas del envío:</strong></p>
                <ul>
                  <li>✅ Emails enviados: <strong>${result.sent}</strong></li>
                  <li>❌ Errores: <strong>${result.errors}</strong></li>
                  <li>📊 Total: <strong>${result.total}</strong></li>
                  <li>📈 Tasa de éxito: <strong>${((result.sent / result.total) * 100).toFixed(1)}%</strong></li>
                </ul>
              </div>
            `,
            confirmButtonText: 'Ver Dashboard'
          }).then((result) => {
            if (result.isConfirmed) {
              // Navegar al dashboard
              window.location.href = '/prelaunch/dashboard';
            }
          });
        } else {
          // Si no hay usuarios pendientes, mostrar info en lugar de error
          const isNoSubscribers = result.total === 0;
          Swal.fire({
            icon: isNoSubscribers ? 'info' : 'error',
            title: isNoSubscribers ? 'Sin Suscriptores Pendientes' : 'Error en la Campaña',
            text: result.message || 'Ocurrió un error al enviar la campaña',
            footer: result.error ? `💡 ${result.error}` : ''
          });
        }
      },
      error: (err) => {
        console.error('Error launching campaign:', err);
        this.sending = false;
        Swal.fire({
          icon: 'error',
          title: 'Error Crítico',
          text: 'No se pudo conectar con el servidor. Verifica tu conexión.',
          footer: err.message
        });
      }
    });
  }

  closePreview(): void {
    this.showPreview = false;
    this.emailPreview = null;
    // Restaurar scroll del body
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
  }
}
