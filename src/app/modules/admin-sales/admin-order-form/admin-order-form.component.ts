import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { AdminSalesService } from '../services/admin-sales.service';
import { AuthService } from '../../auth/_services/auth.service';
import { HttpClient } from '@angular/common/http';
import { URL_SERVICIOS } from 'src/app/config/config';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-admin-order-form',
  templateUrl: './admin-order-form.component.html',
  styleUrls: ['./admin-order-form.component.scss']
})
export class AdminOrderFormComponent implements OnInit {
  form: FormGroup;
  products: any[] = [];
  variants: any[] = [];
  editingSaleId: number | null = null;

  step = 1;

  constructor(private fb: FormBuilder, private http: HttpClient, private adminService: AdminSalesService, private auth: AuthService, private router: Router, private route: ActivatedRoute, private cdr: ChangeDetectorRef) {
    this.form = this.fb.group({
      customerType: ['user', Validators.required],
      userId: [null],
      guest: this.fb.group({ name: [''], email: [''], phone: [''] }),
      address: this.fb.group({ name: [''], surname: [''], pais: ['ES'], address: [''], ciudad: [''], region: [''], telefono: [''], email: [''] }),
      items: this.fb.array([]),
      costs: this.fb.group({ subtotal: ['0.00'], discount: ['0.00'], shipping: ['0.00'], tax: ['0.00'] })
    });
  }

  // Helper to resolve product title by id (used in template to show product name)
  getProductTitle(productId: any): string {
    if (!productId) return '';
    // product lists may use `_id` (Mongo-like) or `id`. Support both.
    const p = this.products.find(pr => (pr._id && pr._id == productId) || (pr.id && pr.id == productId));
    // debug only — harmless if products array is empty
    console.debug('getProductTitle lookup for', productId, 'found', p ? (p.title || p.name) : null);
    return p ? (p.title || p.name || '') : '';
  }

  ngOnInit(): void {
    // NOTE: don't load the full products list here. We prefer to use product objects included
    // in the sale/items payload (saleDetails) to populate productTitle per item.

    this.route.params.subscribe(p => {
      if (p['id']) {
        this.editingSaleId = Number(p['id']);
        // Load sale details and prefill items
        this.adminService.getSaleById(this.editingSaleId).subscribe(resp => {
          if (resp && resp.sale) {
              const s = resp.sale;
              // Prefill items (accept several possible keys returned by backend)
              const saleItems = s.items || s.sale_details || s.saleDetails || s.SaleDetails || [];
              if (Array.isArray(saleItems) && saleItems.length) {
                // clear existing items
                while (this.items.length) { this.items.removeAt(0); }
                saleItems.forEach((it: any) => {
                  const productTitle = it.product && (it.product.title || it.product.name) ? (it.product.title || it.product.name) : (it.title || it.productTitle || '');
                  const group = this.fb.group({ 
                    productId: [it.product?.id || it.productId || it.product_id || null, Validators.required], 
                    productTitle: [productTitle],
                    variantId: [it.variedad?.id || it.variedadId || it.variedad_id || it.variedade?.id || null, Validators.required], 
                    quantity: [it.cantidad || it.quantity || it.qty || 1, [Validators.required, Validators.min(1)]], 
                    retail_price: [it.price_unitario || it.unitPrice || it.retail_price || it.unit_price || 0]
                
                });
                  // disable product selection — admin can only change variant/size
                  group.get('productId')?.disable();
                  // keep a reference to the variedad object (if provided by backend) so we can display talla labels
                  (group as any).variedadObj = it.variedad || it.variedade || null;
                  this.items.push(group);

                  console.log('Item agregado:', it, 'Group value:', group.value);
                    console.log('Título actual del producto:', this.getProductTitle(group.get('productId')?.value));
                });
              }

            // Prefill customer info if available
                if (s.user) {
                  // If sale belongs to an authenticated user, set customerType and copy some fields into guest inputs so admin can see name/email
                  this.form.patchValue({ customerType: 'user', userId: s.user.id, guest: { name: s.user.name || s.user.fullName || '', email: s.user.email || '' } });
                } else if (s.guest) {
                  this.form.patchValue({ customerType: 'guest', guest: { name: s.guest.name || '', email: s.guest.email || '', phone: s.guest.phone || '' } });
                }

                // If the show() response included sale_addresses we patch them; otherwise do an extra call to fetch the address
                if (s.sale_addresses && s.sale_addresses.length > 0) {
                  const addr = s.sale_addresses[0];
                  this.form.get('address')?.patchValue({ name: addr.name || '', surname: addr.surname || '', pais: addr.pais || 'ES', address: addr.address || '', ciudad: addr.ciudad || '', region: addr.region || '', telefono: addr.telefono || '', email: addr.email || '' });
                } else {
                  // call the dedicated endpoint to fetch sale address
                  this.adminService.getSaleAddressById(this.editingSaleId).subscribe(respAddr => {
                    if (respAddr && respAddr.address) {
                      const a = respAddr.address;
                      this.form.get('address')?.patchValue({ name: a.name || '', surname: a.surname || '', pais: a.pais || 'ES', address: a.address || '', ciudad: a.ciudad || '', region: a.region || '', telefono: a.telefono || '', email: a.email || '' });
                    }
                  }, err => {
                    // Not critical — log for debugging
                    console.warn('Could not load sale address separately', err);
                  });
                }
          }
        }, err => console.warn('Could not load sale for editing', err));
      }
    });
  }

