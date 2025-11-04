import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from "@angular/core";
import { AdminChatService } from "../../services/admin-chat.service";
import { Subscription } from "rxjs";
import { Router } from "@angular/router";
import { UsersService } from "src/app/modules/users/_services/users.service";
import { Toaster } from 'ngx-toast-notifications';
import { NoticyAlertComponent } from 'src/app/componets/notifications/noticy-alert/noticy-alert.component';
import { ReturnsService } from "src/app/modules/returns/_services/returns.service";
import { AdminSalesService } from "src/app/modules/admin-sales/services/admin-sales.service";

@Component({
  selector: "app-conversation-detail",
  templateUrl: "./conversation-detail.component.html",
  styleUrls: ["./conversation-detail.component.scss"],
})
export class ConversationDetailComponent implements OnInit, OnDestroy {
  @ViewChild("messagesContainer") messagesContainer!: ElementRef;

  messages: any[] = [];
  newMessage = "";
  selected: any = null;
  subs: Subscription[] = [];

  menuOpen = false;
  isTyping = false;

  constructor(
    private router: Router,
    public chat: AdminChatService,
    private returnsService: ReturnsService,
    public userService: UsersService,
    public toaster: Toaster,
    public salesService: AdminSalesService
  ) {}

  ngOnInit(): void {

    this.subscribeToSelectedConversation();
    this.subscribeToMessages();

    // this.subs.push(
    //   this.chat.selectedConversation$.subscribe((c) => {
    //     this.selected = c;
    //     this.messages = c?.messages ? [...c.messages] : [];
    //     // scroll after a short delay to allow DOM update
    //     setTimeout(() => this.scrollToBottom(), 50);
    //   })
    // );

    // this.subs.push(
    //   this.chat.messages$.subscribe((msgs) => {
    //     this.messages = msgs || [];
    //     setTimeout(() => this.scrollToBottom(), 50);
    //   })
    // );
  }

  // Suscribe al observable de la conversación seleccionada
  private subscribeToSelectedConversation(): void {
    this.subs.push(
      this.chat.selectedConversation$.subscribe(conversation => {
        this.selected = conversation;
        this.updateMessages(conversation?.messages);
      })
    );
  }

  // Suscribe al observable de los mensajes
  private subscribeToMessages(): void {
    this.subs.push(
      this.chat.messages$.subscribe(msgs => {
        this.updateMessages(msgs);
      })
    );
  }

  // Actualiza los mensajes y hace scroll al final
  private updateMessages(msgs: any[] | undefined): void {
    this.messages = msgs ? [...msgs] : [];
    this.scrollToBottomWithDelay();
  }

  // Scroll con retraso para asegurar que el DOM se actualice
  private scrollToBottomWithDelay(): void {
    setTimeout(() => this.scrollToBottom(), 50);
  }

  getAvatar(senderType: string, userId?: number): string {
    if (senderType === "agent") {
      return "assets/media/avatars/agent-avatar.png";
    }
    return "assets/media/avatars/user-avatar1.png";
  }

  onAvatarError(senderType: "user" | "agent") {
    this.showFallback[senderType] = true;
  }

  showFallback = {
    user: false,
    agent: false,
  };

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  get userInitial(): string {
    return ((this.selected?.user_name ?? "U") + "").slice(0, 1).toUpperCase();
  }

  send() {
    if (!this.newMessage || !this.selected) return;
    this.chat.sendAgentMessage(this.selected, this.newMessage);
    this.newMessage = "";
    setTimeout(() => this.scrollToBottom(), 50);
  }

  closeConversation() {
    if (!this.selected) return;
    this.chat.closeConversation(this.selected);
  }

  takeConversation() {
    if (!this.selected) return;
    this.chat.takeConversation(this.selected);
  }

  /**
   * Determina si una conversación pertenece a un usuario invitado (Guest) no registrado.
   * 
   * Condiciones:
   *  - user_id es null o undefined → no es un usuario registrado
   *  - guest_id existe y es una cadena → es un Guest válido
   * 
   * @param conversation Objeto de conversación que contiene user_id y guest_id
   * @returns true si la conversación pertenece a un Guest, false si es un usuario registrado o datos inválidos
   */
  isGuest(conversation: any): boolean {
    return !conversation.user_id && !!conversation.guest_id && typeof conversation.guest_id === 'string';
  }

