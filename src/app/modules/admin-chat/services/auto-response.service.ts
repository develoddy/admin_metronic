import { Injectable } from '@angular/core';
import { ChatIntent, IntentType, CustomerContext } from '../models/customer-context.model';
import { PrintfulRealTimeService } from './printful-realtime.service';

/**
 * AutoResponseService
 * 
 * Genera respuestas automáticas inteligentes basadas en:
 * - Tipo de intent detectado
 * - Contexto del cliente (órdenes, tracking, etc.)
 * - Estado actual de Printful
 * 
 * FASE 2B - Sprint 2
 */

export interface AutoResponseConfig {
  enabled: boolean;
  minConfidence: number; // 0.0 - 1.0
  enabledIntents: IntentType[];
  requireApproval: boolean; // Si true, muestra sugerencia antes de enviar
}

export interface AutoResponseSuggestion {
  message: string;
  confidence: number;
  intentType: IntentType;
  canSendAutomatically: boolean;
  suggestedActions?: string[]; // Acciones adicionales sugeridas
}

export interface AutoResponseTemplate {
  text: string; // Texto técnico para el admin
  customerFriendlyText?: string; // Texto sugerido para enviar al cliente (sin jerga técnica)
  type: 'default' | 'tracking' | 'delay' | 'cancel' | 'return';
  confidence: number;
  actionButtons?: Array<{
    label: string;
    action: string;
    variant: 'primary' | 'secondary' | 'danger';
  }>;
  metadata?: {
    orderId?: number;
    printfulOrderId?: string;
    trackingNumber?: string;
    isDelayed?: boolean;
    hasTracking?: boolean; // ✅ Para indicar si el pedido tiene tracking disponible
    hasPrintfulData?: boolean; // ✅ Para indicar si Printful API devolvió datos válidos
  };
}

@Injectable({
  providedIn: 'root'
})
export class AutoResponseService {

  // Configuración por defecto
  private config: AutoResponseConfig = {
    enabled: true,
    minConfidence: 0.85,
    enabledIntents: ['ORDER_STATUS', 'TRACKING_INFO', 'DELIVERY_DATE', 'DELIVERY_PROBLEM'],
    requireApproval: true
  };

  constructor(private printfulService: PrintfulRealTimeService) {
    console.log('[AutoResponse] Servicio inicializado');
  }

  /**
   * Genera respuesta automática basada en intent y contexto
   */
  async generateResponse(
    intent: ChatIntent,
    context: CustomerContext | null
  ): Promise<AutoResponseSuggestion | null> {
    
    if (!this.shouldAutoRespond(intent)) {
      console.log('[AutoResponse] Auto-respuesta no habilitada para este intent');
      return null;
    }

    console.log(`[AutoResponse] 🤖 Generando respuesta para intent: ${intent.type}`);

    let suggestion: AutoResponseSuggestion | null = null;

    switch (intent.type) {
      case 'ORDER_STATUS':
        suggestion = await this.generateOrderStatusResponse(intent, context);
        break;

      case 'TRACKING_INFO':
        suggestion = await this.generateTrackingResponse(intent, context);
        break;

      case 'DELIVERY_DATE':
        suggestion = await this.generateDeliveryDateResponse(intent, context);
        break;

      case 'DELIVERY_PROBLEM':
        suggestion = await this.generateDeliveryProblemResponse(intent, context);
        break;

      case 'CANCEL_REQUEST':
        suggestion = this.generateCancelRequestResponse(intent, context);
        break;

      case 'RETURN_REQUEST':
        suggestion = this.generateReturnRequestResponse(intent, context);
        break;

      default:
        console.log('[AutoResponse] Intent no soportado para auto-respuesta:', intent.type);
        return null;
    }

    return suggestion;
  }

  /**
   * Determina si se debe generar auto-respuesta
   */
  shouldAutoRespond(intent: ChatIntent): boolean {
    if (!this.config.enabled) return false;
    if (intent.confidence < this.config.minConfidence) return false;
    if (!this.config.enabledIntents.includes(intent.type)) return false;
    return true;
  }

  // ========================================
  // Generadores de respuesta por tipo
  // ========================================

