import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ShippingService } from '../../_services/shipping.service';

@Component({
  selector: 'app-shipping-detail',
  templateUrl: './shipping-detail.component.html',
  styleUrls: ['./shipping-detail.component.scss']
})
export class ShippingDetailComponent implements OnInit {

  shipping: any = null;

  // Variables desestructuradas
  carrier: string = '';
  trackingNumber: string = '';
  service: string = '';
  sale: any = null;
  customer: any = null;
  addresses: any[] = [];
  items: any[] = [];

  id: any = null;

  constructor(
    private route: ActivatedRoute,
    private dc: ChangeDetectorRef,
    private svc: ShippingService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.id = params.get('id');
      if (this.id) this.load();
    });
  }

  load(){
    console.log("Load get shipping ID: ", this.id);
    
    this.svc.getShipmentById(this.id).subscribe((resp:any) => {
      console.log("Get Shipping Detail : ", resp);
      if (resp && resp.shipment) {
        this.shipping = resp?.shipment || resp;

        // Desestructuramos
        this.carrier = this.shipping.carrier;
        this.trackingNumber = this.shipping.trackingNumber;
        console.log("Tracking Number: ", this.trackingNumber);
        this.service = this.shipping.service;

        this.sale = this.shipping.sale || {};
        this.customer = this.sale.user || this.sale.guest || {};
        this.addresses = this.sale.sale_addresses || [];
        this.items = this.sale.items || [];
        
      }
      this.dc.detectChanges();
    }, err => console.error('getShipmentById error', err));
  }

  getSubtotal(): number {
    if (!this.items || this.items.length === 0) return 0;
    return this.items.reduce((acc, item) => acc + (item.subtotal || item.total || 0), 0);
  }

  getVAT(): number {
    // Por ahora fijo 0% IVA, si luego agregas impuestos dinámicos, ajustamos aquí
    return 0;
  }

  getShippingRate(): number {
    // Si más adelante lo guardas en DB, lo puedes obtener de this.shipping.shippingCost
    // De momento asumimos tarifa estándar
    return 0;
  }


}