  handleReturnRequest(selected: any) {
    if (!selected) return;

    console.log('♻️ Gestionar devolución para:', selected);

    if (this.isGuest(selected)) {
      console.log('¡Es un Guest!', selected);
      this.getGuestById(selected, 'returns'); 
      return;
    }

    const userId = selected.user_id ?? selected.userId ?? null;

    // Si no, intenta pedir al backend por id
    if (userId) {
      this.getUserById(selected, 'returns');
      return;
    } else {
      console.warn('No hay userId ni email/nombre');
    }

    // Si no tiene ni user_id ni guest_id, intentar buscar por email
    const email = selected.user_email || selected.email;
    if (email) {
      this.navigateToListByEmail(email, 'returns');
    } else {
      console.warn('No se pudo identificar al cliente para gestionar devolución.');
      this.toaster.open(NoticyAlertComponent, {
        text: `warning-No se pudo identificar al cliente para gestionar devolución.`,
      });
    }
  }



  /**
   * Muestra la información de un usuario o guest cuando se hace clic en su avatar o nombre.
   * 
   * Flujo de ejecución:
   * 1. Valida que se haya proporcionado un usuario seleccionado.
   * 2. Si es un Guest (usuario no registrado), llama a `getGuestById` para obtener sus datos completos y navegar al listado de guests.
   * 3. Si es un usuario registrado y ya tiene email o nombre, navega directamente al listado de usuarios filtrando por ese valor.
   * 4. Si no tiene email/nombre pero tiene un userId, solicita los datos al backend con `getUserById` y luego navega al listado de usuarios.
   * 5. Si no hay guest ni usuario válido, muestra una advertencia en consola.
   * 
   * @param selectedUser Objeto que representa al usuario o guest seleccionado en la conversación
   */
  showUserInfo(selectedUser: any) {
    console.log('Ver usuario clicado:', selectedUser);
    if (!selectedUser) return;

    // Validación robusta de Guest
    if (this.isGuest(selectedUser)) {
      console.log('¡Es un Guest válido!', selectedUser);
      this.getGuestById(selectedUser, 'guests'); 
      return;
    }

    const userId = selectedUser.user_id ?? selectedUser.userId ?? null;
    const maybeEmail = selectedUser.user_email || selectedUser.userEmail || selectedUser.email || null;
    const maybeName = selectedUser.user_name || selectedUser.userName || selectedUser.name || null;

    // Si ya tienes email o name, navega directamente
    if (maybeEmail || maybeName) {
      this.menuOpen = false;
      const searchValue = maybeEmail || maybeName;
      this.router.navigate(['/users/list'], { queryParams: { search: searchValue } });
      return;
    }

    // Si no, intenta pedir al backend por id
    if (userId) {
      this.getUserById(selectedUser, 'users');
    } else {
      console.warn('No hay userId ni email/nombre');
    }
  }

  /**
   * Abre el historial de pedidos de un usuario o guest desde la conversación.
   * 
   * Flujo de ejecución:
   * 1. Valida que se haya proporcionado un objeto seleccionado.
   * 2. Si es un Guest (guest_id presente), llama a `getGuestById` para obtener sus datos y navegar al listado de ventas.
   * 3. Si es un usuario registrado (user_id presente), llama a `getUserById` para obtener sus datos y navegar al listado de ventas.
   * 4. Si no tiene guest_id ni user_id pero tiene email, navega directamente al listado de ventas filtrando por ese email.
   * 5. Si no hay información válida, no realiza ninguna acción.
   * 
   * @param selected Objeto que representa al usuario o guest seleccionado en la conversación
   */
  viewOrderHistory(selected: any) {
    if (!selected) return;

    console.log('📦 Ver historial de pedidos de:', selected);

    if (this.isGuest(selected)) { //if (selected.guest_id) {
      this.getGuestById(selected, 'sales');
      return;
    }

    const userId = selected.user_id ?? selected.userId ?? null;

    if (userId) {
      console.log('📦 Ver historial de pedidos de con usuario ID:', selected);
      this.getUserById(selected, 'sales');
      return;
    } else {
      console.warn('No hay userId ni email/nombre');
    }

    const email = selected.user_email || selected.email;
    if (email) {
      this.navigateToListByEmail(email, 'sales');
    }
  }