  /**
   * Respuesta para ORDER_STATUS
   */
  private async generateOrderStatusResponse(
    intent: ChatIntent,
    context: CustomerContext | null
  ): Promise<AutoResponseSuggestion | null> {
    
    if (!context || context.activeOrders.length === 0) {
      return {
        message: "No encuentro pedidos activos en tu cuenta. ¿Podrías darme tu número de pedido o email con el que compraste?",
        confidence: 0.9,
        intentType: 'ORDER_STATUS',
        canSendAutomatically: true
      };
    }

    // Buscar orden específica o usar la más reciente
    const orderId = intent.extractedData?.orderId;
    const order = orderId 
      ? context.activeOrders.find(o => o.id === orderId)
      : context.activeOrders[0];

    if (!order) {
      return {
        message: `No encuentro el pedido #${orderId} en tu cuenta. Por favor verifica el número de pedido.`,
        confidence: 0.85,
        intentType: 'ORDER_STATUS',
        canSendAutomatically: true
      };
    }

    // Consultar Printful si es orden de Printful
    if (order.printfulOrderId) {
      const printfulData = await this.printfulService.getOrderStatus(order.printfulOrderId).toPromise();
      
      if (printfulData) {
        const status = this.printfulService.translateStatus(printfulData.status);
        const isDelayed = this.printfulService.isDelayed(order);
        
        let message = `📦 Estado de tu pedido #${order.id}:\n\n`;
        message += `🔹 Estado actual: ${status}\n`;
        message += `🔹 Monto: ${order.amount}€\n`;
        
        if ((order as any).minDeliveryDate && (order as any).maxDeliveryDate) {
          message += `🔹 Entrega estimada: ${this.formatDate((order as any).minDeliveryDate)} - ${this.formatDate((order as any).maxDeliveryDate)}\n`;
        }

        if (isDelayed) {
          const daysDelayed = this.printfulService.getDaysDelayed(order);
          message += `\n⚠️ Tu pedido tiene un retraso de ${daysDelayed} días. Estamos trabajando para resolver esta situación lo antes posible.`;
        } else {
          message += `\n✅ Tu pedido va según lo previsto.`;
        }

        return {
          message,
          confidence: 0.95,
          intentType: 'ORDER_STATUS',
          canSendAutomatically: !isDelayed, // Requiere aprobación si hay retraso
          suggestedActions: isDelayed ? ['Contactar a Printful', 'Ofrecer descuento'] : undefined
        };
      }
    }

    // Fallback para órdenes no Printful
    const status = order.status ? this.translateOrderStatus(order.status) : 'En proceso';
    let message = `📦 Estado de tu pedido #${order.id}:\n\n`;
    message += `🔹 Estado: ${status}\n`;
    message += `🔹 Monto: ${order.amount}€\n`;
    message += `🔹 Fecha: ${this.formatDate(order.createdAt)}\n\n`;
    message += `Si necesitas más información, puedo ayudarte con detalles específicos.`;

    return {
      message,
      confidence: 0.8,
      intentType: 'ORDER_STATUS',
      canSendAutomatically: true
    };
  }