  get items(): FormArray { return this.form.get('items') as FormArray; }

  addItem(product?: any) {
    const group = this.fb.group({ 
        productId: [product ? product.id : null, Validators.required], variantId: [null, Validators.required], 
        quantity: [1, [Validators.required, Validators.min(1)]], 
        retail_price: [product ? product.price_soles || product.price_usd || 0 : 0],
        productTitle: [product ? (product.title || product.name) : '']
    });
    this.items.push(group);
  }

  removeItem(i: number) { this.items.removeAt(i); }

  onProductChange(i: number) {
    const pid = this.items.at(i).get('productId')?.value;
    if (!pid) return;
    // load product variants
    this.http.get<any>(`${URL_SERVICIOS}/products/${pid}`).subscribe(r => {
      const v = r && r.variants ? r.variants : [];
      this.variants = v;
    });
  }

  // Return a user-friendly product title for display in the UI, or empty string
  getDisplayedProductTitle(it: any): string {
    try {
      // if the form group has an attached product object, use it
      const val = it && it.value ? it.value : null;
      if (val && val.product && (val.product.title || val.product.name)) return val.product.title || val.product.name;
      // otherwise try the productId control
      const pid = it && it.get ? it.get('productId')?.value : null;
      return this.getProductTitle(pid);
    } catch (e) {
      return '';
    }
  }

  // Resolve a human label for a variant (talla) given the variant id and the form group (which may carry variedad object)
  getVariantLabel(varId: any, it: any): string {
    if (!varId) return '';
    // If the FormGroup stored the variedad object, prefer that
    if (it && (it as any).variedadObj) {
      const v = (it as any).variedadObj;
      return v.valor || v.name || v.label || String(varId);
    }
    // If the form group's value contains variedad, use it
    const val = it && it.value ? it.value : null;
    if (val && (val.variedad || val.variedade)) {
      const vv = val.variedad || val.variedade;
      return vv.valor || vv.name || vv.label || String(varId);
    }
    // Try to look up in loaded variants list
    const idNum = Number(varId);
    const found = this.variants.find(v => Number(v.id) === idNum || Number(v.variedadId || v.varietyId || v.id) === idNum);
    if (found) return found.valor || found.name || found.label || String(varId);
    return String(varId);
  }

  next() { if (this.step < 4) this.step++; }
  prev() { if (this.step > 1) this.step--; }

  calculateTotals() {
    const items = this.items.controls.map(c => ({ price: Number(c.get('retail_price')?.value || 0), qty: Number(c.get('quantity')?.value || 1) }));
    const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0).toFixed(2);
    this.form.get('costs')?.patchValue({ subtotal, discount: '0.00', shipping: '0.00', tax: '0.00' });
  }

  submit() {
    this.calculateTotals();
    const payload: any = {
      sale: { total: Number(this.form.get('costs.subtotal')?.value || 0) },
      sale_address: this.form.get('address')?.value,
      items: this.items.controls.map(c => ({ productId: c.get('productId')?.value, variedadId: c.get('variantId')?.value, quantity: c.get('quantity')?.value, retail_price: c.get('retail_price')?.value })),
      costs: this.form.get('costs')?.value
    };

    // If editing a sale, call correctOrder, else createAdminOrder
    if (this.editingSaleId) {
      this.adminService.correctOrder(this.editingSaleId, payload).subscribe(resp => {
        alert('Corrección enviada: ' + (resp && resp.message));
        this.router.navigate(['/sales/list']);
      }, err => {
        console.error('Error creating correction', err);
        alert('Error: ' + (err.error && err.error.message ? err.error.message : 'Error'));
      });
    } else {
      this.adminService.createAdminOrder(payload).subscribe(resp => {
        alert('Pedido creado: ' + (resp && resp.message));
        this.router.navigate(['/sales/list']);
      }, err => {
        console.error('Error creating admin order', err);
        alert('Error: ' + (err.error && err.error.message ? err.error.message : 'Error'));
      });
    }
  }

 
}