  /**
   * Obtiene la información completa de un usuario registrado por su ID y navega al listado correspondiente.
   * 
   * Flujo de ejecución:
   * 1. Valida que se haya proporcionado un objeto `selectedUser`.
   * 2. Extrae el `user_id` del objeto.
   * 3. Llama al servicio `userService.getUserById` para obtener los datos completos del usuario.
   * 4. Si se encuentra el usuario, determina un valor de búsqueda (`searchValue`) usando email o nombre, y navega al listado correspondiente (`users` o `sales`).
   * 5. Maneja errores mostrando notificaciones con `Toaster`.
   * 
   * @param selectedUser Objeto del usuario seleccionado
   * @param listType Determina a qué listado navegar: 'users' (por defecto) o 'sales'
   */
  getUserById(selectedUser: any, listType: 'users' | 'sales' | 'returns' = 'users') {
    if (!selectedUser) return;

    const userId = selectedUser.user_id ?? selectedUser.userId ?? null;

    if (!userId) return;

    this.userService.getUserById(userId).subscribe(
      (resp:any) => {
        const user = resp?.user;

        if (!user) return;

        const searchValue = user.email || user.user_email || user.name || user.user_name || String(userId);
        this.menuOpen = false;
        //this.navigateToListByEmail(searchValue, listType); 

        if (listType === 'returns') {
          // 🔍 1️⃣ Comprobar si el usuario tiene devoluciones registradas
          this.returnsService.hasReturns(searchValue).subscribe(has => {
            if (has.hasReturns) {
              // ✅ Tiene devoluciones → abrir lista filtrada
              this.navigateToListByEmail(searchValue, listType);
            } else {
              // No existe devolución → abrir formulario nuevo con email prellenado
              //this.navigateToListByEmail(searchValue, listType, true); // createIfEmpty = true

              // 🔍 2️⃣ No tiene devoluciones → comprobar si tiene ventas
              this.salesService.hasSales({ q: searchValue }).subscribe(
                (salesResp: any) => {
                  if (salesResp.hasSales) {
                    // ✅ Tiene ventas → crear devolución nueva
                    this.navigateToListByEmail(searchValue, listType, true);
                  } else {
                    // ⚠️ No tiene ventas → mostrar aviso
                    this.toaster.open(NoticyAlertComponent, {
                      text: `warning-El usuario ${searchValue} no tiene pedidos para generar una devolución.`,
                    });
                  }
                },
                (error) => {
                  console.error('[hasSales error]', error);
                }
              );
            }
          });
        } else {
          // 🧭 Para otros listType: users, sales, guests, etc.
          this.navigateToListByEmail(searchValue, listType);
        }
    }, (error) => {
      if (error.error) {
        this.toaster.open(NoticyAlertComponent, {text: `danger-${error.error.message}.`});
      }
    });
  }

  /**
   * Obtiene la información completa de un guest por su ID y navega al listado correspondiente.
   * 
   * Flujo de ejecución:
   * 1. Valida que se haya proporcionado un `guestId`.
   * 2. Llama al servicio `userService.getGuestById` para obtener los datos completos del guest.
   * 3. Si se encuentra el guest, determina un valor de búsqueda (`searchValue`) usando email o nombre, y navega al listado correspondiente (`guests` o `sales`).
   * 4. Maneja errores mostrando notificaciones con `Toaster`.
   * 
   * @param guestId ID del guest a buscar
   * @param listType Determina a qué listado navegar: 'guests' (por defecto) o 'sales'
   */
  getGuestById(selectedGuest: any, listType: 'guests' | 'sales' | 'returns' = 'guests') {
    if (!selectedGuest) return;

    const guestId = selectedGuest.guest_id ?? selectedGuest.guestId ?? null;

    if (!guestId) return;

    this.userService.getGuestById(guestId).subscribe(
      (resp: any) => {
        const guest = resp?.guest;
        if (!guest) return;

        const searchValue = guest.email || guest.name || String(guestId);
        this.menuOpen = false;
        //this.navigateToListByEmail(searchValue, listType); 
        if (listType === 'returns') {
          // 🔍 1️⃣ Comprobar si el usuario tiene devoluciones registradas
          this.returnsService.hasReturns(searchValue).subscribe(has => {
            if (has.hasReturns) {
              // ✅ Tiene devoluciones → abrir lista filtrada
              this.navigateToListByEmail(searchValue, listType);
            } else {
              // No existe devolución → abrir formulario nuevo con email prellenado
              //this.navigateToListByEmail(searchValue, listType, true); // createIfEmpty = true
              
              // 🔍 2️⃣ No tiene devoluciones → comprobar si tiene ventas
              this.salesService.hasSales({ q: searchValue }).subscribe(
                (salesResp: any) => {
                  if (salesResp.hasSales) {
                    // ✅ Tiene ventas → crear devolución nueva
                    this.navigateToListByEmail(searchValue, listType, true);
                  } else {
                    // ⚠️ No tiene ventas → mostrar aviso
                    this.toaster.open(NoticyAlertComponent, {
                      text: `warning-El usuario ${searchValue} no tiene pedidos para generar una devolución.`,
                    });
                  }
                },
                (error) => {
                  console.error('[hasSales error]', error);
                }
              );
            }
          });
        } else {
          // Para otros listType normales
          this.navigateToListByEmail(searchValue, listType);
        }
      },
      (error) => {
        console.error('Error obteniendo guest:', error);
        if (error.error) {
          this.toaster.open(NoticyAlertComponent, { text: `danger-${error.error.message}.` });
        }
      }
    );
  }