  /**
   * Respuesta para TRACKING_INFO
   */
  private async generateTrackingResponse(
    intent: ChatIntent,
    context: CustomerContext | null
  ): Promise<AutoResponseSuggestion | null> {
    
    if (!context || context.activeOrders.length === 0) {
      return {
        message: "Para darte el número de tracking necesito saber qué pedido es. ¿Podrías darme tu número de pedido?",
        confidence: 0.9,
        intentType: 'TRACKING_INFO',
        canSendAutomatically: true
      };
    }

    const orderId = intent.extractedData?.orderId;
    const order = orderId 
      ? context.activeOrders.find(o => o.id === orderId)
      : context.activeOrders[0];

    if (!order || !order.printfulOrderId) {
      return {
        message: `El pedido #${order?.id || 'solicitado'} aún no tiene número de tracking disponible. Te avisaré en cuanto sea enviado.`,
        confidence: 0.85,
        intentType: 'TRACKING_INFO',
        canSendAutomatically: true
      };
    }

    const tracking = await this.printfulService.getTracking(order.printfulOrderId).toPromise();

    if (!tracking || !tracking.trackingNumber) {
      return {
        message: `Tu pedido #${order.id} está en proceso de producción. El tracking estará disponible cuando sea enviado (normalmente 3-5 días hábiles).`,
        confidence: 0.9,
        intentType: 'TRACKING_INFO',
        canSendAutomatically: true
      };
    }

    let message = `📍 Información de tracking para tu pedido #${order.id}:\n\n`;
    message += `🔹 Tracking: ${tracking.trackingNumber}\n`;
    message += `🔹 Transportista: ${tracking.carrier}\n`;
    
    if (tracking.trackingUrl) {
      message += `🔗 Rastrea tu paquete aquí: ${tracking.trackingUrl}\n`;
    }

    return {
      message,
      confidence: 0.95,
      intentType: 'TRACKING_INFO',
      canSendAutomatically: true
    };
  }

  /**
   * Respuesta para DELIVERY_DATE
   */
  private async generateDeliveryDateResponse(
    intent: ChatIntent,
    context: CustomerContext | null
  ): Promise<AutoResponseSuggestion | null> {
    
    if (!context || context.activeOrders.length === 0) {
      return {
        message: "Para darte la fecha de entrega necesito saber de qué pedido hablas. ¿Tienes el número de pedido?",
        confidence: 0.9,
        intentType: 'DELIVERY_DATE',
        canSendAutomatically: true
      };
    }

    const orderId = intent.extractedData?.orderId;
    const order = orderId 
      ? context.activeOrders.find(o => o.id === orderId)
      : context.activeOrders[0];

    if (!order) {
      return null;
    }

    let message = `📅 Información de entrega para tu pedido #${order.id}:\n\n`;

    if ((order as any).minDeliveryDate && (order as any).maxDeliveryDate) {
      message += `🔹 Fecha estimada: ${this.formatDate((order as any).minDeliveryDate)} - ${this.formatDate((order as any).maxDeliveryDate)}\n\n`;
      
      const isDelayed = order.printfulOrderId ? this.printfulService.isDelayed(order) : false;
      
      if (isDelayed) {
        message += `⚠️ Tu pedido tiene un pequeño retraso. Estamos trabajando para que llegue lo antes posible.`;
      } else {
        message += `✅ Tu pedido va según lo programado.`;
      }
    } else {
      message += `La fecha de entrega será calculada una vez que el pedido sea enviado. Normalmente son 7-14 días hábiles desde la creación.`;
    }

    return {
      message,
      confidence: 0.9,
      intentType: 'DELIVERY_DATE',
      canSendAutomatically: true
    };
  }

  /**
   * Respuesta para DELIVERY_PROBLEM
   */
  private async generateDeliveryProblemResponse(
    intent: ChatIntent,
    context: CustomerContext | null
  ): Promise<AutoResponseSuggestion | null> {
    
    if (!context || context.activeOrders.length === 0) {
      return {
        message: "Lamento que tengas problemas con tu pedido. Para ayudarte mejor, ¿podrías darme tu número de pedido?",
        confidence: 0.9,
        intentType: 'DELIVERY_PROBLEM',
        canSendAutomatically: false
      };
    }

    const orderId = intent.extractedData?.orderId;
    const order = orderId 
      ? context.activeOrders.find(o => o.id === orderId)
      : context.activeOrders[0];

    if (!order) {
      return null;
    }

    let message = `Entiendo tu preocupación por el pedido #${order.id}. Déjame revisar:\n\n`;

    if (order.printfulOrderId) {
      const printfulData = await this.printfulService.getOrderStatus(order.printfulOrderId).toPromise();
      
      if (printfulData) {
        const status = this.printfulService.translateStatus(printfulData.status);
        message += `🔹 Estado actual: ${status}\n`;
        
        const tracking = await this.printfulService.getTracking(order.printfulOrderId).toPromise();
        
        if (tracking?.trackingNumber) {
          message += `🔹 Tracking: ${tracking.trackingNumber}\n`;
          message += `🔗 Puedes rastrearlo aquí: ${tracking.trackingUrl}\n\n`;
        }

        const isDelayed = this.printfulService.isDelayed(order);
        
        if (isDelayed) {
          const daysDelayed = this.printfulService.getDaysDelayed(order);
          message += `⚠️ Confirmo que hay un retraso de ${daysDelayed} días. Voy a contactar con el proveedor inmediatamente para solucionar esto. Te mantendré informado.`;
          
          return {
            message,
            confidence: 0.8,
            intentType: 'DELIVERY_PROBLEM',
            canSendAutomatically: false,
            suggestedActions: ['Contactar Printful urgente', 'Ofrecer compensación']
          };
        } else {
          message += `✅ Según los registros, tu pedido va según lo previsto. ¿Hay algo específico que te preocupa?`;
        }
      }
    }

    return {
      message,
      confidence: 0.75,
      intentType: 'DELIVERY_PROBLEM',
      canSendAutomatically: false
    };
  }

