import { Injectable } from '@angular/core';

export interface PriceParts {
  integer: string;
  decimals: string;
  total: string;
}

export interface FlashSale {
  id: string;
  type_discount: number; // 1 = percentage, 2 = fixed amount
  discount: number;
  discounts_products: any[];
}

@Injectable({
  providedIn: 'root'
})
export class PriceCalculationService {

  constructor() { }

  /**
   * Calcula el precio final de un producto aplicando descuentos de Flash Sale o campaña individual
   * @param product Producto a calcular
   * @param flashSales Array de Flash Sales activas
   * @returns Precio final con redondeo .95
   */
  calculateFinalPrice(product: any, flashSales: FlashSale[] = []): number {
    let discount = 0;
    let priceAfterDiscount = product.price_usd;
  
    // Verificar si el producto está en Flash Sale
    if (flashSales && flashSales.length) {
      for (const flash of flashSales) {
        const isInFlash = flash.discounts_products.some((fp: any) => {
          const flashProductId = fp.product?.id || fp.product?._id || fp.productId;
          const currentProductId = product.id || product._id;
          return flashProductId === currentProductId;
        });

        if (isInFlash) {
          // Aplicar descuento de Flash Sale
          if (flash.type_discount === 1) {
            discount = product.price_usd * flash.discount * 0.01;
          } else if (flash.type_discount === 2) {
            discount = flash.discount;
          }
          
          priceAfterDiscount = product.price_usd - discount;
          return this.formatPrice(priceAfterDiscount);
        }
      }
    }
    
    // Si no hay Flash Sale o el producto no está en Flash Sale, verificar campaña individual
    if (product.campaing_discount && product.campaing_discount.type_discount) {
      if (product.campaing_discount.type_discount === 1) { // Descuento por %
        discount = product.price_usd * product.campaing_discount.discount * 0.01;
      } else if (product.campaing_discount.type_discount === 2) { // Descuento por moneda
        discount = product.campaing_discount.discount;
      }
      
      priceAfterDiscount = product.price_usd - discount;
      return this.formatPrice(priceAfterDiscount);
    }

    // Si no hay ningún descuento, devolver precio original
    return product.price_usd;
  }

  /**
   * Formatea precio a 2 decimales exactos usando redondeo estándar
   * @param price Precio a formatear
   * @returns Precio con 2 decimales exactos
   */
  formatPrice(price: number): number {
    if (!price || price <= 0) {
      return 0.00;
    }
    return parseFloat(price.toFixed(2));
  }

  /**
   * Calcula el monto de descuento para un producto
   * @param product Producto
   * @param flashSales Array de Flash Sales activas
   * @returns Monto del descuento aplicado
   */
  getDiscountAmount(product: any, flashSales: FlashSale[] = []): number {
    let discount = 0;

    // Revisar todas las Flash Sales activas
    if (flashSales && flashSales.length) {
      for (const flash of flashSales) {
        const isInFlash = flash.discounts_products.some(
          (dp: any) => dp.product.id === product.id || dp.product._id === product._id
        );
        if (isInFlash) {
          // Aplicar descuento de Flash Sale
          if (flash.type_discount === 1) { // porcentaje
            discount = parseFloat((product.price_usd * flash.discount * 0.01).toFixed(2));
          } else if (flash.type_discount === 2) { // valor fijo
            discount = flash.discount;
          }
          return discount;
        }
      }
    }

    // Si no pertenece a ninguna Flash Sale, revisar campaña individual
    if (product.campaing_discount) {
      if (product.campaing_discount.type_discount === 1) { // porcentaje
        discount = parseFloat(
          (product.price_usd * product.campaing_discount.discount * 0.01).toFixed(2)
        );
      } else if (product.campaing_discount.type_discount === 2) { // valor fijo
        discount = product.campaing_discount.discount;
      }
    }

    return discount;
  }

  /**
   * Separa un precio en parte entera y decimal
   * @param price Precio a separar
   * @returns Objeto con integer, decimals y total
   */
  getPriceParts(price: number): PriceParts {
    const priceFixed = price.toFixed(2);
    const [integer, decimals] = priceFixed.split('.');
    return { 
      integer, 
      decimals, 
      total: priceFixed 
    };
  }

  /**
   * Calcula el precio con descuento para visualización en componentes
   * @param originalPrice Precio original
   * @param discount Descuento a aplicar
   * @returns Objeto con parte entera y decimal separadas
   */
  getPriceWithDiscount(originalPrice: number, discount: number): { integerPart: number, decimalPart: string } {
    const priceWithDiscount = originalPrice - discount;
    const integerPart = Math.floor(priceWithDiscount);
    const decimalPart = ((priceWithDiscount - integerPart) * 100).toFixed(0);
    return { integerPart, decimalPart };
  }

  /**
   * Verifica si un producto tiene descuento aplicado
   * @param originalPrice Precio original
   * @param finalPrice Precio final
   * @returns true si tiene descuento
   */
  hasDiscount(originalPrice: number, finalPrice: number): boolean {
    return finalPrice < originalPrice;
  }

  /**
   * Calcula el porcentaje de descuento
   * @param originalPrice Precio original  
   * @param finalPrice Precio final
   * @returns Porcentaje de descuento redondeado
   */
  getDiscountPercentage(originalPrice: number, finalPrice: number): number {
    if (originalPrice <= 0 || finalPrice >= originalPrice) return 0;
    return Math.round(((originalPrice - finalPrice) / originalPrice) * 100);
  }

  // 🎯 ================ MÉTODOS ESPECÍFICOS PARA ADMIN ================ 🎯

  /**
   * Aplica redondeo .95 a cualquier precio mostrado en el admin
   * Este método es específico para formateo de visualización en el admin
   * @param price Precio a formatear
   * @returns Precio con redondeo .95 aplicado
   */
  getAdminDisplayPrice(price: any): number {
    if (!price || isNaN(price)) return 0;
    const numPrice = parseFloat(price);
    if (numPrice <= 0) return numPrice;
    return this.formatPrice(numPrice);
  }

  /**
   * Calcula el total de una línea de venta aplicando redondeo .95
   * @param unitPrice Precio unitario
   * @param quantity Cantidad
   * @returns Total con redondeo .95
   */
  getSaleDetailTotal(unitPrice: any, quantity: any): number {
    const price = parseFloat(unitPrice) || 0;
    const qty = parseInt(quantity) || 1;
    const total = price * qty;
    return this.formatPrice(total);
  }

  /**
   * Obtiene el total de una venta aplicando redondeo .95
   * @param sale Objeto de venta con total
   * @returns Total con redondeo .95
   */
  getSaleTotal(sale: any): number {
    if (!sale) return 0;
    const total = sale.total || sale.total_amount || 0;
    return this.getAdminDisplayPrice(total);
  }
}