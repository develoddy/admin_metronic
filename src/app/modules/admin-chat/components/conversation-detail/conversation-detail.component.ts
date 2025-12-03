import {
  AfterViewInit,
  ChangeDetectorRef,
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
import { CustomerContextService } from "../../services/customer-context.service";
import { ChatIntentService } from "../../services/chat-intent.service";
import { PrintfulRealTimeService } from "../../services/printful-realtime.service";
import { AutoResponseService, AutoResponseSuggestion, AutoResponseTemplate } from "../../services/auto-response.service";
import { CustomerContext, ChatIntent } from "../../models/customer-context.model";
import { WebhookNotificationService } from "../../services/webhook-notification.service";

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

  // ✅ Nuevas propiedades para Customer Context Panel
  customerContext: CustomerContext | null = null;
  isLoadingContext = false;
  lastDetectedIntent: ChatIntent | null = null;

  // FASE 2B: Auto-respuesta
  autoResponseSuggestion: AutoResponseSuggestion | null = null;
  autoResponseTemplates: AutoResponseTemplate[] = [];
  selectedTemplateIndex: number | null = null;
  showAutoResponsePanel = false;
  isGeneratingResponse = false;

  // ✅ FASE 2B: Datos para el panel IA en el sidebar
  aiAssistantPanelData: any = null;
  @ViewChild('contextSidebar') contextSidebar: any;

  constructor(
    private router: Router,
    public chat: AdminChatService,
    private returnsService: ReturnsService,
    public userService: UsersService,
    public toaster: Toaster,
    public salesService: AdminSalesService,
    private contextService: CustomerContextService,
    public intentService: ChatIntentService,
    private printfulService: PrintfulRealTimeService,
    private autoResponseService: AutoResponseService,
    private webhookService: WebhookNotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Iniciar escucha de webhooks Printful
    this.webhookService.startListening();
    console.log('[ConversationDetail] WebhookNotificationService iniciado');

    this.subscribeToSelectedConversation();
    this.subscribeToMessages();
    this.subscribeToContextRefresh();

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
        
        // ✅ Cargar contexto del cliente cuando cambia la conversación
        if (conversation) {
          this.loadCustomerContext(conversation);
        } else {
          this.customerContext = null;
        }
      })
    );
  }

  // Suscribe al observable de los mensajes
  private subscribeToMessages(): void {
    this.subs.push(
      this.chat.messages$.subscribe(msgs => {
        this.updateMessages(msgs);
        
        // ✅ Detectar intención del último mensaje de usuario
        if (msgs && msgs.length > 0) {
          const lastMsg = msgs[msgs.length - 1];
          if (lastMsg.sender_type === 'user') {
            this.lastDetectedIntent = this.intentService.detectIntent(lastMsg.message);
            console.log('[ChatIntent] Detectado:', this.lastDetectedIntent);
            
            // FASE 2A: Validar intents con tracking
            this.handleIntentWithTracking(this.lastDetectedIntent);

            // FASE 2B: Generar auto-respuesta
            this.generateAutoResponse(this.lastDetectedIntent);
          }
        }
      })
    );
  }

  /**
   * FASE 2B: Suscribe a eventos de actualización de contexto desde webhooks
   */
  private subscribeToContextRefresh(): void {
    this.subs.push(
      this.chat.contextRefresh$.subscribe((event) => {
        console.log('[ConversationDetail] 🔄 Context refresh event:', event);

        // Insertar mensaje system si viene de webhook
        if (event.data.systemMessage) {
          this.insertSystemMessage(event.data.systemMessage);
        }

        // Refrescar contexto del cliente si está abierta la conversación
        if (this.selected && this.customerContext) {
          console.log('[ConversationDetail] Refrescando contexto del cliente...');
          this.loadCustomerContext(this.selected);
        }
      })
    );
  }

  /**
   * Inserta mensaje system en la conversación actual
   */
  private insertSystemMessage(systemMsg: any): void {
    console.log('[ConversationDetail] 💬 Insertando mensaje system:', systemMsg);

    // Agregar a la lista de mensajes
    const newMessage = {
      id: `system_${Date.now()}`,
      conversation_id: this.selected?.conversation_id || this.selected?.id,
      sender_type: 'system',
      message: systemMsg.message,
      timestamp: new Date().toISOString(),
      meta: systemMsg.meta
    };

    this.messages = [...this.messages, newMessage];
    setTimeout(() => this.scrollToBottom(), 100);

    // Mostrar toast
    this.toaster.open({
      text: `🔔 ${systemMsg.label}: ${systemMsg.message.substring(0, 60)}...`,
      type: 'info',
      duration: 5000
    });
  }

  /**
   * FASE 2A: Maneja intents relacionados con problemas de entrega
   * Consulta Printful en tiempo real si es necesario
   */
  private handleIntentWithTracking(intent: ChatIntent): void {
    if (!intent || !this.customerContext) return;

    // Solo procesar intents relacionados con tracking
    if (intent.type !== 'DELIVERY_PROBLEM' && intent.type !== 'TRACKING_INFO') {
      return;
    }

    console.log('[ConversationDetail] 🔍 Validando intent con tracking...');

    // Buscar orden mencionada o usar la más reciente
    const orderId = intent.extractedData?.orderId;
    let targetOrder = null;

    if (orderId) {
      targetOrder = this.customerContext.activeOrders.find(o => o.id === orderId);
    } else if (this.customerContext.activeOrders.length > 0) {
      // Usar la orden más reciente
      targetOrder = this.customerContext.activeOrders[0];
    }

    if (!targetOrder) {
      console.warn('[ConversationDetail] No se encontró orden para validar tracking');
      return;
    }

    // Verificar si es orden de Printful
    if (!targetOrder.printfulOrderId) {
      console.log('[ConversationDetail] Orden no es de Printful');
      
      if (intent.type === 'DELIVERY_PROBLEM') {
        // Sugerencia automática al admin
        this.suggestResponseForNonPrintful(targetOrder);
      }
      return;
    }

    // Consultar Printful en tiempo real
    this.validatePrintfulTracking(targetOrder, intent);
  }

  /**
   * Valida tracking de orden Printful en tiempo real
   */
  private validatePrintfulTracking(order: any, intent: ChatIntent): void {
    console.log(`[ConversationDetail] 📍 Consultando Printful para orden #${order.id}...`);

    this.printfulService.getOrderStatus(order.printfulOrderId).subscribe({
      next: (printfulData) => {
        if (!printfulData) {
          console.error('[ConversationDetail] No se obtuvo respuesta de Printful');
          return;
        }

        // Verificar si tiene tracking
        const hasTracking = printfulData.shipments && printfulData.shipments.length > 0;

        if (hasTracking) {
          // Orden enviada: Consultar estado de tracking
          this.printfulService.getTracking(order.printfulOrderId).subscribe({
            next: (tracking) => {
              const isDelayed = this.printfulService.isDelayed(order);
              const daysDelayed = isDelayed ? this.printfulService.getDaysDelayed(order) : 0;

              this.suggestTrackingResponse(order, tracking, isDelayed, daysDelayed, printfulData);
            }
          });
        } else {
          // Orden NO enviada aún
          this.suggestNoTrackingResponse(order, printfulData);
        }
      },
      error: (err) => {
        console.error('[ConversationDetail] Error al consultar Printful:', err);
      }
    });
  }

  /**
   * Sugiere respuesta cuando la orden tiene tracking
   */
  private suggestTrackingResponse(order: any, tracking: any, isDelayed: boolean, daysDelayed: number, printfulData: any): void {
    const status = this.printfulService.translateStatus(printfulData.status);
    
    let suggestion = `📦 Información de tu pedido #${order.id}:\n\n`;
    suggestion += `🔹 Estado actual: ${status}\n`;
    
    if (tracking) {
      suggestion += `🔹 Tracking: ${tracking.trackingNumber}\n`;
      suggestion += `🔹 Transportista: ${tracking.carrier}\n`;
      
      if (tracking.trackingUrl) {
        suggestion += `🔗 Puedes rastrearlo aquí: ${tracking.trackingUrl}\n\n`;
      }
    }

    if (isDelayed) {
      suggestion += `⚠️ NOTA: Tu pedido tiene un retraso de ${daysDelayed} días respecto a la fecha estimada.\n`;
      suggestion += `Estamos trabajando para resolver esta situación. Te mantendremos informado.`;
    } else {
      suggestion += `✅ Tu pedido va según lo previsto.`;
    }

    console.log('[ConversationDetail] 💡 Sugerencia de respuesta generada (con tracking)');
    console.log(suggestion);

    // Aquí podrías mostrar esta sugerencia en la UI o enviarla automáticamente
    // Por ahora solo la registramos en consola
  }

  /**
   * Sugiere respuesta cuando NO hay tracking
   */
  private suggestNoTrackingResponse(order: any, printfulData: any): void {
    const status = this.printfulService.translateStatus(printfulData.status);
    
    let suggestion = `📦 Estado de tu pedido #${order.id}:\n\n`;
    suggestion += `🔹 Estado actual: ${status}\n`;
    suggestion += `🔹 Tracking: Aún no disponible\n\n`;
    
    if (printfulData.status === 'draft' || printfulData.status === 'pending') {
      suggestion += `⏳ Tu pedido está siendo preparado en nuestra planta de producción.\n`;
      suggestion += `El tracking estará disponible una vez que sea enviado (normalmente 3-5 días hábiles).\n\n`;
      suggestion += `📅 Entrega estimada: ${order.minDeliveryDate ? this.formatDate(order.minDeliveryDate) : 'Calculando...'}`;
    } else if (printfulData.status === 'inprocess') {
      suggestion += `🖨️ Tu producto está siendo impreso en este momento.\n`;
      suggestion += `Una vez completado, será empaquetado y enviado (1-2 días hábiles).\n\n`;
      suggestion += `Te notificaremos cuando esté en camino.`;
    } else {
      suggestion += `La orden aún no ha sido enviada por Printful.\n`;
      suggestion += `Te avisaremos en cuanto tengamos novedades.`;
    }

    console.log('[ConversationDetail] 💡 Sugerencia de respuesta generada (sin tracking)');
    console.log(suggestion);
  }

  /**
   * Sugiere respuesta para órdenes NO Printful
   */
  private suggestResponseForNonPrintful(order: any): void {
    const suggestion = `📦 Pedido #${order.id}:\n\nEsta orden no es manejada por Printful, es un pedido directo.\n\nPuedes consultar el estado en nuestro panel de ventas.`;
    
    console.log('[ConversationDetail] 💡 Sugerencia de respuesta (orden no Printful)');
    console.log(suggestion);
  }

  private formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
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

  // ✅ Carga el contexto completo del cliente (pedidos, devoluciones, stats)
  private loadCustomerContext(conversation: any): void {
    console.log('[CustomerContext] Iniciando carga para conversación:', conversation);
    
    // Intentar obtener identificador directamente
    let identifier = this.getCustomerIdentifier(conversation);
    
    if (!identifier) {
      console.warn('[CustomerContext] No hay email en conversación, intentando obtener de usuario/guest...');
      console.log('[CustomerContext] Conversación data:', {
        user_id: conversation.user_id,
        guest_id: conversation.guest_id,
        user_email: conversation.user_email,
        guest_email: conversation.guest_email
      });
      
      // Si hay user_id, obtener datos del usuario
      if (conversation.user_id) {
        this.fetchUserEmail(conversation.user_id, conversation);
        return;
      }
      
      // Si es guest, intentar obtener datos del guest
      if (conversation.guest_id) {
        this.fetchGuestEmail(conversation.guest_id, conversation);
        return;
      }
      
      // Si no hay ni user_id ni guest_id, no podemos cargar contexto
      console.error('[CustomerContext] No se puede obtener identificador: sin user_id ni guest_id');
      this.customerContext = null;
      return;
    }

    console.log('[CustomerContext] Identificador encontrado:', identifier);
    this.loadContextWithIdentifier(identifier, conversation);
  }

  // ✅ Obtiene el email del usuario desde el backend
  private fetchUserEmail(userId: number, conversation: any): void {
    console.log('[CustomerContext] Obteniendo email de usuario:', userId);
    this.isLoadingContext = true;

    // Usar el endpoint de users para obtener el email
    this.userService.allUsers('').subscribe({
      next: (resp: any) => {
        const users = resp.users || [];
        const user = users.find((u: any) => u._id === userId || u.id === userId);
        
        if (user && user.email) {
          console.log('[CustomerContext] ✅ Email de usuario encontrado:', user.email);
          this.loadContextWithIdentifier(user.email, conversation);
        } else {
          console.error('[CustomerContext] ❌ Usuario no encontrado o sin email');
          this.customerContext = null;
          this.isLoadingContext = false;
        }
      },
      error: (err) => {
        console.error('[CustomerContext] ❌ Error obteniendo usuario:', err);
        this.customerContext = null;
        this.isLoadingContext = false;
      }
    });
  }

  // ✅ Obtiene el email del guest desde session_id o guest_id
  private fetchGuestEmail(guestId: string, conversation: any): void {
    console.log('[CustomerContext] Guest detectado:', guestId);
    // Por ahora, los guests no tienen email garantizado
    // Podríamos usar session_id como fallback o mejorar el backend
    console.warn('[CustomerContext] Los guests no tienen email garantizado, usando guest_id como identificador');
    
    // Temporal: usar guest_id como identificador (esto puede no funcionar bien)
    // TODO: Mejorar backend para incluir guest_email en conversaciones
    this.customerContext = null;
    this.isLoadingContext = false;
  }

  // ✅ Carga el contexto una vez que tenemos el identificador
  private loadContextWithIdentifier(identifier: string, conversation: any): void {
    const type = this.isGuest(conversation) ? 'guest' : 'user';
    console.log('[CustomerContext] Tipo de cliente:', type);
    
    this.isLoadingContext = true;

    this.contextService.getCustomerContext(identifier, type).subscribe({
      next: (context) => {
        this.customerContext = context;
        this.isLoadingContext = false;
        console.log('[CustomerContext] ✅ Cargado exitosamente:', context);
        console.log('[CustomerContext] Stats:', context.stats);
        console.log('[CustomerContext] Pedidos activos:', context.activeOrders.length);
      },
      error: (err) => {
        console.error('[CustomerContext] ❌ Error al cargar:', err);
        this.customerContext = null;
        this.isLoadingContext = false;
      }
    });
  }

  // ✅ Obtiene el identificador del cliente (email preferentemente)
  private getCustomerIdentifier(conversation: any): string | null {
    return conversation.user_email || 
           conversation.guest_email || 
           conversation.email || 
           null;
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

  /**
   * Obtiene el nombre de visualización del usuario para mostrar en el header
   * Prioridad: user_name > guest_name > "Usuario #user_id" > "Invitado #guest_id" > "Conversación #id"
   */
  getUserDisplayName(conversation: any): string {
    if (!conversation) return 'Sin nombre';
    
    // Prioridad 1: user_name del backend (nombre completo del usuario)
    if (conversation.user_name) {
      return conversation.user_name;
    }
    
    // Prioridad 2: guest_name del backend
    if (conversation.guest_name) {
      return conversation.guest_name;
    }
    
    // Prioridad 3: Si tiene user_id, mostrar como "Usuario #123"
    if (conversation.user_id) {
      return `Usuario #${conversation.user_id}`;
    }
    
    // Prioridad 4: Si tiene guest_id, mostrar como "Invitado"
    if (conversation.guest_id) {
      // Si es un UUID/string largo, solo mostrar "Invitado"
      if (typeof conversation.guest_id === 'string' && conversation.guest_id.length > 10) {
        return 'Invitado';
      }
      return `Invitado #${conversation.guest_id}`;
    }
    
    // Fallback: mostrar ID de conversación
    return `Conversación #${conversation.id}`;
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
                    this.navigateToListByEmail(searchValue, listType);
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
                    console.log("Tiene venta salesResp: ", salesResp);
                    
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

  // ========================================
  // FASE 2B: Auto-respuesta
  // ========================================

  /**
   * Genera auto-respuestas basadas en intent detectado (FASE 2B mejorado)
   */
  private async generateAutoResponse(intent: ChatIntent): Promise<void> {
    if (!intent || !this.autoResponseService.shouldAutoRespond(intent)) {
      this.autoResponseTemplates = [];
      this.showAutoResponsePanel = false;
      return;
    }

    console.log('[ConversationDetail] 🤖 Generando plantillas de auto-respuesta...');
    this.isGeneratingResponse = true;

    try {
      // Usar nuevo método que devuelve múltiples plantillas
      const templates = await this.autoResponseService.generateAutoResponses(
        this.selected,
        intent,
        this.customerContext
      );
      
      if (templates && templates.length > 0) {
        this.autoResponseTemplates = templates;
        this.selectedTemplateIndex = 0; // Seleccionar primera por defecto
        this.showAutoResponsePanel = true;
        this.isGeneratingResponse = false; // ✅ FIX: Resetear antes para que UI se actualice
        
        // ✅ FASE 2B: Actualizar datos del panel IA y auto-abrir tab "Asistente IA"
        this.aiAssistantPanelData = {
          intent: intent,
          templates: templates,
          selectedIndex: 0
        };
        
        // Auto-abrir tab "Asistente IA" en el panel derecho
        if (this.contextSidebar && this.contextSidebar.nativeElement) {
          const panelComponent = this.contextSidebar.nativeElement.querySelector('app-customer-context-panel');
          if (panelComponent) {
            // Triggear cambio de tab mediante DOM (fallback si no hay referencia directa)
            const assistantTab = panelComponent.querySelector('button[class*="assistant"]');
            if (assistantTab) {
              assistantTab.click();
            }
          }
        }
        
        this.cdr.detectChanges(); // ✅ Forzar detección de cambios inmediata
        
        console.log(`[ConversationDetail] ✅ ${templates.length} plantillas generadas y enviadas al panel IA`);
        
        // Si puede enviarse automáticamente y la configuración lo permite
        const config = this.autoResponseService.getConfig();
        if (!config.requireApproval && templates[0].confidence >= config.minConfidence) {
          console.log('[ConversationDetail] 📤 Enviando respuesta automáticamente...');
          setTimeout(() => this.sendSelectedTemplate(), 1000); // Delay para UX
        }
      } else {
        this.autoResponseTemplates = [];
        this.showAutoResponsePanel = false;
        console.log('[ConversationDetail] ⚠️ No se generaron plantillas');
      }
    } catch (error) {
      console.error('[ConversationDetail] ❌ Error al generar auto-respuesta:', error);
      this.autoResponseTemplates = [];
      this.showAutoResponsePanel = false;
    } finally {
      this.isGeneratingResponse = false;
    }
  }

  /**
   * Selecciona una plantilla
   */
  selectTemplate(index: number): void {
    this.selectedTemplateIndex = index;
    // ✅ FASE 2B: Sincronizar con aiAssistantPanelData
    if (this.aiAssistantPanelData) {
      this.aiAssistantPanelData.selectedIndex = index;
    }
    console.log('[ConversationDetail] Plantilla seleccionada:', index);
  }

  /**
   * Envía la plantilla seleccionada
   */
  sendSelectedTemplate(): void {
    if (this.selectedTemplateIndex === null || !this.autoResponseTemplates[this.selectedTemplateIndex] || !this.selected) {
      console.warn('[ConversationDetail] No hay plantilla seleccionada para enviar');
      return;
    }

    const template = this.autoResponseTemplates[this.selectedTemplateIndex];
    console.log('[ConversationDetail] 📤 Enviando plantilla...');
    
    // Enviar mensaje usando el servicio de chat
    this.chat.sendAgentMessage(this.selected, template.text);
    
    // Cerrar panel de sugerencia
    this.closeAutoResponsePanel();
    
    // Mostrar notificación
    this.toaster.open({
      text: '✅ Respuesta automática enviada',
      type: 'success',
      duration: 3000
    });
  }

  /**
   * Inserta la plantilla seleccionada como borrador editable
   */
  insertTemplateAsDraft(): void {
    if (this.selectedTemplateIndex === null || !this.autoResponseTemplates[this.selectedTemplateIndex]) {
      console.warn('[ConversationDetail] No hay plantilla seleccionada');
      return;
    }

    const template = this.autoResponseTemplates[this.selectedTemplateIndex];
    console.log('[ConversationDetail] 📝 Insertando plantilla como borrador');
    
    // Copiar texto al textarea
    this.newMessage = template.text;
    
    // Cerrar panel
    this.closeAutoResponsePanel();
    
    // Focus en textarea
    setTimeout(() => {
      const textarea = document.querySelector('textarea[name="message"]') as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
      }
    }, 100);
  }

  /**
   * Cierra el panel de auto-respuesta
   */
  closeAutoResponsePanel(): void {
    this.showAutoResponsePanel = false;
    this.autoResponseTemplates = [];
    this.selectedTemplateIndex = null;
  }

  /**
   * Regenera la auto-respuesta
   */
  async regenerateAutoResponse(): Promise<void> {
    if (!this.lastDetectedIntent) return;
    
    console.log('[ConversationDetail] 🔄 Regenerando auto-respuesta...');
    await this.generateAutoResponse(this.lastDetectedIntent);
  }

  /**
   * Obtiene etiqueta legible para tipo de plantilla
   */
  getTemplateLabel(type: string): string {
    const labels: Record<string, string> = {
      'default': 'Estado',
      'tracking': 'Tracking',
      'delay': 'Retraso',
      'cancel': 'Cancelación',
      'return': 'Devolución'
    };
    return labels[type] || type;
  }

  /**
   * Obtiene clase CSS para badge de confianza
   */
  getConfidenceBadgeClass(confidence: number): string {
    if (confidence >= 0.9) return 'badge-success';
    if (confidence >= 0.8) return 'badge-info';
    if (confidence >= 0.7) return 'badge-warning';
    return 'badge-secondary';
  }

  /**
   * Formatea porcentaje de confianza
   */
  formatConfidence(confidence: number): string {
    return `${Math.round(confidence * 100)}%`;
  }

}