  /**
   * Respuesta para CANCEL_REQUEST
   */
  private generateCancelRequestResponse(
    intent: ChatIntent,
    context: CustomerContext | null
  ): AutoResponseSuggestion | null {
    
    if (!context || context.activeOrders.length === 0) {
      return {
        message: "Para procesar la cancelación necesito el número de pedido. ¿Podrías proporcionarlo?",
        confidence: 0.9,
        intentType: 'CANCEL_REQUEST',
        canSendAutomatically: false
      };
    }

    const orderId = intent.extractedData?.orderId;
    const order = orderId 
      ? context.activeOrders.find(o => o.id === orderId)
      : context.activeOrders[0];

    if (!order) {
      return null;
    }

    let message = `Entiendo que quieres cancelar el pedido #${order.id}.\n\n`;

    if (order.printfulOrderId) {
      message += `⚠️ Este pedido está con Printful. Voy a revisar si es posible cancelarlo (solo se puede si aún no ha entrado en producción).\n\n`;
      message += `Dame un momento para verificar el estado actual...`;
    } else {
      message += `Voy a procesar la cancelación inmediatamente. ¿Hay algún motivo específico? Esto nos ayuda a mejorar.`;
    }

    return {
      message,
      confidence: 0.7,
      intentType: 'CANCEL_REQUEST',
      canSendAutomatically: false,
      suggestedActions: ['Verificar estado en Printful', 'Confirmar cancelación con cliente']
    };
  }

  /**
   * Respuesta para RETURN_REQUEST
   */
  private generateReturnRequestResponse(
    intent: ChatIntent,
    context: CustomerContext | null
  ): AutoResponseSuggestion | null {
    
    let message = `Lamento que el producto no cumpla tus expectativas.\n\n`;
    message += `Para procesar la devolución necesito:\n`;
    message += `• Número de pedido\n`;
    message += `• Motivo de la devolución\n`;
    message += `• Fotos del producto (si es defecto de fabricación)\n\n`;
    message += `¿Podrías proporcionarme esta información?`;

    return {
      message,
      confidence: 0.85,
      intentType: 'RETURN_REQUEST',
      canSendAutomatically: false,
      suggestedActions: ['Crear ticket de devolución', 'Solicitar fotos']
    };
  }

  // ========================================
  // Configuración
  // ========================================

  /**
   * Actualiza configuración de auto-respuestas
   */
  updateConfig(config: Partial<AutoResponseConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('[AutoResponse] Configuración actualizada:', this.config);
  }

  /**
   * Obtiene configuración actual
   */
  getConfig(): AutoResponseConfig {
    return { ...this.config };
  }

  /**
   * Habilita/deshabilita auto-respuesta para un intent específico
   */
  toggleIntentAutoResponse(intentType: IntentType, enabled: boolean): void {
    if (enabled && !this.config.enabledIntents.includes(intentType)) {
      this.config.enabledIntents.push(intentType);
    } else if (!enabled) {
      this.config.enabledIntents = this.config.enabledIntents.filter(i => i !== intentType);
    }
    console.log('[AutoResponse] Intent toggled:', intentType, enabled);
  }

