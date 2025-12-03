import { Injectable } from '@angular/core';
import { ChatIntent, IntentType, IntentPattern } from '../models/customer-context.model';

/**
 * ChatIntentService
 * Detecta la intención del usuario en los mensajes del chat
 * Soporta detección de: ORDER_STATUS, RETURN_REQUEST, STOCK_INQUIRY, DELIVERY_DATE, TRACKING_INFO
 */
@Injectable({
  providedIn: 'root'
})
export class ChatIntentService {

  private intentPatterns: IntentPattern[] = [
    // 🎯 Orden de evaluación: De MÁS específico a MENOS específico
    
    // 1. TRACKING_INFO - Muy específico (menciona "tracking", "número de seguimiento")
    {
      type: 'TRACKING_INFO',
      patterns: [
        /tienen\s+(número\s+de\s+)?tracking/i,
        /número\s+de\s+(seguimiento|tracking|rastreo)/i,
        /tracking\s+(number|code)/i,
        /código\s+de\s+(rastreo|seguimiento)/i,
        /dónde\s+va\s+mi\s+paquete/i,
        /rastrear\s+(mi\s+)?pedido/i,
        /cuál\s+es\s+(el|mi)\s+(número\s+de\s+)?(tracking|seguimiento)/i
      ],
      keywords: ['tracking', 'rastreo', 'seguimiento', 'número', 'código', 'paquete'],
      confidence: 0.9
    },
    
    // 2. DELIVERY_PROBLEM - Muy específico (retraso, no llegó, tarda mucho)
    {
      type: 'DELIVERY_PROBLEM',
      patterns: [
        /no\s+(ha|llegó|llegado)/i,
        /(tarda|demora)\s+mucho/i,
        /retraso/i,
        /cuánto\s+(más|tiempo)\s+va\s+a\s+tardar/i,
        /lleva\s+(mucho\s+tiempo|días)/i,
        /dónde\s+está\s+mi\s+paquete/i,
        /perdido/i,
        /extraviado/i
      ],
      keywords: ['retraso', 'demora', 'tarda', 'no llegó', 'no ha llegado', 'perdido', 'extraviado', 'lleva días'],
      confidence: 0.85
    },
    
    // 3. DELIVERY_DATE - Específico (cuándo llega, fecha de entrega)
    {
      type: 'DELIVERY_DATE',
      patterns: [
        /cuándo\s+llega/i,
        /fecha\s+de\s+entrega/i,
        /cuándo\s+(lo\s+)?recib(o|iré)/i,
        /tiempo\s+de\s+entrega/i,
        /estimad(o|a)\s+de\s+entrega/i,
        /días\s+de\s+envío/i
      ],
      keywords: ['entrega', 'llega', 'recibo', 'tiempo', 'días', 'envío'],
      confidence: 0.85
    },
    
    // 4. ORDER_STATUS - Genérico (dónde está mi pedido, estado)
    {
      type: 'ORDER_STATUS',
      patterns: [
        /dónde\s+(está|esta)\s+mi\s+pedido/i,
        /estado\s+(del|de)\s+pedido/i,
        /(mi|el)\s+pedido\s+#?\d+/i,
        /#\d{4,}/,
        /pedido\s+número/i,
        /número\s+de\s+pedido/i,
        /información\s+(de|del)\s+pedido/i
      ],
      keywords: ['pedido', 'orden', 'estado', 'dónde está', 'información'],
      confidence: 0.9
    },
    {
      type: 'RETURN_REQUEST',
      patterns: [
        /devolver/i,
        /devolución/i,
        /reembolso/i,
        /return/i,
        /refund/i,
        /quiero\s+mi\s+dinero/i,
        /no\s+me\s+gusta/i,
        /cambiar\s+producto/i,
        /producto\s+defectuoso/i
      ],
      keywords: ['devolver', 'devolución', 'reembolso', 'return', 'refund', 'cambio', 'defectuoso'],
      confidence: 0.85
    },
    {
      type: 'STOCK_INQUIRY',
      patterns: [
        /tienen\s+stock/i,
        /hay\s+(en\s+)?stock/i,
        /disponible/i,
        /talla/i,
        /size/i,
        /color/i,
        /en\s+existencia/i,
        /cuándo\s+vuelve/i,
        /agotado/i
      ],
      keywords: ['stock', 'disponible', 'talla', 'size', 'color', 'existencia', 'agotado'],
      confidence: 0.8
    },
    // === FASE 2A: Nuevos intents para Printful ===
    {
      type: 'CANCEL_REQUEST',
      patterns: [
        /cancel(ar|ación)/i,
        /quiero\s+cancelar/i,
        /puedo\s+cancelar/i,
        /anular\s+(el\s+)?pedido/i,
        /no\s+quiero\s+(el\s+)?pedido/i,
        /detener\s+(el\s+)?pedido/i
      ],
      keywords: ['cancelar', 'anular', 'cancel', 'detener', 'no quiero'],
      confidence: 0.9
    },
    {
      type: 'DELIVERY_PROBLEM',
      patterns: [
        /no\s+(ha|llegó|llegado)/i,
        /(tarda|demora)\s+mucho/i,
        /retraso/i,
        /cuánto\s+(más|tiempo)\s+va\s+a\s+tardar/i,
        /lleva\s+mucho\s+tiempo/i,
        /dónde\s+está\s+mi\s+paquete/i,
        /perdido/i,
        /extraviado/i
      ],
      keywords: ['retraso', 'demora', 'tarda', 'no llegó', 'no ha llegado', 'perdido', 'extraviado'],
      confidence: 0.85
    },
    {
      type: 'ADDRESS_CHANGE',
      patterns: [
        /cambiar\s+(la\s+)?direcci(ó|o)n/i,
        /modificar\s+(la\s+)?direcci(ó|o)n/i,
        /actualizar\s+(la\s+)?direcci(ó|o)n/i,
        /direcci(ó|o)n\s+(incorrecta|equivocada|mala)/i,
        /otra\s+direcci(ó|o)n/i
      ],
      keywords: ['dirección', 'cambiar', 'modificar', 'actualizar', 'incorrecta'],
      confidence: 0.8
    }
  ];

