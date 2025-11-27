import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ShippingPrintfulService } from '../_services/shipping-printful.service';
import { AuthService } from '../../auth';
import { URL_SERVICIOS } from 'src/app/config/config';

@Component({
  selector: 'app-shipping-calculator-printful',
  templateUrl: './shipping-calculator-printful.component.html',
  styleUrls: ['./shipping-calculator-printful.component.scss']
})
export class ShippingCalculatorPrintfulComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Form data
  recipient = {
    country_code: 'ES',
    state_code: '',
    city: 'Madrid',
    zip: '28001'
  };

  items: Array<{ variant_id: number; quantity: number; name?: string }> = [
    { variant_id: 11548, quantity: 1 }
  ];

  // Data
  countries: any[] = [];
  states: any[] = [];
  variants: any[] = [];
  shippingRates: any[] = [];
  summary: any = null;

  // State
  loading = false;
  loadingCountries = true;
  loadingVariants = true;
  calculated = false;

  // Toast
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' | 'info' = 'info';

  constructor(
    private shippingService: ShippingPrintfulService,
    private http: HttpClient,
    private authService: AuthService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCountries();
    this.loadVariants();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCountries(): void {
    this.loadingCountries = true;
    this.shippingService.getCountries()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.countries = response.countries;
          }
          this.loadingCountries = false;
          this.cd.detectChanges();
        },
        error: (err) => {
          console.error('Error loading countries:', err);
          this.loadingCountries = false;
          this.displayToast('Error al cargar países', 'error');
        }
      });
  }

  loadVariants(): void {
    this.loadingVariants = true;
    const headers = new HttpHeaders({
      'token': this.authService.token
    });
    
    // Usar ?source=db para obtener productos sincronizados de la base de datos
    this.http.get(`${URL_SERVICIOS}/printful/list?source=db`, { headers })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          console.log('📦 Products response:', response);
          if (response && response.products) {
            // Extraer todas las variantes de los productos
            const allVariants: any[] = [];
            response.products.forEach((product: any) => {
              console.log('🔍 Processing product:', product.title, 'Variedades:', product.variedades);
              if (product.variedades && Array.isArray(product.variedades)) {
                product.variedades.forEach((variedad: any) => {
                  if (variedad.variant_id) {
                    allVariants.push({
                      variant_id: variedad.variant_id,
                      name: `${product.title} - ${variedad.name || variedad.valor || 'S/N'}`,
                      product_title: product.title
                    });
                  }
                });
              }
            });
            this.variants = allVariants;
            console.log('✅ Variants loaded:', this.variants.length, this.variants);
            
            if (this.variants.length === 0) {
              this.displayToast('No se encontraron productos sincronizados con Printful', 'warning');
            }
          }
          this.loadingVariants = false;
          this.cd.detectChanges();
        },
        error: (err) => {
          console.error('❌ Error loading variants:', err);
          this.displayToast('Error al cargar productos', 'error');
          this.loadingVariants = false;
          this.cd.detectChanges();
        }
      });
  }

  onCountryChange(): void {
    this.states = [];
    this.recipient.state_code = '';
    
    if (this.recipient.country_code) {
      this.shippingService.getCountryStates(this.recipient.country_code)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.states = response.states || [];
            }
            this.cd.detectChanges();
          },
          error: (err) => {
            console.error('Error loading states:', err);
          }
        });
    }
  }

  addItem(): void {
    this.items.push({ variant_id: 0, quantity: 1 });
  }

  removeItem(index: number): void {
    if (this.items.length > 1) {
      this.items.splice(index, 1);
    }
  }

  getVariantName(variantId: number): string {
    const variant = this.variants.find(v => v.variant_id === variantId);
    return variant ? variant.name : `Variant ${variantId}`;
  }

  calculateRates(): void {
    // Validación
    if (!this.recipient.country_code || !this.recipient.city || !this.recipient.zip) {
      this.displayToast('Por favor completa todos los campos del destinatario', 'warning');
      return;
    }

    const validItems = this.items.filter(item => item.variant_id > 0 && item.quantity > 0);
    if (validItems.length === 0) {
      this.displayToast('Por favor agrega al menos un producto válido', 'warning');
      return;
    }

    this.loading = true;
    this.calculated = false;
    this.shippingRates = [];
    this.summary = null;

    // Preparar items sin el campo name
    const itemsToSend = validItems.map(({ variant_id, quantity }) => ({
      variant_id,
      quantity
    }));

    this.shippingService.calculateRates(this.recipient, itemsToSend)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.shippingRates = response.rates;
            this.summary = response.summary;
            this.calculated = true;
            this.displayToast('Tarifas calculadas correctamente', 'success');
          } else {
            this.displayToast('No se pudieron calcular las tarifas', 'error');
          }
          this.loading = false;
          this.cd.detectChanges();
        },
        error: (err) => {
          console.error('Error calculating rates:', err);
          this.displayToast('Error al calcular tarifas de envío', 'error');
          this.loading = false;
          this.cd.detectChanges();
        }
      });
  }

  resetCalculator(): void {
    this.recipient = {
      country_code: 'ES',
      state_code: '',
      city: 'Madrid',
      zip: '28001'
    };
    this.items = [{ variant_id: 11548, quantity: 1 }];
    this.shippingRates = [];
    this.summary = null;
    this.calculated = false;
  }

  formatCurrency(value: string | number, currency: string = 'EUR'): string {
    const amount = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  displayToast(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    setTimeout(() => this.closeToast(), 3000);
  }

  closeToast(): void {
    this.showToast = false;
  }
}