  /**
   * Genera múltiples plantillas de respuesta basadas en contexto
   * FASE 2B - Método principal para UI
   */
  async generateAutoResponses(
    conversation: any,
    intent: ChatIntent,
    context: CustomerContext | null
  ): Promise<AutoResponseTemplate[]> {
    console.log('[AutoResponse] 📝 Generando plantillas múltiples para:', intent.type);

    const templates: AutoResponseTemplate[] = [];

    if (!this.shouldAutoRespond(intent) || !context) {
      console.log('[AutoResponse] No se puede generar respuesta automática');
      return templates;
    }

    try {
      switch (intent.type) {
        case 'ORDER_STATUS':
          templates.push(...await this.generateOrderStatusTemplates(context));
          break;

        case 'TRACKING_INFO':
          templates.push(...await this.generateTrackingTemplates(context));
          break;

        case 'DELIVERY_DATE':
          templates.push(...await this.generateDeliveryDateTemplates(context));
          break;

        case 'DELIVERY_PROBLEM':
          templates.push(...await this.generateDeliveryProblemTemplates(context));
          break;

        case 'CANCEL_REQUEST':
          templates.push(...this.generateCancelRequestTemplates(context));
          break;

        case 'RETURN_REQUEST':
          templates.push(...this.generateReturnRequestTemplates(context));
          break;
      }

      console.log(`[AutoResponse] ✅ ${templates.length} plantillas generadas`);
      return templates;

    } catch (error) {
      console.error('[AutoResponse] ❌ Error generando plantillas:', error);
      return [];
    }
  }

  // ========================================
  // Generadores de plantillas
  // ========================================

  private async generateOrderStatusTemplates(context: CustomerContext): Promise<AutoResponseTemplate[]> {
    const templates: AutoResponseTemplate[] = [];
    const activeOrders = context.activeOrders || [];

    for (const order of activeOrders.slice(0, 2)) { // Max 2 órdenes
      if (!order.printfulOrderId) continue;

      try {
        const printfulData = await this.printfulService.getOrderStatus(order.printfulOrderId).toPromise();
        
        // FALLBACK: Si Printful no responde, usar datos de la orden local
        if (!printfulData) {
          console.warn('[AutoResponse] ⚠️ Printful no respondió, usando datos locales para orden #' + order.id);
          
          // Generar plantilla con datos disponibles
          const isDelayed = this.printfulService.isDelayed(order);
          
          let text = `📦 **Pedido #${order.id}**\n\n`;
          text += `🔹 Estado: ${order.printfulStatus ? this.translateOrderStatus(order.printfulStatus) : 'En proceso'}\n`;
          text += `🔹 Total: €${(order as any).total || '0.00'}\n`;

          if ((order as any).minDeliveryDate && (order as any).maxDeliveryDate) {
            text += `🔹 Entrega estimada: ${this.formatDate((order as any).minDeliveryDate)} - ${this.formatDate((order as any).maxDeliveryDate)}\n`;
          }

          if (isDelayed) {
            const days = this.printfulService.getDaysDelayed(order);
            text += `\n⚠️ **RETRASO**: Tu pedido lleva ${days} días de retraso.\n`;
          } else {
            text += `\n✅ Tu pedido está siendo procesado por nuestro proveedor.\n`;
          }

          const actionButtons = [
            { label: '🔍 Ver detalles', action: 'show_details', variant: 'primary' as const },
            { label: '📞 Contactar soporte', action: 'contact_support', variant: 'secondary' as const }
          ];

          templates.push({
            text,
            type: isDelayed ? 'delay' : 'default',
            confidence: 0.85, // Menor confianza sin datos de Printful
            actionButtons,
            metadata: {
              orderId: order.id,
              printfulOrderId: order.printfulOrderId,
              isDelayed
            }
          });
          
          continue; // Pasar a la siguiente orden
        }

        const isDelayed = this.printfulService.isDelayed(order);

        let text = `📦 **Pedido #${order.id}**\n\n`;
        text += `🔹 Estado: ${this.translateOrderStatus((printfulData as any).status)}\n`;
        text += `🔹 Total: €${(order as any).total || '0.00'}\n`;

        if ((order as any).minDeliveryDate && (order as any).maxDeliveryDate) {
          text += `🔹 Entrega estimada: ${this.formatDate((order as any).minDeliveryDate)} - ${this.formatDate((order as any).maxDeliveryDate)}\n`;
        }

        if (isDelayed) {
          const days = this.printfulService.getDaysDelayed(order);
          text += `\n⚠️ **RETRASO**: Tu pedido lleva ${days} días de retraso.\n`;
        }

        const actionButtons = [
          { label: '🔍 Ver tracking', action: 'show_tracking', variant: 'primary' as const },
          { label: '📞 Contactar soporte', action: 'contact_support', variant: 'secondary' as const }
        ];

        templates.push({
          text,
          type: isDelayed ? 'delay' : 'default',
          confidence: 0.95,
          actionButtons,
          metadata: {
            orderId: order.id,
            printfulOrderId: order.printfulOrderId,
            isDelayed
          }
        });

      } catch (error) {
        console.error('[AutoResponse] Error obteniendo estado Printful:', error);
      }
    }

    return templates;
  }

