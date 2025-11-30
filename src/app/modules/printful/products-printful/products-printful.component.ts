import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProductService } from '../../product/_services/product.service';
import { PrintfulService } from '../_services/printful.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface ProductFilter {
  search: string;
  category: string | null;
  minPrice: number;
  maxPrice: number;
  state: string | null;
  colors: string[];
  sizes: string[];
}

@Component({
  selector: 'app-products-printful',
  templateUrl: './products-printful.component.html',
  styleUrls: ['./products-printful.component.scss']
})
export class ProductsPrintfulComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Datos
  public products: any[] = [];
  public filteredProducts: any[] = [];
  public categories: any[] = [];
  public availableColors: string[] = [];
  public availableSizes: string[] = [];

  // Estado de carga
  public isLoading = false;

  // Filtros
  public filters: ProductFilter = {
    search: '',
    category: null,
    minPrice: 0,
    maxPrice: 1000,
    state: null,
    colors: [],
    sizes: []
  };

  // Paginación
  public currentPage = 1;
  public itemsPerPage = 12;
  public totalItems = 0;

  // Vista
  public viewMode: 'grid' | 'list' = 'grid';

  // Modal de detalles
  public showModal = false;
  public selectedProduct: any = null;

  // Estados de operaciones
  public syncingProductId: number | null = null;
  public deletingProductId: number | null = null;

  // Sistema de notificaciones
  public showToast = false;
  public toastMessage = '';
  public toastType: 'success' | 'error' | 'warning' | 'info' = 'success';

  // Confirmaciones
  public showConfirmModal = false;
  public confirmTitle = '';
  public confirmMessage = '';
  public confirmAction: (() => void) | null = null;

  constructor(
    private productService: ProductService,
    private printfulService: PrintfulService,
    private cd: ChangeDetectorRef,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    // Read query params from URL and apply filters
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['state']) {
        this.filters.state = params['state'];
        this.cd.detectChanges();
      }
      if (params['filter']) {
        // Handle other filter types if needed
        console.log('Filter type:', params['filter']);
      }
      this.loadProducts();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga todos los productos de Printful
   */
  loadProducts(): void {
    this.isLoading = true;
    this.cd.detectChanges();

    this.productService.allProducts(this.filters.search, this.filters.category)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: any) => {
          console.log('📦 Productos recibidos:', resp);

          // Filtrar solo productos de Printful (type_inventario = 2)
          this.products = (resp.products || []).filter((p: any) => p.type_inventario === 2);
          
          console.log('✅ Productos Printful filtrados:', this.products.length);
          
          // Extraer categorías únicas
          this.extractCategories();
          
          // Extraer colores y tallas disponibles
          this.extractFiltersData();
          
          // Aplicar filtros
          this.applyFilters();
          
          this.isLoading = false;
          this.cd.detectChanges();
        },
        error: (error) => {
          console.error('❌ Error cargando productos:', error);
          this.isLoading = false;
          this.cd.detectChanges();
        }
      });
  }

  /**
   * Extrae las categorías únicas
   */
  private extractCategories(): void {
    const categoriesMap = new Map();
    
    this.products.forEach(product => {
      if (product.categorie && product.categorie.id) {
        categoriesMap.set(product.categorie.id, product.categorie);
      }
    });
    
    this.categories = Array.from(categoriesMap.values());
  }

  /**
   * Extrae colores y tallas disponibles de todos los productos
   */
  private extractFiltersData(): void {
    const colorsSet = new Set<string>();
    const sizesSet = new Set<string>();

    this.products.forEach(product => {
      // Parsear tags para obtener colores
      if (product.tags) {
        try {
          // Los tags pueden venir como array directamente o como JSON string
          const tags = Array.isArray(product.tags) ? product.tags : JSON.parse(product.tags);
          if (Array.isArray(tags)) {
            tags.forEach((color: string) => colorsSet.add(color));
          }
        } catch (e) {
          // Tags no es JSON válido o ya es array
          if (Array.isArray(product.tags)) {
            product.tags.forEach((color: string) => colorsSet.add(color));
          }
        }
      }

      // Obtener tallas de variantes
      if (product.variedades && Array.isArray(product.variedades)) {
        product.variedades.forEach((variedad: any) => {
          if (variedad.valor) {
            sizesSet.add(variedad.valor);
          }
        });
      }
    });

    this.availableColors = Array.from(colorsSet).sort();
    this.availableSizes = Array.from(sizesSet).sort();
    
    console.log('🎨 Colores extraídos:', this.availableColors);
    console.log('📏 Tallas extraídas:', this.availableSizes);
  }

  /**
   * Aplica todos los filtros activos
   */
  applyFilters(): void {
    let filtered = [...this.products];

    // Filtro por búsqueda
    if (this.filters.search) {
      const searchLower = this.filters.search.toLowerCase();
      filtered = filtered.filter(p => 
        p.title?.toLowerCase().includes(searchLower) ||
        p.sku?.toLowerCase().includes(searchLower)
      );
    }

    // Filtro por categoría
    if (this.filters.category) {
      filtered = filtered.filter(p => p.categorie?.id == this.filters.category);
    }

    // Filtro por rango de precio
    filtered = filtered.filter(p => {
      const price = p.price_eur || p.price || p.price_usd || 0;
      return price >= this.filters.minPrice && price <= this.filters.maxPrice;
    });

    // Filtro por estado
    if (this.filters.state !== null && this.filters.state !== '') {
      // Convert to number for comparison since query params come as strings
      const stateFilter = typeof this.filters.state === 'string' 
        ? parseInt(this.filters.state) 
        : this.filters.state;
      filtered = filtered.filter(p => p.state === stateFilter);
    }

    // Filtro por colores
    if (this.filters.colors.length > 0) {
      filtered = filtered.filter(p => {
        try {
          // Los tags vienen como array directamente desde el backend
          const productColors = Array.isArray(p.tags) ? p.tags : JSON.parse(p.tags || '[]');
          return this.filters.colors.some(color => productColors.includes(color));
        } catch (e) {
          return false;
        }
      });
    }

    // Filtro por tallas
    if (this.filters.sizes.length > 0) {
      filtered = filtered.filter(p => {
        if (!p.variedades || !Array.isArray(p.variedades)) return false;
        return p.variedades.some((v: any) => this.filters.sizes.includes(v.valor));
      });
    }

    this.filteredProducts = filtered;
    this.totalItems = filtered.length;
    this.currentPage = 1;
    
    console.log('🔍 Filtros aplicados - Total productos:', this.totalItems);
    this.cd.detectChanges();
  }

  /**
   * Resetea todos los filtros
   */
  resetFilters(): void {
    this.filters = {
      search: '',
      category: null,
      minPrice: 0,
      maxPrice: 1000,
      state: null,
      colors: [],
      sizes: []
    };
    this.applyFilters();
  }

  /**
   * Maneja el cambio de búsqueda
   */
  onSearchChange(): void {
    this.applyFilters();
  }

  /**
   * Maneja el cambio de categoría
   */
  onCategoryChange(): void {
    this.applyFilters();
  }

  /**
   * Maneja el cambio de estado
   */
  onStateChange(): void {
    this.applyFilters();
  }

  /**
   * Maneja el cambio de rango de precio
   */
  onPriceRangeChange(): void {
    this.applyFilters();
  }

  /**
   * Toggle color en filtro
   */
  toggleColorFilter(color: string): void {
    const index = this.filters.colors.indexOf(color);
    if (index > -1) {
      this.filters.colors.splice(index, 1);
    } else {
      this.filters.colors.push(color);
    }
    this.applyFilters();
  }

  /**
   * Toggle talla en filtro
   */
  toggleSizeFilter(size: string): void {
    const index = this.filters.sizes.indexOf(size);
    if (index > -1) {
      this.filters.sizes.splice(index, 1);
    } else {
      this.filters.sizes.push(size);
    }
    this.applyFilters();
  }

  /**
   * Verifica si un color está seleccionado
   */
  isColorSelected(color: string): boolean {
    return this.filters.colors.includes(color);
  }

  /**
   * Verifica si una talla está seleccionada
   */
  isSizeSelected(size: string): boolean {
    return this.filters.sizes.includes(size);
  }

  /**
   * Cambia el modo de vista
   */
  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
  }

  /**
   * Obtiene productos paginados
   */
  get paginatedProducts(): any[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredProducts.slice(start, end);
  }

  /**
   * Obtiene el total de páginas
   */
  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  /**
   * Cambia de página
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Obtiene la imagen del producto
   */
  getProductImage(product: any): string {
    // El campo "imagen" ya viene con la URL completa desde el backend
    if (product.imagen) {
      return product.imagen;
    }
    // Fallback para productos sin imagen
    return 'assets/media/products/product-placeholder.jpg';
  }

  /**
   * Obtiene el badge class según el estado
   */
  getStateBadgeClass(state: number): string {
    return state === 2 ? 'badge-success' : 'badge-secondary';
  }

  /**
   * Obtiene el texto del estado
   */
  getStateText(state: number): string {
    return state === 2 ? 'Activo' : 'Inactivo';
  }

  /**
   * Cuenta las variantes de un producto
   */
  getVariantsCount(product: any): number {
    return product.variedades?.length || 0;
  }

  /**
   * Abre el modal de detalles del producto
   */
  viewDetails(product: any): void {
    this.selectedProduct = product;
    this.showModal = true;
    this.cd.detectChanges();
  }

  /**
   * Cierra el modal de detalles
   */
  closeModal(): void {
    this.showModal = false;
    this.selectedProduct = null;
    this.cd.detectChanges();
  }

  /**
   * Toggle estado del producto (Activo/Inactivo)
   */
  toggleState(product: any): void {
    const newState = product.state === 2 ? 1 : 2;
    const action = newState === 2 ? 'activar' : 'desactivar';
    
    this.showConfirmation(
      `${action === 'activar' ? 'Activar' : 'Desactivar'} Producto`,
      `¿Estás seguro de ${action} el producto "${product.title}"?`,
      () => {
        const updateData = {
          _id: product._id,
          state: newState,
          title: product.title,
          sku: product.sku,
          categorie: product.categorie?.id,
          price_eur: product.price_eur || product.price || product.price_usd,
          stock: product.stock
        };

        this.productService.updateProduct(updateData)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (resp: any) => {
              console.log('✅ Estado actualizado:', resp);
              product.state = newState;
              this.cd.detectChanges();
              this.showToastNotification(
                `Producto ${action === 'activar' ? 'activado' : 'desactivado'} correctamente`,
                'success'
              );
            },
            error: (error) => {
              console.error('❌ Error actualizando estado:', error);
              this.showToastNotification('Error al actualizar el estado del producto', 'error');
            }
          });
      }
    );
  }

  /**
   * Re-sincroniza un producto individual desde Printful
   * Nota: Printful API no soporta sync individual, se sincroniza todo el catálogo
   */
  syncProduct(product: any): void {
    this.showConfirmation(
      'Re-sincronizar desde Printful',
      `¿Deseas sincronizar todos los productos desde Printful?\n\n⚠️ Nota: La API de Printful no permite sincronizar productos individuales, se sincronizará todo el catálogo.\n\nEsto puede tardar varios segundos.`,
      () => {
        this.syncingProductId = product._id;
        this.cd.detectChanges();

        // Llamar al endpoint de sincronización completa desde Printful
        this.printfulService.synPrintfulProducts()
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (resp: any) => {
              console.log('✅ Sincronización completada:', resp);
              
              // Recargar productos para mostrar datos actualizados
              this.loadProducts();
              this.syncingProductId = null;
              
              const message = `Sincronización completada:\n• ${resp.stats?.created || 0} creados\n• ${resp.stats?.updated || 0} actualizados\n• ${resp.stats?.skipped || 0} sin cambios`;
              this.showToastNotification(message, 'success');
            },
            error: (error) => {
              console.error('❌ Error sincronizando:', error);
              this.syncingProductId = null;
              this.cd.detectChanges();
              this.showToastNotification('Error al sincronizar desde Printful', 'error');
            }
          });
      }
    );
  }

  /**
   * Elimina un producto del catálogo local
   */
  deleteProduct(product: any): void {
    this.showConfirmation(
      'Eliminar Producto',
      `¿Estás seguro de eliminar "${product.title}" del catálogo?\n\n⚠️ Nota: Esto NO lo eliminará de Printful, solo de tu base de datos local.`,
      () => {
        this.deletingProductId = product._id;
        this.cd.detectChanges();

        this.productService.deleteProduct(product._id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (resp: any) => {
              console.log('✅ Producto eliminado:', resp);
              
              // Remover de la lista local
              this.products = this.products.filter(p => p._id !== product._id);
              this.applyFilters();
              
              this.deletingProductId = null;
              this.cd.detectChanges();
              
              this.showToastNotification('Producto eliminado correctamente del catálogo', 'success');
            },
            error: (error) => {
              console.error('❌ Error eliminando producto:', error);
              this.deletingProductId = null;
              this.cd.detectChanges();
              this.showToastNotification('Error al eliminar el producto', 'error');
            }
          });
      }
    );
  }

  /**
   * Verifica si un producto está siendo sincronizado
   */
  isSyncing(productId: number): boolean {
    return this.syncingProductId === productId;
  }

  /**
   * Verifica si un producto está siendo eliminado
   */
  isDeleting(productId: number): boolean {
    return this.deletingProductId === productId;
  }

  /**
   * Formatea la fecha de última sincronización
   */
  formatDate(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Obtiene el link al dashboard de Printful
   */
  getPrintfulLink(sku: string): string {
    return `https://www.printful.com/dashboard/default/products`;
  }

  /**
   * Muestra una notificación toast
   */
  showToastNotification(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    this.cd.detectChanges();

    // Auto-cerrar después de 3 segundos
    setTimeout(() => {
      this.closeToast();
    }, 3000);
  }

  /**
   * Cierra la notificación toast
   */
  closeToast(): void {
    this.showToast = false;
    this.cd.detectChanges();
  }

  /**
   * Muestra un modal de confirmación
   */
  showConfirmation(title: string, message: string, onConfirm: () => void): void {
    this.confirmTitle = title;
    this.confirmMessage = message;
    this.confirmAction = onConfirm;
    this.showConfirmModal = true;
    this.cd.detectChanges();
  }

  /**
   * Cancela la confirmación
   */
  cancelConfirmation(): void {
    this.showConfirmModal = false;
    this.confirmAction = null;
    this.cd.detectChanges();
  }

  /**
   * Ejecuta la acción confirmada
   */
  executeConfirmation(): void {
    if (this.confirmAction) {
      this.confirmAction();
    }
    this.showConfirmModal = false;
    this.confirmAction = null;
    this.cd.detectChanges();
  }
}
