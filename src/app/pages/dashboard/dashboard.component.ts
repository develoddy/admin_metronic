import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { Toaster } from 'ngx-toast-notifications';
import { AnalyticsPrintfulService } from 'src/app/modules/printful/_services/analytics-printful.service';
import { OrderPrintfulService } from 'src/app/modules/printful/_services/order-printful.service';
import { PrintfulService } from 'src/app/modules/printful/_services/printful.service';
import { ModulesService, Module, ModulesSummary } from 'src/app/services/modules.service';

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalProfit: number;
  activeOrders: number;
  totalProducts: number;
  recentOrders: any[];
  ordersByStatus: any;
  isLoading: boolean;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {

  private subscriptions: Subscription[] = [];
  
  // Estados de carga
  isLoadingStats = false;
  isLoadingOrders = false;
  isLoadingProducts = false;

  // Estados de carga específicos para acciones
  isSyncingPrintful = false;
  isCreatingOrder = false;
  isLoadingAnalytics = false;
  isLoadingConfig = false;

  // Estados de error
  hasOrdersError = false;
  hasStatsError = false;
  ordersErrorMessage = '';

  // Datos del dashboard
  stats: DashboardStats = {
    totalOrders: 0,
    totalRevenue: 0,
    totalProfit: 0,
    activeOrders: 0,
    totalProducts: 0,
    recentOrders: [],
    ordersByStatus: {},
    isLoading: true
  };

  // Estados de conexión
  printfulStatus = {
    connected: true,
    lastSync: new Date(),
    webhookStatus: true
  };

  // Métricas de tiempo real
  todayStats = {
    orders: 0,
    revenue: 0,
    products: 0
  };

  // Sistema de módulos (Levels-style)
  modules: Module[] = [];
  modulesSummary: ModulesSummary | null = null;
  isLoadingModules = false;

  constructor( 
    private analyticsPrintful: AnalyticsPrintfulService,
    private orderPrintful: OrderPrintfulService,
    private printfulService: PrintfulService,
    public modulesService: ModulesService,
    private cd: ChangeDetectorRef,
    private router: Router,
    private toaster: Toaster
  ) { }

  ngOnInit(): void {
    console.log('🚀 Iniciando Dashboard Unificado');
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Carga todos los datos del dashboard
   */
  loadDashboardData(): void {
    this.loadFinancialStats();
    this.loadRecentOrders();
    this.loadProductStats();
    this.loadModules();
  }

  /**
   * Refrescar todo el dashboard con feedback
   */
  refreshDashboard(): void {
    this.toaster.open({
      text: 'Actualizando datos del dashboard...',
      caption: '🔄 Refrescando',
      type: 'info',
      duration: 2000
    });
    
    this.loadDashboardData();
    
    setTimeout(() => {
      this.toaster.open({
        text: 'Dashboard actualizado correctamente',
        caption: '✅ Completado',
        type: 'success',
        duration: 3000
      });
    }, 2000);
  }

  /**
   * Carga estadísticas financieras de Printful
   */
  loadFinancialStats(): void {
    this.isLoadingStats = true;
    
    const sub = this.analyticsPrintful.getFinancialStats().subscribe({
      next: (response: any) => {
        if (response.success && response.stats) {
          this.stats.totalOrders = response.stats.totalOrders || 0;
          this.stats.totalRevenue = response.stats.totalRevenue || 0;
          this.stats.totalProfit = response.stats.totalProfit || 0;
          this.stats.ordersByStatus = response.stats.byStatus || {};
          
          console.log('📊 Estadísticas financieras cargadas:', response.stats);
        }
        this.isLoadingStats = false;
        this.cd.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error cargando estadísticas:', error);
        this.isLoadingStats = false;
        this.cd.detectChanges();
      }
    });
    
    this.subscriptions.push(sub);
  }

  /**
   * Carga órdenes recientes
   */
  loadRecentOrders(): void {
    this.isLoadingOrders = true;
    this.hasOrdersError = false;
    this.ordersErrorMessage = '';
    console.log('🔄 Iniciando carga de órdenes recientes...');

    const sub = this.orderPrintful.getOrders(undefined, 5).subscribe({
      next: (response: any) => {
        console.log('📦 Respuesta del servicio de órdenes:', response);
        
        if (response && response.success) {
          this.stats.recentOrders = response.orders || [];
          this.stats.activeOrders = response.stats?.active || 0;
          
          console.log('✅ Órdenes recientes cargadas:', {
            total: this.stats.recentOrders.length,
            active: this.stats.activeOrders,
            orders: this.stats.recentOrders
          });
        } else {
          console.warn('⚠️ Respuesta sin success o estructura inesperada:', response);
          this.stats.recentOrders = [];
          this.stats.activeOrders = 0;
        }
        this.isLoadingOrders = false;
        this.cd.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error cargando órdenes:', error);
        console.error('❌ Detalles del error:', {
          status: error.status,
          message: error.message,
          url: error.url
        });
        
        // En caso de error, mostrar mensaje amigable
        this.hasOrdersError = true;
        this.ordersErrorMessage = error.status === 0 ? 
          'Error de conexión con el servidor' : 
          `Error ${error.status}: ${error.message || 'Error desconocido'}`;
          
        this.stats.recentOrders = [];
        this.stats.activeOrders = 0;
        this.isLoadingOrders = false;
        this.cd.detectChanges();
      }
    });

    this.subscriptions.push(sub);
  }

  /**
   * Carga estadísticas de productos
   */
  loadProductStats(): void {
    // Por ahora simulamos datos de productos
    // TODO: Implementar servicio real cuando esté disponible
    this.stats.totalProducts = 0; // Se actualizará con datos reales
  }

  /**
   * Sincronizar productos desde Printful
   */
  syncPrintfulProducts(): void {
    this.isSyncingPrintful = true;
    this.toaster.open({
      text: 'Iniciando sincronización con Printful...',
      caption: 'Sincronización',
      type: 'info',
      duration: 3000
    });
    
    console.log('🔄 Iniciando sincronización de productos...');
    
    const sub = this.printfulService.synPrintfulProducts().subscribe({
      next: (response: any) => {
        console.log('✅ Sincronización completada:', response);
        
        this.isSyncingPrintful = false;
        this.cd.detectChanges();
        
        this.toaster.open({
          text: `Sincronización exitosa. ${response.message || 'Productos actualizados'}`,
          caption: '✅ Completado',
          type: 'success',
          duration: 5000
        });
        
        // Recargar datos después de la sincronización
        setTimeout(() => {
          this.loadDashboardData();
        }, 1000);
      },
      error: (error) => {
        console.error('❌ Error en sincronización:', error);
        
        this.isSyncingPrintful = false;
        this.cd.detectChanges();
        
        this.toaster.open({
          text: `Error en sincronización: ${error.message || 'Error desconocido'}`,
          caption: '❌ Error',
          type: 'danger',
          duration: 5000
        });
      }
    });

    this.subscriptions.push(sub);
  }

  /**
   * Formatear números como moneda
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0);
  }

  /**
   * Formatear fechas
   */
  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Obtener color por estado de orden
   */
  getStatusColor(status: string): string {
    const colors: {[key: string]: string} = {
      'pending': 'warning',
      'fulfilled': 'success',
      'draft': 'info',
      'canceled': 'danger',
      'failed': 'danger'
    };
    return colors[status] || 'secondary';
  }

  /**
   * Navegar a módulo específico
   */
  navigateToPrintful(): void {
    console.log('🎯 Navegando al módulo Printful...');
    
    this.toaster.open({
      text: 'Redirigiendo al panel de Printful...',
      caption: 'Navegación',
      type: 'info',
      duration: 2000
    });
    
    // Navegar al módulo de Printful
    this.router.navigate(['/printful/dashboard']).catch(() => {
      // Si la ruta no existe, intentar otras rutas posibles
      this.router.navigate(['/printful']).catch(() => {
        this.router.navigate(['/printful/orders']).catch(() => {
          this.toaster.open({
            text: 'Módulo Printful no disponible. Contacta al administrador.',
            caption: '⚠️ No disponible',
            type: 'warning',
            duration: 4000
          });
        });
      });
    });
  }

  /**
   * Track by function para ngFor de órdenes
   */
  trackByOrderId(index: number, order: any): any {
    return order.id;
  }

  /**
   * Obtener lista de estados para mostrar
   */
  getStatusList(): {key: string, value: number}[] {
    if (!this.stats.ordersByStatus) return [];
    
    return Object.entries(this.stats.ordersByStatus).map(([key, value]) => ({
      key,
      value: value as number
    }));
  }

  /**
   * Carga datos mock como fallback temporal
   */
  loadMockData(): void {
    console.log('🔧 Cargando datos mock temporales...');
    
    // Mock data para testing
    this.stats.totalOrders = 25;
    this.stats.totalRevenue = 3420.50;
    this.stats.totalProfit = 1205.75;
    this.stats.activeOrders = 8;
    this.stats.totalProducts = 45;
    
    this.stats.ordersByStatus = {
      pending: 8,
      fulfilled: 15,
      draft: 2,
      canceled: 0,
      failed: 0
    };

    this.stats.recentOrders = [
      {
        id: 'PF001',
        external_id: 'ORD-2024-001',
        recipient: { 
          name: 'Juan Pérez',
          email: 'juan.perez@email.com'
        },
        status: 'pending',
        costs: { total: 29.99 }, // Costo Printful
        created: new Date(Date.now() - 1000 * 60 * 30) // hace 30 min
      },
      {
        id: 'PF002',
        external_id: 'ORD-2024-002',
        recipient: { 
          name: 'María González',
          email: 'maria.gonzalez@email.com'
        },
        status: 'fulfilled',
        costs: { total: 42.30 }, // Costo Printful
        created: new Date(Date.now() - 1000 * 60 * 60 * 2) // hace 2 horas
      },
      {
        id: 'PF003',
        external_id: 'ORD-2024-003',
        recipient: { 
          name: 'Carlos Rodríguez',
          email: 'carlos.rodriguez@email.com'
        },
        status: 'pending',
        costs: { total: 35.75 }, // Costo Printful
        created: new Date(Date.now() - 1000 * 60 * 60 * 4) // hace 4 horas
      },
      {
        id: 'PF004',
        external_id: 'ORD-2024-004',
        recipient: { 
          name: 'Ana Martínez',
          email: 'ana.martinez@email.com'
        },
        status: 'draft',
        costs: { total: 28.90 }, // Costo Printful
        created: new Date(Date.now() - 1000 * 60 * 60 * 6) // hace 6 horas
      }
    ];

    this.isLoadingStats = false;
    this.isLoadingOrders = false;
    this.isLoadingProducts = false;
    this.cd.detectChanges();

    console.log('✅ Datos mock cargados correctamente');
  }

  // ⚡ ================ ACCIONES RÁPIDAS ================ ⚡

  /**
   * Crear nueva orden
   */
  createNewOrder(): void {
    this.isCreatingOrder = true;
    this.cd.detectChanges();
    
    this.toaster.open({
      text: 'Preparando formulario de nueva orden...',
      caption: '📝 Nueva Orden',
      type: 'info',
      duration: 2000
    });
    
    // Simular carga y navegar
    setTimeout(() => {
      this.isCreatingOrder = false;
      this.cd.detectChanges();
      
      // Navegar a creación de orden (ajustar ruta según tu estructura)
      this.router.navigate(['/printful/orders/create']).catch(() => {
        this.router.navigate(['/orders/create']).catch(() => {
          this.toaster.open({
            text: 'Módulo de órdenes no disponible. Contacta al administrador.',
            caption: '⚠️ No disponible',
            type: 'warning',
            duration: 4000
          });
        });
      });
    }, 1500);
  }

  /**
   * Ver analytics detallados
   */
  viewAnalytics(): void {
    this.isLoadingAnalytics = true;
    this.cd.detectChanges();
    
    this.toaster.open({
      text: 'Cargando panel de analytics...',
      caption: '📊 Analytics',
      type: 'info',
      duration: 2000
    });
    
    setTimeout(() => {
      this.isLoadingAnalytics = false;
      this.cd.detectChanges();
      
      // Navegar a analytics
      this.router.navigate(['/analytics/dashboard']).catch(() => {
        this.router.navigate(['/analytics']).catch(() => {
          this.toaster.open({
            text: 'Panel de analytics no disponible. Contacta al administrador.',
            caption: '⚠️ No disponible',
            type: 'warning',
            duration: 4000
          });
        });
      });
    }, 1500);
  }

  /**
   * Abrir configuración del sistema
   */
  openConfiguration(): void {
    this.isLoadingConfig = true;
    this.cd.detectChanges();
    
    this.toaster.open({
      text: 'Accediendo a configuración del sistema...',
      caption: '⚙️ Configuración',
      type: 'info',
      duration: 2000
    });
    
    setTimeout(() => {
      this.isLoadingConfig = false;
      this.cd.detectChanges();
      
      // Navegar a configuración
      this.router.navigate(['/configuration']).catch(() => {
        this.router.navigate(['/settings']).catch(() => {
          this.toaster.open({
            text: 'Panel de configuración no disponible. Contacta al administrador.',
            caption: '⚠️ No disponible',
            type: 'warning',
            duration: 4000
          });
        });
      });
    }, 1500);
  }

  // 📦 ================ GESTIÓN DE ÓRDENES ================ 📦

  /**
   * Ver todas las órdenes de Printful
   */
  viewAllOrders(): void {
    this.toaster.open({
      text: 'Redirigiendo al panel de órdenes...',
      caption: '📦 Órdenes',
      type: 'info',
      duration: 2000
    });
    
    this.router.navigate(['/printful/orders']).catch(() => {
      this.router.navigate(['/orders']).catch(() => {
        this.toaster.open({
          text: 'Panel de órdenes no disponible. Contacta al administrador.',
          caption: '⚠️ No disponible',
          type: 'warning',
          duration: 4000
        });
      });
    });
  }

  /**
   * Ver detalles de una orden específica
   */
  viewOrderDetails(order: any): void {
    console.log('🔍 Viendo detalles de orden:', order.id);
    
    this.toaster.open({
      text: `Cargando detalles de la orden #${order.id}...`,
      caption: '📋 Detalles',
      type: 'info',
      duration: 2000
    });
    
    // Navegar a la orden específica en el módulo Printful
    this.router.navigate(['/printful/orders', order.id]).catch(() => {
      this.router.navigate(['/orders', order.id]).catch(() => {
        this.toaster.open({
          text: 'No se pudo abrir la orden. Verifica que el módulo esté disponible.',
          caption: '⚠️ Error',
          type: 'warning',
          duration: 4000
        });
      });
    });
  }

  /**
   * Obtiene el precio que paga el cliente (precio real de venta)
   */
  getCustomerPrice(order: any): number {
    // Helper para parsear números de forma segura
    const safeParseFloat = (value: any): number => {
      if (value === null || value === undefined || value === '') {
        return 0;
      }
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    };

    // Intentar obtener el precio real del cliente desde diferentes campos posibles
    if (order.retail_price) {
      const price = safeParseFloat(order.retail_price);
      if (price > 0) return price;
    }
    
    // Si tiene items con retail_price, sumar todos
    if (order.items && Array.isArray(order.items)) {
      const totalRetail = order.items.reduce((sum: number, item: any) => {
        const retailPrice = safeParseFloat(item.retail_price);
        const quantity = parseInt(item.quantity || 1);
        return sum + (retailPrice * quantity);
      }, 0);
      
      if (totalRetail > 0) {
        return totalRetail;
      }
    }
    
    // Si hay un order_total o customer_total
    if (order.order_total) {
      const price = safeParseFloat(order.order_total);
      if (price > 0) return price;
    }
    
    if (order.customer_total) {
      const price = safeParseFloat(order.customer_total);
      if (price > 0) return price;
    }
    
    // Si hay shipping del cliente, sumarlo al total de productos
    const productTotal = safeParseFloat(order.retail_costs?.subtotal);
    const shippingTotal = safeParseFloat(order.retail_costs?.shipping);
    const taxTotal = safeParseFloat(order.retail_costs?.tax);
    
    const totalRetailCosts = productTotal + shippingTotal + taxTotal;
    if (totalRetailCosts > 0) {
      return totalRetailCosts;
    }
    
    // Como último recurso, usar el costo de Printful
    const printfulCost = safeParseFloat(order.costs?.total);
    
    if (printfulCost > 0) {
      console.warn('⚠️ No se encontró precio del cliente para orden:', order.id, '- usando costo Printful:', printfulCost);
      return printfulCost;
    }
    
    // Si nada funciona, devolver 0
    console.error('❌ No se pudo determinar precio para orden:', order.id, order);
    return 0;
  }

  /**
   * Verifica si tenemos el precio real del cliente o es estimado
   */
  hasRealCustomerPrice(order: any): boolean {
    // Helper para verificar si un valor es válido
    const isValidPrice = (value: any): boolean => {
      if (value === null || value === undefined || value === '') return false;
      const parsed = parseFloat(value);
      return !isNaN(parsed) && parsed > 0;
    };

    return !!(
      isValidPrice(order.retail_price) || 
      isValidPrice(order.order_total) ||
      isValidPrice(order.customer_total) ||
      isValidPrice(order.retail_costs?.subtotal) ||
      (order.items && Array.isArray(order.items) && order.items.some((item: any) => isValidPrice(item.retail_price)))
    );
  }

  /**
   * Obtiene el costo real de Printful (para referencia admin)
   */
  getPrintfulCost(order: any): number {
    return order.costs?.total || 0;
  }

  /**
   * Obtiene el tiempo transcurrido desde la creación
   */
  getTimeAgo(date: string | Date): string {
    const now = new Date();
    const orderDate = new Date(date);
    const diffMs = now.getTime() - orderDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    } else {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `hace ${diffMins} min`;
    }
  }

  /**
   * Copia el ID de la orden al portapapeles
   */
  copyOrderId(order: any): void {
    const orderId = `#${order.id}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(orderId).then(() => {
        this.toaster.open({
          text: `ID de orden ${orderId} copiado al portapapeles`,
          caption: '📋 Copiado',
          type: 'success',
          duration: 2000
        });
      }).catch(() => {
        this.fallbackCopyToClipboard(orderId);
      });
    } else {
      this.fallbackCopyToClipboard(orderId);
    }
  }

  /**
   * SISTEMA DE MÓDULOS
   */

  /**
   * Cargar módulos activos y en draft
   */
  loadModules(): void {
    this.isLoadingModules = true;
    
    this.modulesService.listModules().subscribe({
      next: (response) => {
        if (response.success) {
          this.modules = response.modules || [];
          console.log('📦 Módulos cargados:', this.modules.length);
        }
        this.isLoadingModules = false;
        this.cd.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error cargando módulos:', error);
        this.isLoadingModules = false;
        this.cd.detectChanges();
      }
    });
  }

  /**
   * Toggle activar/desactivar módulo
   */
  toggleModule(module: Module): void {
    const action = module.is_active ? 'desactivar' : 'activar';
    
    this.modulesService.toggleModule(module.key).subscribe({
      next: (response) => {
        if (response.success) {
          this.toaster.open({
            text: `Módulo ${module.name} ${action === 'activar' ? 'activado' : 'desactivado'} correctamente`,
            caption: '✅ Módulo actualizado',
            type: 'success',
            duration: 3000
          });
          this.loadModules(); // Recargar
        }
      },
      error: (error) => {
        console.error('❌ Error toggle módulo:', error);
        this.toaster.open({
          text: 'Error al actualizar el módulo',
          caption: '❌ Error',
          type: 'danger',
          duration: 3000
        });
      }
    });
  }

  /**
   * Obtener clase de badge según estado del módulo
   */
  getModuleStatusBadgeClass(status: string): string {
    return this.modulesService.getStatusBadgeClass(status);
  }

  /**
   * Obtener icono según tipo de módulo
   */
  getModuleTypeIcon(type: string): string {
    return this.modulesService.getTypeIcon(type);
  }

  /**
   * Calcular días restantes para validación
   */
  calculateDaysRemaining(module: Module): number | null {
    if (!module.launched_at || module.status !== 'testing') {
      return null;
    }
    
    const launchedDate = new Date(module.launched_at);
    const now = new Date();
    const daysPassed = Math.floor((now.getTime() - launchedDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = module.validation_days - daysPassed;
    
    return Math.max(0, daysRemaining);
  }

  /**
   * Verificar si módulo está en riesgo de expirar
   */
  isModuleAtRisk(module: Module): boolean {
    const daysRemaining = this.calculateDaysRemaining(module);
    if (daysRemaining === null) return false;
    
    const progress = (module.total_sales / module.validation_target_sales) * 100;
    return daysRemaining <= 2 && progress < 50;
  }

  /**
   * Editar módulo
   */
  editModule(module: Module): void {
    this.router.navigate(['/lab/modules/edit', module.key]);
  }

  /**
   * Navegar a crear módulo
   */
  navigateToCreateModule(): void {
    this.router.navigate(['/lab/modules/create']);
  }

  /**
   * Fallback para copiar al portapapeles en navegadores antiguos
   */
  private fallbackCopyToClipboard(text: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      this.toaster.open({
        text: `ID de orden ${text} copiado al portapapeles`,
        caption: '📋 Copiado',
        type: 'success',
        duration: 2000
      });
    } catch (err) {
      this.toaster.open({
        text: 'No se pudo copiar. Selecciona y copia manualmente.',
        caption: '⚠️ Error',
        type: 'warning',
        duration: 3000
      });
    }
    
    document.body.removeChild(textArea);
  }
}