  private async generateTrackingTemplates(context: CustomerContext): Promise<AutoResponseTemplate[]> {
    const templates: AutoResponseTemplate[] = [];
    const activeOrders = context.activeOrders || [];

    for (const order of activeOrders.slice(0, 2)) {
      if (!order.printfulOrderId) continue;

      try {
        const tracking = await this.printfulService.getTracking(order.printfulOrderId).toPromise();
        
        if (tracking && tracking.trackingNumber) {
          // ✅ HAY TRACKING DISPONIBLE
          let text = `🚚 **Tracking Pedido #${order.id}**\n\n`;
          text += `📦 Número: **${tracking.trackingNumber}**\n`;
          text += `🏢 Transportista: ${tracking.carrier || 'N/A'}\n`;
          
          if (tracking.trackingUrl) {
            text += `\n🔗 [Rastrear envío](${tracking.trackingUrl})`;
          }

          templates.push({
            text,
            type: 'tracking',
            confidence: 0.98,
            actionButtons: [
              { label: '🔗 Abrir tracking', action: 'open_tracking', variant: 'primary' as const }
            ],
            metadata: {
              orderId: order.id,
              printfulOrderId: order.printfulOrderId,
              trackingNumber: tracking.trackingNumber
            }
          });
        } else {
          // ❌ NO HAY TRACKING AÚN - Plantilla de fallback
          let text = `📦 **Pedido #${order.id}**\n\n`;
          text += `🔹 Estado: ${order.printfulStatus ? this.translateOrderStatus(order.printfulStatus) : 'En preparación'}\n`;
          text += `🔹 Total: €${(order as any).total || '0.00'}\n\n`;
          
          if ((order as any).minDeliveryDate && (order as any).maxDeliveryDate) {
            text += `🔹 Entrega estimada: ${this.formatDate((order as any).minDeliveryDate)} - ${this.formatDate((order as any).maxDeliveryDate)}\n\n`;
          }

          text += `⏳ **Tu pedido aún no ha sido enviado.**\n`;
          text += `El número de tracking estará disponible una vez que sea despachado por nuestro proveedor.\n\n`;
          text += `Te notificaremos por email cuando esté en camino.`;

          templates.push({
            text,
            type: 'default',
            confidence: 0.85,
            actionButtons: [
              { label: '🔍 Ver detalles', action: 'show_details', variant: 'primary' as const },
              { label: '📞 Contactar soporte', action: 'contact_support', variant: 'secondary' as const }
            ],
            metadata: {
              orderId: order.id,
              printfulOrderId: order.printfulOrderId,
              hasTracking: false
            }
          });
        }

      } catch (error) {
        console.error('[AutoResponse] Error obteniendo tracking:', error);
      }
    }

    return templates;
  }