  /**
   * Navega al listado correspondiente ('users', 'guests' o 'sales') usando un valor de búsqueda.
   * 
   * Flujo de ejecución:
   * 1. Valida que se haya proporcionado un valor de búsqueda (`emailOrId`).
   * 2. Cierra el menú desplegable (`menuOpen = false`).
   * 3. Redirige usando el router a la ruta correspondiente con el query param `search` igual al valor proporcionado.
   * 
   * @param emailOrId Email, nombre o ID que se usará como filtro en el listado
   * @param listType Determina a qué listado navegar: 'users', 'guests' o 'sales'
   */
  private navigateToListByEmail(emailOrId: string, listType: 'users' | 'guests' | 'returns' | 'sales', createIfEmpty: boolean = false) {
    if (!emailOrId) return;
    this.menuOpen = false;
    //this.router.navigate([`/${listType}/list`], { queryParams: { search: emailOrId } });
    // Si queremos crear nueva devolución cuando no hay resultados
    if (listType === 'returns' && createIfEmpty) {
      this.router.navigate(['/returns/detail', 'new'], { queryParams: { q: emailOrId } });
    } else {
      this.router.navigate([`/${listType}/list`], { queryParams: { search: emailOrId } });
    }
  }

  /**
   * Convierte distintos tipos de entrada de tiempo a un objeto Date válido.
   * 
   * Soporta:
   * 1. Instancias de Date ya válidas → se devuelven tal cual.
   * 2. Números (timestamps en milisegundos) → se convierten a Date.
   * 3. Cadenas de texto:
   *    - Formato "HH:mm" → se crea un Date con la hora y minutos especificados para el día actual.
   *    - Formato ISO u otras cadenas reconocibles por Date() → se convierten a Date.
   * 
   * Retorna null si el valor no es válido o no puede convertirse a Date.
   * 
   * @param time Valor de tiempo a convertir (Date | number | string)
   * @returns Objeto Date válido o null si no se puede convertir
   */
  getDateFromTime(time: any): Date | null {
    if (!time) return null;

    // Si ya es un Date válido
    if (time instanceof Date && !isNaN(time.getTime())) {
      return time;
    }

    // Si viene como número (timestamp)
    if (typeof time === "number") {
      const date = new Date(time);
      return isNaN(date.getTime()) ? null : date;
    }

    // Si viene como string (ISO o con hora HH:mm)
    if (typeof time === "string") {
      // Si es formato hora "HH:mm"
      if (/^\d{1,2}:\d{2}$/.test(time)) {
        const [h, m] = time.split(":").map(Number);
        const date = new Date();
        date.setHours(h, m, 0, 0);
        return date;
      }

      // Si es formato ISO u otra cadena reconocible por Date()
      const date = new Date(time);
      return isNaN(date.getTime()) ? null : date;
    }

    return null;
  }

  private scrollToBottom() {
    try {
      const el = this.messagesContainer?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    } catch (e) {
      // ignore
    }
  }


  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  checkCurrentOrders(userId: number) {
    console.log('Ver pedidos activos de userId:', userId);
    // Igual, abrir modal o panel lateral con pedidos en curso
    this.menuOpen = false;
  }

}
