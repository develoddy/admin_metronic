import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { LayoutService } from '../../../../../core';
import { ProductService } from 'src/app/modules/product/_services/product.service';
import { NotificationsService } from 'src/app/_metronic/shared/crud-table/services/notifications.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { NgbDropdown } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-notifications-dropdown-inner',
  templateUrl: './notifications-dropdown-inner.component.html',
  styleUrls: ['./notifications-dropdown-inner.component.scss'],
})
export class NotificationsDropdownInnerComponent implements OnInit {
  @Input() dropdownRef: NgbDropdown;
  @Output() closeDropdown = new EventEmitter<void>();
  extrasNotificationsDropdownStyle: 'light' | 'dark' = 'dark';
  activeTabId:
    | 'topbar_notifications_notifications'
    | 'topbar_notifications_events'
    | 'topbar_notifications_logs' = 'topbar_notifications_notifications';

  notifications: any[] = [];
  private sub: Subscription;
  
  constructor(
    private layout: LayoutService,
    public _productService: ProductService,
    private notificationsService: NotificationsService,
    private cd: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.extrasNotificationsDropdownStyle = this.layout.getProp(
      'extras.notifications.dropdown.style'
    );

    // 🔹 Traer notificaciones históricas desde DB
    this.notificationsService.getNotifications(50).subscribe({
      next: (resp: any) => {
        console.log('Notificaciones históricas:', resp);
        if (resp.success && resp.notifications) {
          this.notifications = resp.notifications;

          this.notifications = resp.notifications.map((n: any) => ({
              ...n,
              time: new Date(n.createdAt).toLocaleTimeString(),
              icon: n.icon || './assets/media/svg/icons/Shopping/Box3.svg',
              shipment: n.shipment || null,
              sale: n.sale || null
          }));
          this.cd.detectChanges();
        }
      },
      error: (err) => console.error('Error al obtener notificaciones:', err),
    });
    
    // 🔔 Suscripción al flujo de notificaciones en tiempo real
    this.sub = this.notificationsService.notifications$.subscribe((notif) => {
      console.log('Nueva notificación recibida:', notif);
      // Evitar duplicados: si ya existe en el array, no agregar
      const exists = this.notifications.find(n => n.id === notif.id);
      if (exists) return;

      this.notifications.unshift({
        ...notif, // 🔹 Copia todas las propiedades originales
        time: new Date(notif.createdAt).toLocaleTimeString(),
        icon: notif.icon || './assets/media/svg/icons/General/Attachment2.svg',
        shipment: notif.shipment || null,
        sale: notif.sale || null
      });

      this.cd.detectChanges();
    });
  }

  openNotification(event: Event, notif: any) {
    event.preventDefault(); // Cancela la navegación nativa del <a>

    // Marcar como leída si no lo está
    if (!notif.isRead) {
      this.notificationsService.markAsRead(notif.id).subscribe({
        next: (resp: any) => {
          if (resp.success) {
            notif.isRead = true;
            console.log('Notificación marcada como leída:', notif.id);
          }
        },
        error: (err) => console.error('Error al marcar notificación como leída:', err)
      });
    }

    // 🔹 Cerrar dropdown
    this.closeDropdown.emit();
    
    // 🔹 Navegar después de cerrar
    setTimeout(() => {
      if (notif.shipment?.id) {
        this.router.navigate(['/shipping/detail', notif.shipment.id]);
      } else if (notif.sale?.id) {
        this.router.navigate(['/sales/detail', notif.sale.id]);
      }
    }, 0);

  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  setActiveTabId(tabId:any) {
    this.activeTabId = tabId;
  }

  getActiveCSSClasses(tabId: any) {
    return tabId === this.activeTabId ? 'active show' : '';
  }
}