  private async generateDeliveryDateTemplates(context: CustomerContext): Promise<AutoResponseTemplate[]> {
    const templates: AutoResponseTemplate[] = [];
    const activeOrders = context.activeOrders || [];

    for (const order of activeOrders.slice(0, 1)) {
      if (!order.printfulOrderId) continue;

      let text = `📅 **Fecha de entrega - Pedido #${order.id}**\n\n`;

      if ((order as any).minDeliveryDate && (order as any).maxDeliveryDate) {
        text += `🔹 Fecha estimada: ${this.formatDate((order as any).minDeliveryDate)} - ${this.formatDate((order as any).maxDeliveryDate)}\n\n`;
      }

      const isDelayed = this.printfulService.isDelayed(order);
      
      if (isDelayed) {
        const days = this.printfulService.getDaysDelayed(order);
        text += `⚠️ Tu pedido lleva **${days} días** de retraso. Estamos verificando con el proveedor.\n`;
      } else {
        text += `✅ Tu pedido va en tiempo. Te notificaremos cuando sea despachado.`;
      }

      templates.push({
        text,
        type: isDelayed ? 'delay' : 'default',
        confidence: 0.90,
        metadata: {
          orderId: order.id,
          printfulOrderId: order.printfulOrderId,
          isDelayed
        }
      });
    }

    return templates;
  }

  private async generateDeliveryProblemTemplates(context: CustomerContext): Promise<AutoResponseTemplate[]> {
    const templates: AutoResponseTemplate[] = [];
    const activeOrders = context.activeOrders || [];

    for (const order of activeOrders.slice(0, 1)) {
      if (!order.printfulOrderId) continue;

      try {
        const printfulData = await this.printfulService.getOrderStatus(order.printfulOrderId).toPromise();
        
        if (printfulData) {
          const isDelayed = this.printfulService.isDelayed(order);

          let text = `🔍 **Verificación Pedido #${order.id}**\n\n`;

          if (isDelayed) {
            const days = this.printfulService.getDaysDelayed(order);
            text += `⚠️ Detectamos un retraso de **${days} días**.\n\n`;
            text += `📦 Estado actual: ${this.translateOrderStatus((printfulData as any).status)}\n\n`;
            text += `**Acciones sugeridas:**\n`;
            text += `- Contactar al proveedor Printful\n`;
            text += `- Verificar tracking si está disponible\n`;
            text += `- Ofrecer compensación o descuento`;

            templates.push({
              text,
              type: 'delay',
              confidence: 0.92,
              actionButtons: [
                { label: '📞 Contactar proveedor', action: 'contact_printful', variant: 'danger' as const },
                { label: '💰 Ofrecer descuento', action: 'offer_discount', variant: 'secondary' as const }
              ],
              metadata: {
                orderId: order.id,
                printfulOrderId: order.printfulOrderId,
                isDelayed: true
              }
            });
          } else {
            text += `✅ El pedido va en tiempo.\n\n`;
            text += `📦 Estado: ${this.translateOrderStatus((printfulData as any).status)}\n\n`;
            text += `Si el cliente reporta un problema específico, solicitemos más detalles.`;

            templates.push({
              text,
              type: 'default',
              confidence: 0.85,
              metadata: {
                orderId: order.id,
                printfulOrderId: order.printfulOrderId,
                isDelayed: false
              }
            });
          }
        } else {
          // Fallback cuando Printful API no devuelve datos
          const totalFormatted = order.total ? `€${order.total.toFixed(2)}` : 'N/A';
          
          // Texto TÉCNICO para el ADMIN (con datos de Printful)
          let adminText = `🔍 **[ADMIN] Investigando Pedido #${order.id}**\n\n`;
          adminText += `📦 Total: ${totalFormatted}\n`;
          if (order.printfulOrderId) {
            adminText += `🏭 ID Printful: ${order.printfulOrderId}\n`;
          }
          adminText += `📅 Estado interno: ${order.printfulStatus || 'En proceso'}\n\n`;
          adminText += `⚠️ **Printful API no devolvió datos. Verificar manualmente.**\n\n`;
          adminText += `**Acciones recomendadas (internas):**\n`;
          adminText += `- Contactar directamente con Printful para más detalles\n`;
          adminText += `- Verificar si hay actualizaciones de tracking\n`;
          adminText += `- Ofrecer seguimiento prioritario al cliente`;

          // Texto AMIGABLE para el CLIENTE (sin mencionar Printful)
          let customerText = `Hola 👋\n\n`;
          customerText += `Entendemos tu preocupación sobre tu pedido #${order.id}.\n\n`;
          customerText += `Estamos verificando el estado actual con nuestro equipo de logística y te mantendremos informado en las próximas horas sobre el seguimiento.\n\n`;
          customerText += `¿Hay algo más en lo que pueda ayudarte mientras tanto? 😊`;

          templates.push({
            text: adminText, // Vista técnica para admin
            customerFriendlyText: customerText, // Texto sugerido para enviar al cliente
            type: 'default',
            confidence: 0.80,
            actionButtons: [
              { label: '🔍 Ver detalles', action: 'view_order', variant: 'primary' as const },
              { label: '📞 Contactar urgente', action: 'contact_customer', variant: 'danger' as const }
            ],
            metadata: {
              orderId: order.id,
              printfulOrderId: order.printfulOrderId,
              isDelayed: false,
              hasPrintfulData: false
            }
          });
        }

      } catch (error) {
        console.error('[AutoResponse] Error verificando problema de entrega:', error);
      }
    }

    return templates;
  }

