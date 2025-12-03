import { Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AdminSalesService } from '../../admin-sales/services/admin-sales.service';
import { ReturnsService } from '../../returns/_services/returns.service';
import { UsersService } from '../../users/_services/users.service';
import { CustomerContext, CustomerStats } from '../models/customer-context.model';

/**
 * CustomerContextService
 * Centraliza la carga de información del cliente (pedidos, devoluciones, stats)
 * para mostrar en el Customer Context Panel del Admin-Chat
 */
@Injectable({
  providedIn: 'root'
})
export class CustomerContextService {

  constructor(
    private salesService: AdminSalesService,
    private returnsService: ReturnsService,
    private usersService: UsersService
  ) {}

  /**
   * Carga el contexto completo del cliente
   * @param identifier Email del usuario/guest
   * @param type 'user' o 'guest'
   * @returns Observable<CustomerContext>
   */
  getCustomerContext(identifier: string, type: 'user' | 'guest' = 'user'): Observable<CustomerContext> {
    if (!identifier || identifier.trim() === '') {
      return of(this.createEmptyContext(identifier, type));
    }

    return forkJoin({
      sales: this.loadSales(identifier),
      returns: this.loadReturns(identifier),
    }).pipe(
      map(data => {
        const activeOrders = this.filterActiveOrders(data.sales);
        const completedOrders = this.filterCompletedOrders(data.sales);
        const stats = this.calculateStats(data.sales, data.returns);

        return {
          identifier,
          type,
          activeOrders,
          completedOrders,
          returns: data.returns,
          stats
        };
      }),
      catchError(error => {
        console.error('[CustomerContextService] Error loading customer context:', error);
        return of(this.createEmptyContext(identifier, type));
      })
    );
  }

  /**
   * Carga pedidos del cliente (todos)
   */
  private loadSales(identifier: string): Observable<any[]> {
    return this.salesService.getSales({ q: identifier }).pipe(
      map(resp => {
        console.log('[CustomerContextService] 🔍 Respuesta completa de getSales:', resp);
        
        if (resp && resp.success && Array.isArray(resp.sales)) {
          console.log('[CustomerContextService] 📦 Total sales encontradas:', resp.sales.length);
          
          // Log detallado de cada sale
          resp.sales.forEach((sale: any) => {
            console.log(`[CustomerContextService]   - Sale #${sale.id}:`);
            console.log(`     • Estado regular: "${sale.status || 'N/A'}"`);
            console.log(`     • Estado Printful: "${sale.printfulStatus || 'N/A'}"`);
            console.log(`     • Total: ${sale.total || 'N/A'}€`);
            console.log(`     • PrintfulOrderId: "${sale.printfulOrderId || 'N/A'}"`);
            console.log(`     • Usuario: ${sale.User?.email || sale.Guest?.email || 'N/A'}`);
          });
          
          return resp.sales;
        }
        
        console.warn('[CustomerContextService] ⚠️ Respuesta sin sales array válido');
        return [];
      }),
      catchError(err => {
        console.error('[CustomerContextService] Error loading sales:', err);
        return of([]);
      })
    );
  }

  /**
   * Carga devoluciones del cliente
   */
  private loadReturns(identifier: string): Observable<any[]> {
    return this.returnsService.getReturns({ q: identifier }).pipe(
      map((resp: any) => {
        if (resp && resp.success && Array.isArray(resp.returns)) {
          return resp.returns;
        }
        if (Array.isArray(resp)) {
          return resp;
        }
        return [];
      }),
      catchError(err => {
        console.error('[CustomerContextService] Error loading returns:', err);
        return of([]);
      })
    );
  }