  constructor() {}

  /**
   * Detecta la intención principal de un mensaje
   * @param message Texto del mensaje
   * @returns ChatIntent con tipo, confianza y datos extraídos
   */
  detectIntent(message: string): ChatIntent {
    if (!message || message.trim().length === 0) {
      return this.createGeneralIntent(message);
    }

    const normalized = message.toLowerCase().trim();
    
    // Buscar coincidencia de patrones
    for (const intentPattern of this.intentPatterns) {
      if (this.matchesPattern(normalized, intentPattern.patterns)) {
        return {
          type: intentPattern.type,
          confidence: intentPattern.confidence,
          extractedData: this.extractData(message, intentPattern.type),
          originalMessage: message
        };
      }
    }

    // Si no encuentra coincidencia específica, retorna GENERAL
    return this.createGeneralIntent(message);
  }

  /**
   * Verifica si el mensaje coincide con alguno de los patrones
   */
  private matchesPattern(normalized: string, patterns: RegExp[]): boolean {
    return patterns.some(pattern => pattern.test(normalized));
  }

  /**
   * Extrae datos relevantes del mensaje según el tipo de intención
   */
  private extractData(message: string, type: IntentType): any {
    const data: any = {};

    switch (type) {
      case 'ORDER_STATUS':
      case 'TRACKING_INFO':
      case 'DELIVERY_DATE':
        // Extraer número de pedido (#1234, pedido 1234, orden 1234)
        const orderMatch = message.match(/#?(\d{4,})/);
        if (orderMatch) {
          data.orderId = parseInt(orderMatch[1], 10);
        }
        
        // Extraer tracking number (formatos comunes)
        const trackingMatch = message.match(/([A-Z]{2}\d{9}[A-Z]{2}|\d{10,})/);
        if (trackingMatch) {
          data.trackingNumber = trackingMatch[1];
        }
        break;

      case 'STOCK_INQUIRY':
        // Extraer talla
        const sizeMatch = message.match(/talla\s+(XS|S|M|L|XL|XXL|\d+)/i);
        if (sizeMatch) {
          data.size = sizeMatch[1].toUpperCase();
        }
        
        // Extraer mención de producto (muy básico)
        const productKeywords = ['camiseta', 'camisa', 'pantalón', 'zapatos', 'sudadera'];
        for (const keyword of productKeywords) {
          if (message.toLowerCase().includes(keyword)) {
            data.product = keyword;
            break;
          }
        }
        break;

      case 'RETURN_REQUEST':
        // Extraer número de pedido si se menciona
        const returnOrderMatch = message.match(/#?(\d{4,})/);
        if (returnOrderMatch) {
          data.orderId = parseInt(returnOrderMatch[1], 10);
        }
        break;

      // === FASE 2A: Nuevos extractores ===
      case 'CANCEL_REQUEST':
        // Extraer número de pedido
        const cancelOrderMatch = message.match(/#?(\d{4,})/);
        if (cancelOrderMatch) {
          data.orderId = parseInt(cancelOrderMatch[1], 10);
        }
        // Extraer motivo si se menciona
        if (/no\s+quiero/i.test(message)) {
          data.reason = 'Cliente ya no quiere el pedido';
        } else if (/demora|tarda/i.test(message)) {
          data.reason = 'Pedido tarda demasiado';
        }
        break;

      case 'DELIVERY_PROBLEM':
        // Extraer número de pedido
        const problemOrderMatch = message.match(/#?(\d{4,})/);
        if (problemOrderMatch) {
          data.orderId = parseInt(problemOrderMatch[1], 10);
        }
        // Extraer tipo de problema
        if (/no\s+(llegó|llegado|ha\s+llegado)/i.test(message)) {
          data.problemType = 'not_arrived';
        } else if (/(retraso|demora|tarda)/i.test(message)) {
          data.problemType = 'delayed';
        } else if (/(perdido|extraviado)/i.test(message)) {
          data.problemType = 'lost';
        }
        break;

      case 'ADDRESS_CHANGE':
        // Extraer número de pedido
        const addressOrderMatch = message.match(/#?(\d{4,})/);
        if (addressOrderMatch) {
          data.orderId = parseInt(addressOrderMatch[1], 10);
        }
        // Detectar si menciona una nueva dirección (básico)
        const addressMatch = message.match(/[A-Z][a-z]+\s+\d+/);
        if (addressMatch) {
          data.newAddress = addressMatch[0];
        }
        break;
    }

    return Object.keys(data).length > 0 ? data : undefined;
  }

  /**
   * Crea una intención genérica para mensajes sin patrón específico
   */
  private createGeneralIntent(message: string): ChatIntent {
    return {
      type: 'GENERAL',
      confidence: 0.5,
      originalMessage: message
    };
  }

  /**
   * Obtiene un label legible para mostrar al admin
   */
  getIntentLabel(intent: ChatIntent): string {
    const labels: Record<IntentType, string> = {
      'ORDER_STATUS': '📦 Consulta de pedido',
      'TRACKING_INFO': '📍 Info de tracking',
      'DELIVERY_DATE': '📅 Fecha de entrega',
      'RETURN_REQUEST': '↩️ Solicitud de devolución',
      'STOCK_INQUIRY': '🔍 Consulta de stock',
      'GENERAL': '💬 Consulta general',
      // FASE 2A
      'CANCEL_REQUEST': '✖️ Solicitud de cancelación',
      'DELIVERY_PROBLEM': '⚠️ Problema de entrega',
      'ADDRESS_CHANGE': '📍 Cambio de dirección'
    };
    return labels[intent.type] || 'Mensaje';
  }

  /**
   * Obtiene color de badge según tipo de intención
   */
  getIntentColor(intent: ChatIntent): string {
    const colors: Record<IntentType, string> = {
      'ORDER_STATUS': 'primary',
      'TRACKING_INFO': 'info',
      'DELIVERY_DATE': 'warning',
      'RETURN_REQUEST': 'danger',
      'STOCK_INQUIRY': 'success',
      'GENERAL': 'secondary',
      // FASE 2A
      'CANCEL_REQUEST': 'danger',
      'DELIVERY_PROBLEM': 'warning',
      'ADDRESS_CHANGE': 'info'
    };
    return colors[intent.type] || 'secondary';
  }

  /**
   * Determina si la confianza es suficiente para mostrar sugerencias
   */
  isHighConfidence(intent: ChatIntent): boolean {
    return intent.confidence >= 0.75;
  }
}
