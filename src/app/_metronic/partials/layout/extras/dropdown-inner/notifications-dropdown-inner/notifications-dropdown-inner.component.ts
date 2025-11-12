import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { LayoutService } from '../../../../../core';
import { ProductService } from 'src/app/modules/product/_services/product.service';
import { NotificationsService } from 'src/app/_metronic/shared/crud-table/services/notifications.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notifications-dropdown-inner',
  templateUrl: './notifications-dropdown-inner.component.html',
  styleUrls: ['./notifications-dropdown-inner.component.scss'],
})
export class NotificationsDropdownInnerComponent implements OnInit {
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
    private cd: ChangeDetectorRef
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
          this.notifications = resp.notifications.map((n: any) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            time: new Date(n.createdAt).toLocaleTimeString(),
            icon: n.icon || './assets/media/svg/icons/General/Attachment2.svg',
            color: n.color || 'success',
            isRead: n.isRead,
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
        id: notif.id || null, 
        title: notif.title || 'Actualización de envío',
        message: notif.message || 'Se ha actualizado un envío',
        time: new Date().toLocaleTimeString(),
        icon: notif.icon || './assets/media/svg/icons/General/Attachment2.svg',
        color: notif.color || 'success',
      });

      this.cd.detectChanges();
    });
  }

  openNotification(notif: any) {
    // Si ya está leída, no hacemos nada
    if (notif.isRead) return;

    // Llamada al service para marcarla como leída
    this.notificationsService.markAsRead(notif.id).subscribe({
      next: (resp: any) => {
        if (resp.success) {
          // Actualizamos la notificación en el array
          notif.isRead = true;
          this.cd.detectChanges();
          console.log('Notificación marcada como leída:', notif.id);
        }
      },
      error: (err) => console.error('Error al marcar notificación como leída:', err)
    });
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