  /**
   * Filtra pedidos activos (estados: pending, processing, shipped)
   * Si no existe 'status', usa 'printfulStatus'
   */
  private filterActiveOrders(sales: any[]): any[] {
    if (!Array.isArray(sales)) return [];
    
    // Estados regulares (cuando existe sale.status)
    const activeStatuses = ['pending', 'processing', 'shipped', 'paid', 'confirmed'];
    
    // Estados de Printful considerados activos (no completados)
    // ✅ Incluye 'shipped' porque el pedido sigue activo hasta que sea 'fulfilled'
    const activePrintfulStatuses = ['draft', 'pending', 'failed', 'canceled', 'onhold', 'inprocess', 'shipped', 'partial'];
    
    console.log('[CustomerContextService] 🔎 Filtrando pedidos activos...');
    console.log(`[CustomerContextService] Estados regulares activos: ${activeStatuses.join(', ')}`);
    console.log(`[CustomerContextService] Estados Printful activos: ${activePrintfulStatuses.join(', ')}`);
    
    const filtered = sales.filter(sale => {
      // Priorizar status regular si existe
      if (sale.status) {
        const status = sale.status.toLowerCase();
        const isActive = activeStatuses.includes(status);
        console.log(`[CustomerContextService]   Sale #${sale.id} (status: ${status}): ${isActive ? '✅ ACTIVO' : '❌ NO activo'}`);
        return isActive;
      }
      
      // Si no existe status, usar printfulStatus
      if (sale.printfulStatus) {
        const printfulStatus = sale.printfulStatus.toLowerCase();
        const isActive = activePrintfulStatuses.includes(printfulStatus);
        console.log(`[CustomerContextService]   Sale #${sale.id} (printfulStatus: ${printfulStatus}): ${isActive ? '✅ ACTIVO' : '❌ NO activo'}`);
        return isActive;
      }
      
      console.log(`[CustomerContextService]   Sale #${sale.id} (sin status): ❌ IGNORADO`);
      return false;
    });
    
    console.log(`[CustomerContextService] 📊 Resultado: ${filtered.length} pedidos activos de ${sales.length} totales`);
    return filtered;
  }

  /**
   * Filtra pedidos completados (estados: delivered, completed, fulfilled)
   * Si no existe 'status', usa 'printfulStatus'
   */
  private filterCompletedOrders(sales: any[]): any[] {
    if (!Array.isArray(sales)) return [];
    
    // Estados regulares completados
    const completedStatuses = ['delivered', 'completed', 'fulfilled'];
    
    // Estados de Printful completados
    const completedPrintfulStatuses = ['fulfilled', 'shipped'];
    
    return sales.filter(sale => {
      // Priorizar status regular si existe
      if (sale.status) {
        return completedStatuses.includes(sale.status.toLowerCase());
      }
      
      // Si no existe status, usar printfulStatus
      if (sale.printfulStatus) {
        return completedPrintfulStatuses.includes(sale.printfulStatus.toLowerCase());
      }
      
      return false;
    });
  }

  /**
   * Calcula estadísticas del cliente
   */
  private calculateStats(sales: any[], returns: any[]): CustomerStats {
    if (!Array.isArray(sales)) sales = [];
    if (!Array.isArray(returns)) returns = [];

    const completedOrders = this.filterCompletedOrders(sales);
    const activeOrders = this.filterActiveOrders(sales);
    
    const totalSpent = completedOrders.reduce((sum, sale) => {
      const amount = parseFloat(sale.amount) || 0;
      return sum + amount;
    }, 0);

    return {
      totalSpent: Math.round(totalSpent * 100) / 100,
      completedOrders: completedOrders.length,
      activeOrders: activeOrders.length,
      returns: returns.length,
      totalConversations: 0, // TODO: implementar cuando exista endpoint
      avgResponseTime: undefined
    };
  }

  /**
   * Crea un contexto vacío en caso de error
   */
  private createEmptyContext(identifier: string, type: 'user' | 'guest'): CustomerContext {
    return {
      identifier,
      type,
      activeOrders: [],
      completedOrders: [],
      returns: [],
      stats: {
        totalSpent: 0,
        completedOrders: 0,
        activeOrders: 0,
        returns: 0,
        totalConversations: 0
      }
    };
  }

  /**
   * Verifica si el cliente tiene pedidos activos
   */
  hasActiveOrders(context: CustomerContext): boolean {
    return context.activeOrders.length > 0;
  }

  /**
   * Verifica si el cliente tiene devoluciones
   */
  hasReturns(context: CustomerContext): boolean {
    return context.returns.length > 0;
  }

  /**
   * Obtiene el pedido más reciente del cliente
   */
  getLatestOrder(context: CustomerContext): any | null {
    if (context.activeOrders.length === 0) return null;
    
    return context.activeOrders.reduce((latest, current) => {
      const latestDate = new Date(latest.createdAt).getTime();
      const currentDate = new Date(current.createdAt).getTime();
      return currentDate > latestDate ? current : latest;
    }, context.activeOrders[0]);
  }
}