  private generateCancelRequestTemplates(context: CustomerContext): AutoResponseTemplate[] {
    const templates: AutoResponseTemplate[] = [];
    const activeOrders = context.activeOrders || [];

    for (const order of activeOrders.slice(0, 1)) {
      let text = `🚫 **Solicitud de cancelación - Pedido #${order.id}**\n\n`;

      if (order.printfulOrderId) {
        text += `Este pedido está siendo procesado por Printful.\n\n`;
        text += `⚠️ **Solo es posible cancelar si está en estado "draft".**\n\n`;
        text += `Por favor, verifica el estado actual antes de proceder.`;

        templates.push({
          text,
          type: 'cancel',
          confidence: 0.88,
          actionButtons: [
            { label: '🔍 Verificar estado', action: 'check_status', variant: 'secondary' as const },
            { label: '❌ Intentar cancelar', action: 'attempt_cancel', variant: 'danger' as const }
          ],
          metadata: {
            orderId: order.id,
            printfulOrderId: order.printfulOrderId
          }
        });
      } else {
        text += `Este pedido no está vinculado a Printful.\n\n`;
        text += `✅ Es posible proceder con la cancelación directamente.`;

        templates.push({
          text,
          type: 'cancel',
          confidence: 0.95,
          actionButtons: [
            { label: '❌ Cancelar pedido', action: 'cancel_order', variant: 'danger' as const }
          ],
          metadata: {
            orderId: order.id
          }
        });
      }
    }

    return templates;
  }

  private generateReturnRequestTemplates(context: CustomerContext): AutoResponseTemplate[] {
    const templates: AutoResponseTemplate[] = [];

    let text = `🔄 **Solicitud de devolución**\n\n`;
    text += `Para procesar tu devolución, necesitamos:\n\n`;
    text += `1️⃣ Número de pedido\n`;
    text += `2️⃣ Motivo de la devolución\n`;
    text += `3️⃣ Fotos del producto (si aplica)\n\n`;
    text += `📝 Una vez recibida la información, crearemos un ticket de soporte.`;

    templates.push({
      text,
      type: 'return',
      confidence: 0.90,
      actionButtons: [
        { label: '📝 Crear ticket', action: 'create_ticket', variant: 'primary' as const },
        { label: '📧 Solicitar info', action: 'request_info', variant: 'secondary' as const }
      ]
    });

    return templates;
  }

  // ========================================
  // Helpers
  // ========================================

  private formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
  }

  private translateOrderStatus(status: string): string {
    const translations: Record<string, string> = {
      'pending': 'Pendiente',
      'processing': 'En proceso',
      'shipped': 'Enviado',
      'delivered': 'Entregado',
      'completed': 'Completado',
      'canceled': 'Cancelado',
      'paid': 'Pagado',
      'confirmed': 'Confirmado'
    };
    return translations[status?.toLowerCase()] || status;
  }
}
