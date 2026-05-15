import { ChangeDetectionStrategy, Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService, CartService, CatalogService } from '../../../../core/services';
import { CatalogProduct } from '../../../../interfaces';

interface CatalogMaterial {
  name: string;
  description: string;
  bestFor: string;
  finish: string;
}

@Component({
  selector: 'app-catalog-page',
  imports: [RouterLink],
  templateUrl: './catalog-page.component.html',
  styleUrl: './catalog-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatalogPageComponent implements OnDestroy {
  private readonly cartMessageDelay = 2600;
  private cartMessageTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private readonly authService = inject(AuthService);
  private readonly cartService = inject(CartService);
  private readonly catalogService = inject(CatalogService);
  private readonly router = inject(Router);

  readonly isAuthenticated = this.authService.isAuthenticated;
  readonly cartItems = this.cartService.items;
  readonly cartItemCount = this.cartService.itemCount;
  readonly cartEstimatedTotal = this.cartService.estimatedTotal;

  readonly products = signal<CatalogProduct[]>([]);
  readonly isLoadingProducts = signal(true);

  readonly fallbackProducts: CatalogProduct[] = [
    {
      id: 'fallback-figures',
      name: 'Figuras coleccionables',
      category: 'Miniaturas',
      description: 'Piezas con alto detalle para pintura, exhibicion o regalos personalizados.',
      image_url: 'assets/landing/hero-model.png',
      materials: ['Resina', 'PLA'],
      colors: ['Gris', 'Negro', 'Blanco'],
      price_from: 280,
      delivery: '5 a 7 dias',
      tags: ['Alto detalle', 'Base incluida', 'Acabado fino'],
      is_active: true
    },
    {
      id: 'fallback-prototypes',
      name: 'Prototipos funcionales',
      category: 'Producto',
      description: 'Modelos resistentes para validar forma, escala, ensamble y ergonomia.',
      image_url: 'assets/landing/prototype.png',
      materials: ['PLA', 'PETG', 'ABS'],
      colors: ['Negro', 'Blanco', 'Azul'],
      price_from: 180,
      delivery: '2 a 4 dias',
      tags: ['Iteracion rapida', 'Medidas reales', 'Uso tecnico'],
      is_active: true
    },
    {
      id: 'fallback-custom',
      name: 'Piezas bajo pedido',
      category: 'Fabricacion',
      description: 'Impresion personalizada desde STL, referencia visual o requerimientos del cliente.',
      image_url: 'assets/landing/alien.webp',
      materials: ['PLA', 'PETG', 'Resina'],
      colors: ['Verde', 'Gris', 'Rojo'],
      price_from: 220,
      delivery: '3 a 6 dias',
      tags: ['Personalizable', 'Cotizacion clara', 'Seguimiento'],
      is_active: true
    },
    {
      id: 'fallback-keychains',
      name: 'Llaveros personalizados',
      category: 'Promocionales',
      description: 'Accesorios ligeros con logo, nombre, silueta o relieve personalizado.',
      image_url: 'assets/landing/bloxing-glove.png',
      materials: ['PLA', 'TPU'],
      colors: ['Negro', 'Blanco', 'Rojo', 'Azul'],
      price_from: 45,
      delivery: '2 a 3 dias',
      tags: ['Por volumen', 'Color a elegir', 'Ligero'],
      is_active: true
    },
    {
      id: 'fallback-organizers',
      name: 'Soportes y organizadores',
      category: 'Hogar y oficina',
      description: 'Bases, soportes y accesorios utiles para escritorio, cables, herramientas o repisas.',
      image_url: 'assets/landing/organizer.png',
      materials: ['PLA', 'PETG'],
      colors: ['Negro', 'Blanco', 'Gris'],
      price_from: 90,
      delivery: '2 a 5 dias',
      tags: ['Uso diario', 'Resistente', 'A medida'],
      is_active: true
    },
    {
      id: 'fallback-flexible',
      name: 'Piezas flexibles',
      category: 'Especiales',
      description: 'Componentes con elasticidad para protectores, agarres, empaques o pruebas de ajuste.',
      image_url: 'assets/landing/flexible.png',
      materials: ['TPU'],
      colors: ['Negro', 'Rojo', 'Azul'],
      price_from: 160,
      delivery: '4 a 7 dias',
      tags: ['Flexible', 'Antigolpe', 'Uso tecnico'],
      is_active: true
    }
  ];

  readonly materials: CatalogMaterial[] = [
    {
      name: 'PLA',
      description: 'Material versatil, limpio y economico para piezas decorativas y prototipos rapidos.',
      bestFor: 'Prototipos, llaveros y organizadores',
      finish: 'Mate o semibrillante'
    },
    {
      name: 'PETG',
      description: 'Mas resistente al impacto y al uso continuo que PLA, ideal para piezas funcionales.',
      bestFor: 'Soportes, ensambles y piezas utiles',
      finish: 'Liso con brillo moderado'
    },
    {
      name: 'Resina',
      description: 'Alta definicion para miniaturas, figuras, detalles finos y superficies listas para pintar.',
      bestFor: 'Figuras y piezas de detalle',
      finish: 'Suave y de alta precision'
    },
    {
      name: 'TPU',
      description: 'Flexible y resistente para piezas que requieren elasticidad o absorcion de golpes.',
      bestFor: 'Protectores, agarres y empaques',
      finish: 'Satinado flexible'
    }
  ];

  readonly selectedMaterial = signal('Todos');
  readonly selectedColor = signal('Todos');
  readonly maxPrice = signal(300);
  readonly isPriceFilterEnabled = signal(false);
  readonly cartMessage = signal('');
  readonly isCartMessageVisible = signal(false);

  readonly materialOptions = computed(() => [
    'Todos',
    ...Array.from(new Set(this.products().flatMap((product) => product.materials))).sort()
  ]);

  readonly colorOptions = computed(() => [
    'Todos',
    ...Array.from(new Set(this.products().flatMap((product) => product.colors))).sort()
  ]);

  readonly filteredProducts = computed(() =>
    this.products().filter((product) => {
      const matchesMaterial =
        this.selectedMaterial() === 'Todos' || product.materials.includes(this.selectedMaterial());
      const matchesColor =
        this.selectedColor() === 'Todos' || product.colors.includes(this.selectedColor());
      const matchesPrice = !this.isPriceFilterEnabled() || product.price_from <= this.maxPrice();

      return matchesMaterial && matchesColor && matchesPrice;
    })
  );

  readonly activeFilterCount = computed(() => {
    let count = 0;

    if (this.selectedMaterial() !== 'Todos') {
      count += 1;
    }

    if (this.selectedColor() !== 'Todos') {
      count += 1;
    }

    if (this.isPriceFilterEnabled()) {
      count += 1;
    }

    return count;
  });

  constructor() {
    void this.loadProducts();
  }

  ngOnDestroy(): void {
    this.clearCartMessageTimeout();
  }

  async loadProducts(): Promise<void> {
    this.isLoadingProducts.set(true);

    try {
      const products = await firstValueFrom(this.catalogService.list({ activeOnly: true }));
      this.products.set(products.length ? products : this.fallbackProducts);
    } catch {
      this.products.set(this.fallbackProducts);
    } finally {
      this.isLoadingProducts.set(false);
    }
  }

  updateMaterial(material: string): void {
    this.selectedMaterial.set(material);
  }

  updateColor(color: string): void {
    this.selectedColor.set(color);
  }

  updateMaxPrice(price: string): void {
    this.maxPrice.set(Number(price));
    this.isPriceFilterEnabled.set(true);
  }

  clearPriceFilter(): void {
    this.maxPrice.set(300);
    this.isPriceFilterEnabled.set(false);
  }

  clearFilters(): void {
    this.selectedMaterial.set('Todos');
    this.selectedColor.set('Todos');
    this.clearPriceFilter();
  }

  addToCart(product: CatalogProduct): void {
    if (!this.isAuthenticated()) {
      void this.router.navigate(['/login'], { queryParams: { redirectTo: '/catalogo' } });
      return;
    }

    this.cartService.addItem({
      name: product.name,
      material: this.getSelectedProductMaterial(product),
      color: this.getSelectedProductColor(product),
      priceFrom: product.price_from
    });

    this.showCartMessage(`${product.name} agregado al carrito.`);
  }

  removeCartItem(index: number): void {
    this.cartService.removeItem(index);
  }

  clearCart(): void {
    this.cartService.clear();
    this.hideCartMessage();
  }

  async quoteCart(): Promise<void> {
    if (!this.isAuthenticated()) {
      await this.router.navigate(['/login'], {
        queryParams: { redirectTo: '/client/requests?source=cart' }
      });
      return;
    }

    await this.router.navigate(['/client/requests'], { queryParams: { source: 'cart' } });
  }

  getSelectedProductMaterial(product: CatalogProduct): string {
    return product.materials.includes(this.selectedMaterial())
      ? this.selectedMaterial()
      : product.materials[0];
  }

  getSelectedProductColor(product: CatalogProduct): string {
    return product.colors.includes(this.selectedColor()) ? this.selectedColor() : product.colors[0];
  }

  private showCartMessage(message: string): void {
    this.clearCartMessageTimeout();
    this.cartMessage.set(message);
    this.isCartMessageVisible.set(true);

    this.cartMessageTimeoutId = setTimeout(() => {
      this.hideCartMessage();
    }, this.cartMessageDelay);
  }

  private hideCartMessage(): void {
    this.isCartMessageVisible.set(false);

    this.cartMessageTimeoutId = setTimeout(() => {
      this.cartMessage.set('');
      this.cartMessageTimeoutId = null;
    }, 220);
  }

  private clearCartMessageTimeout(): void {
    if (!this.cartMessageTimeoutId) {
      return;
    }

    clearTimeout(this.cartMessageTimeoutId);
    this.cartMessageTimeoutId = null;
  }
}
