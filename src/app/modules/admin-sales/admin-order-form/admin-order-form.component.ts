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
      costs: this.fb.group({ subtotal: ['0.00'], discount: ['0.00'], shipping: ['0.00'], tax: ['0.00'] }),
      // Printful metadata (optional fields populated when editing an order that was sent to Printful)
      printfulOrderId: [null],
      printfulStatus: [null],
      minDeliveryDate: [null],
      maxDeliveryDate: [null]
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
                  // Prefer variety file thumbnail_url (public Printful CDN) if available, then variedad.Files.preview_url, then product.imagen, then productImage
                  let productImage = '';
                  try {
                    const variedadObj = it.variedad || it.variedade || null;
                    if (variedadObj && variedadObj.Files && Array.isArray(variedadObj.Files) && variedadObj.Files.length > 0) {
                        // prefer thumbnail_url used by ecommerce printful flow; use find to prefer explicit thumbnail/preview
                        const fileObj = variedadObj.Files.find((f: any) => f.thumbnail_url) || variedadObj.Files.find((f: any) => f.preview_url) || null;
                        productImage = fileObj ? (fileObj.thumbnail_url || fileObj.preview_url || '') : '';
                      }
                  } catch (e) { /* ignore */ }
                  if (!productImage) {
                    productImage = it.product && (it.product.imagen || it.product.image) ? (it.product.imagen || it.product.image) : (it.productImage || '');
                  }
                  const group = this.fb.group({ 
                    productId: [it.product?.id || it.productId || it.product_id || null, Validators.required], 
                    productTitle: [productTitle],
                    productImage: [productImage],
                    selectedForCorrection: [false],
                    variantId: [it.variedad?.id || it.variedadId || it.variedad_id || it.variedade?.id || null, Validators.required], 
                    quantity: [it.cantidad || it.quantity || it.qty || 1, [Validators.required, Validators.min(1)]], 
                    retail_price: [it.price_unitario || it.unitPrice || it.retail_price || it.unit_price || 0],
                    variants: this.fb.control([])
                  });

                  // disable product selection — admin can only change variant/size
                  group.get('productId')?.disable();
                  // keep a reference to the variedad object (if provided by backend) so we can display talla labels
                  (group as any).variedadObj = it.variedad || it.variedade || null;
                  this.items.push(group);

                  // Load variants for this product so admin can change talla
                  const pid = group.get('productId')?.value;
                  if (pid) {
                    this.loadVariantsForItem(group, pid);
                  }

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

            // Log Printful-related fields received from backend for debugging
            console.log('[AdminOrderForm] Printful fields from sale:', {
              printfulOrderId: s.printfulOrderId,
              printfulStatus: s.printfulStatus,
              minDeliveryDate: s.minDeliveryDate,
              maxDeliveryDate: s.maxDeliveryDate
            });

            // Patch Printful fields into the form so the template's reactive bindings update
            try {
              if (s.printfulOrderId || s.printfulStatus || s.minDeliveryDate || s.maxDeliveryDate) {
                this.form.patchValue({ printfulOrderId: s.printfulOrderId ?? null, printfulStatus: s.printfulStatus ?? null, minDeliveryDate: s.minDeliveryDate ?? null, maxDeliveryDate: s.maxDeliveryDate ?? null });
                console.log('[AdminOrderForm] form values after patch:', this.form.value.printfulOrderId, this.form.value.printfulStatus, this.form.value.minDeliveryDate, this.form.value.maxDeliveryDate);
              }
            } catch (e) {
              // Non-critical
              console.warn('[AdminOrderForm] Error patching Printful fields into form', e);
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
    productTitle: [product ? (product.title || product.name) : ''],
    productImage: [product ? (product.imagen || product.image || '') : ''],
    selectedForCorrection: [false],
    variants: this.fb.control([])
  });
    this.items.push(group);
  }

  // Note: file upload from UI removed; backend will use productImage as the file for Printful.

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

  // Load variants for a specific FormGroup item and attach normalized list to the group
  loadVariantsForItem(group: FormGroup, productId: any) {
    const pid = productId;
    if (!pid) return;
    // Prefer admin endpoint which returns the same structure as frontend's show_landing_product
    this.adminService.getAdminProductById(pid).subscribe((resp: any) => {
      console.log('[DEBUG] Variantes cargadas (admin endpoint)', resp?.product?.variedades);
      const raw = resp && resp.product && resp.product.variedades ? resp.product.variedades : null;
      if (raw && Array.isArray(raw)) {
        // proceed with normalization using admin response
        normalizeAndSet(raw);
      } else {
        // fallback to public product endpoint if admin endpoint didn't return variantes
        this.http.get<any>(`${URL_SERVICIOS}/products/${pid}`).subscribe(r => {
          const raw2 = r && r.variants ? r.variants : [];
          normalizeAndSet(raw2);
        }, err => {
          console.warn('Could not load variants for product (fallback)', pid, err);
        });
      }
    }, err => {
      // On error, fallback to public endpoint
      console.warn('[DEBUG] Admin product endpoint failed, falling back to public product endpoint', err);
      this.http.get<any>(`${URL_SERVICIOS}/products/${pid}`).subscribe(r => {
        const raw = r && r.variants ? r.variants : [];
        normalizeAndSet(raw);
      }, err2 => {
        console.warn('Could not load variants for product', pid, err2);
      });
    });

    // local helper to normalize and set variants on the FormGroup
    const normalizeAndSet = (raw: any[]) => {
      const norm = raw.map((v: any) => ({
        id: v.id || v.variedadId || v._id || v.value || null,
        label: v.valor || v.name || v.label || v.size || String(v.id || v.variedadId || v._id || ''),
        price: v.price || v.retail_price || v.price_unitario || v.precio || null
      }));
      group.get('variants')?.setValue(norm);
      // set the variants FormControl so template can read them via it.get('variants')?.value
      group.get('variants')?.setValue(norm);
      console.log('Variants cargadas para productId=', pid, norm);
      // If the current variantId exists, ensure its value is normalized to string
      const currentVar = group.get('variantId')?.value;
      if (currentVar != null) group.get('variantId')?.patchValue(String(currentVar));
      const selected = group.get('selectedForCorrection')?.value;
      if (currentVar && selected) {
        const found = norm.find((x: any) => String(x.id) === String(currentVar));
        if (found && found.price != null) {
          group.get('retail_price')?.patchValue(found.price);
        }
      }
      // trigger change detection so template picks up the new variants even if the select is disabled
      try { this.cdr.detectChanges(); } catch (e) { /* ignore */ }
    };
  }

  // Called when admin changes the selected variant for an item
  onVariantChange(i: number) {
    const group = this.items.at(i) as FormGroup & { [key: string]: any };
    const varId = group.get('variantId')?.value;
    const variants: any[] = group.get('variants')?.value || [];
    const selected = group.get('selectedForCorrection')?.value;
    if (!selected) return; // do not update price if not selected for correction
    const found = variants.find(v => String(v.id) === String(varId));
    if (found && found.price != null) {
      group.get('retail_price')?.patchValue(found.price);
    }
  }

  onSelectedForCorrectionChange(i: number) {
    const group = this.items.at(i) as FormGroup & { [key: string]: any };
    const selected = group.get('selectedForCorrection')?.value;
    if (!selected) return;
    // ensure variants are loaded
    const loaded = group.get('variants')?.value;
    if (!loaded || loaded.length === 0) {
      const pid = group.get('productId')?.value;
      if (pid) this.loadVariantsForItem(group, pid);
    } else {
      // if variants already loaded, and variantId present, update price if variant has price
      const varId = group.get('variantId')?.value;
      if (varId) {
        const found = (group.get('variants')?.value || []).find((v: any) => String(v.id) === String(varId));
        if (found && found.price != null) group.get('retail_price')?.patchValue(found.price);
      }
    }
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
    // If any items are selected for correction, calculate totals only for them; otherwise calculate for all
    const selectedControls = this.items.controls.filter(c => c.get('selectedForCorrection')?.value);
    const controlsToSum = selectedControls.length > 0 ? selectedControls : this.items.controls;
    const items = controlsToSum.map(c => ({ price: Number(c.get('retail_price')?.value || 0), qty: Number(c.get('quantity')?.value || 1) }));
    const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0).toFixed(2);
    this.form.get('costs')?.patchValue({ subtotal, discount: '0.00', shipping: '0.00', tax: '0.00' });
  }

  submit() {
    this.calculateTotals();
    // Client-side validation: ensure selected items have a productImage (used as file) when required
    const selectedControls = this.items.controls.filter(c => c.get('selectedForCorrection')?.value);
    for (let idx = 0; idx < selectedControls.length; idx++) {
      const c = selectedControls[idx];
      const productImage = c.get('productImage')?.value || '';
      const name = c.get('productTitle')?.value || '';
      const nameLower = (name || '').toString().toLowerCase();
      const isEmbroidered = nameLower.includes('gorra') || nameLower.includes('bordado') || nameLower.includes('cap');
      if (!isEmbroidered && (!productImage || productImage.length === 0)) {
        alert('El item "' + (name || 'Producto') + '" requiere al menos una imagen del producto antes de enviar.');
        return;
      }
    }

    const itemsPayload = selectedControls.map((c, idx) => {
      // Prefer public thumbnail_url/preview_url from variedad.Files (use find)
      const variedadObj = (c as any).variedadObj || c.value.variedad || null;
      let productImage = '';
      try {
        if (variedadObj && variedadObj.Files && Array.isArray(variedadObj.Files) && variedadObj.Files.length > 0) {
          const fileObj = variedadObj.Files.find((f: any) => f.thumbnail_url) || variedadObj.Files.find((f: any) => f.preview_url) || null;
          productImage = fileObj ? (fileObj.thumbnail_url || fileObj.preview_url || '') : '';
        }
      } catch (e) { /* ignore */ }
      if (!productImage) {
        productImage = c.get('productImage')?.value;
      }
      // Ensure productImage and files use public HTTPS if possible
      const fileUrl = productImage;
      if (fileUrl && !String(fileUrl).startsWith('https://')) {
        console.warn('⚠️ fileUrl no es pública HTTPS:', fileUrl, 'for productId:', c.get('productId')?.value);
      }
      const base = {
        productId: c.get('productId')?.value,
        variedadId: c.get('variantId')?.value,
        quantity: c.get('quantity')?.value,
        retail_price: c.get('retail_price')?.value,
      } as any;
      // Ensure files array is present and includes both url and file_url for backend compatibility
      if (fileUrl && fileUrl.length > 0) {
        base.productImage = fileUrl;
        base.files = [{ type: 'default', url: fileUrl, file_url: fileUrl, filename: '' }];
      } else {
        base.files = [];
      }
      console.debug(`Prepare item[${idx}] payload:`, base);
      return base;
    });

    const payload: any = {
      sale: { total: Number(this.form.get('costs.subtotal')?.value || 0) },
      sale_address: this.form.get('address')?.value,
      items: itemsPayload,
      costs: this.form.get('costs')?.value
    };

  // Debug final payload before sending to backend
  console.debug('Final admin correction payload:', payload);

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
