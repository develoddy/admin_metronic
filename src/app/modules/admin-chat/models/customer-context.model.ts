/**
 * Customer Context Models
 * Interfaces para el panel de contexto del cliente en Admin-Chat
 */

export interface CustomerContext {
  identifier: string; // email o guest_id
  activeOrders: OrderWithPrintful[];
  completedOrders: any[]; // Order[] (simplificado por ahora)
  returns: any[]; // Return[] (simplificado por ahora)
  stats: CustomerStats;
  type: 'user' | 'guest';
}

export interface OrderWithPrintful {
  id: number;
  user_id?: number;
  guest_id?: number;
  email?: string;
  amount?: number; // Deprecated: usar 'total'
  total: number;   // ✅ Campo real del modelo Sale
  status: string;
  createdAt: string;
  updatedAt: string;
  printfulOrderId?: string;
  printfulStatus?: PrintfulStatus;
  printfulShipmentId?: string;
  printfulData?: PrintfulOrderStatus | null;
}

export interface PrintfulOrderStatus {
  status: PrintfulStatus;
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
  estimatedDelivery?: string;
  shipments?: PrintfulShipment[];
}

export interface PrintfulShipment {
  id: string;
  carrier: string;
  trackingNumber: string;
  trackingUrl: string;
  service: string;
  shipped_at?: string;
  reshipment?: boolean;
}

export type PrintfulStatus = 
  | 'draft' 
  | 'pending' 
  | 'failed' 
  | 'canceled' 
  | 'onhold' 
  | 'inprocess' 
  | 'partial' 
  | 'fulfilled';

export interface CustomerStats {
  totalSpent: number;
  completedOrders: number;
  activeOrders: number;
  returns: number;
  totalConversations: number;
  avgResponseTime?: number; // segundos (opcional por ahora)
}

export interface ChatIntent {
  type: IntentType;
  confidence: number; // 0.0 - 1.0
  extractedData?: {
    orderId?: number;
    product?: string;
    size?: string;
    trackingNumber?: string;
  };
  originalMessage?: string;
}

export type IntentType = 
  | 'ORDER_STATUS' 
  | 'RETURN_REQUEST' 
  | 'STOCK_INQUIRY' 
  | 'GENERAL'
  | 'DELIVERY_DATE'
  | 'TRACKING_INFO'
  | 'CANCEL_REQUEST'      // FASE 2A: Nueva intención
  | 'DELIVERY_PROBLEM'    // FASE 2A: Nueva intención
  | 'ADDRESS_CHANGE';     // FASE 2A: Nueva intención

export interface IntentPattern {
  type: IntentType;
  patterns: RegExp[];
  keywords: string[];
  confidence: number;
}

// ============================================
// FASE 2A: Modelos Extendidos para Printful
// ============================================

/**
 * Información completa de una orden de Printful (respuesta API real-time)
 */
export interface PrintfulOrderFull {
  id: string; // Printful Order ID
  external_id: string; // Sale ID local
  status: PrintfulStatus;
  shipping: string;
  shipping_service_name: string;
  created: number; // Unix timestamp
  updated: number; // Unix timestamp
  recipient: PrintfulRecipient;
  items: PrintfulItem[];
  shipments: PrintfulShipment[];
  costs?: PrintfulCosts;
  retail_costs?: PrintfulRetailCosts;
  dashboard_url?: string;
  estimated_fulfillment?: number; // Unix timestamp
}

export interface PrintfulRecipient {
  name: string;
  address1: string;
  city: string;
  state_code: string;
  country_code: string;
  zip: string;
  phone?: string;
  email?: string;
}

export interface PrintfulItem {
  id: number;
  external_id: string;
  variant_id: number;
  sync_variant_id?: number;
  quantity: number;
  price: string;
  name: string;
  product: PrintfulProductInfo;
  files?: any[];
  options?: any[];
}

export interface PrintfulProductInfo {
  variant_id: number;
  product_id: number;
  image: string;
  name: string;
}

export interface PrintfulCosts {
  currency: string;
  subtotal: string;
  discount: string;
  shipping: string;
  tax: string;
  total: string;
}

export interface PrintfulRetailCosts {
  currency: string;
  subtotal: string;
  discount: string;
  shipping: string;
  tax: string;
  total: string;
}

/**
 * Información de tracking en tiempo real
 */
export interface TrackingInfo {
  trackingNumber: string;
  trackingUrl: string;
  carrier: string;
  service: string;
  shipped_at?: string;
  delivered_at?: string;
  estimated_delivery?: {
    min: string;
    max: string;
  };
  lastUpdate?: string;
  currentLocation?: string;
  events?: TrackingEvent[];
}

export interface TrackingEvent {
  timestamp: string;
  status: string;
  location?: string;
  description: string;
}

/**
 * Evento del timeline de una orden
 */
export interface TimelineEvent {
  phase: 'created' | 'confirmed' | 'production' | 'shipped' | 'delivered' | 'failed' | 'canceled';
  status: 'completed' | 'in-progress' | 'pending' | 'failed';
  label: string;
  timestamp?: string;
  estimatedTime?: string;
  description?: string;
  icon?: string;
  color?: string;
}
