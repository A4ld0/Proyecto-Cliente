import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { admin, client, failure, mount, product } from '../../../testing/fixtures';
import { AuthService, CartService, CatalogService } from '../../core/services';
import { User } from '../../interfaces';
import { LandingPageComponent } from '../landing/pages/landing-page/landing-page.component';
import { CatalogPageComponent } from './pages/catalog-page/catalog-page.component';

describe('Catálogo público', () => {
  const cartKey = 'printlab.catalog.cart';
  const expensive = {
    ...product, id: 'premium', name: 'Pieza especial', materials: ['Resina'], colors: ['Rojo'], price_from: 280
  };
  const alternative = {
    ...product, id: 'variant', name: 'Soporte', materials: ['PLA'], colors: ['Blanco'], price_from: 140
  };
  beforeEach(() => localStorage.removeItem(cartKey));
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    localStorage.removeItem(cartKey);
  });

  async function open(authenticated = true) {
    const isAuthenticated = signal(authenticated);
    const catalog = { list: vi.fn(() => of([product, expensive, alternative])) };
    const fixture = await mount(CatalogPageComponent, [
      { provide: AuthService, useValue: { isAuthenticated } },
      { provide: CatalogService, useValue: catalog }
    ]);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    return { fixture, page: fixture.componentInstance, catalog, isAuthenticated, navigate };
  }

  it('consulta productos activos y combina material, color y precio de forma independiente', async () => {
    const { page, catalog } = await open();
    expect(catalog.list).toHaveBeenCalledWith({ activeOnly: true });
    expect(page.materialOptions()).toEqual(['Todos', 'PETG', 'PLA', 'Resina']);
    expect(page.colorOptions()).toEqual(['Todos', 'Blanco', 'Negro', 'Rojo']);
    expect(page.activeFilterCount()).toBe(0);
    expect(page.filteredProducts()).toHaveLength(3);
    page.updateMaterial('PLA');
    expect(page.filteredProducts()).toEqual([product, alternative]);
    page.updateColor('Negro');
    expect(page.filteredProducts()).toEqual([product]);
    page.updateMaxPrice('100');
    expect(page.activeFilterCount()).toBe(3);
    expect(page.filteredProducts()).toEqual([]);
    page.clearPriceFilter();
    expect(page.activeFilterCount()).toBe(2);
    expect(page.filteredProducts()).toEqual([product]);
    page.clearFilters();
    expect(page.filteredProducts()).toHaveLength(3);
    expect(page.activeFilterCount()).toBe(0);
  });

  it('muestra el catálogo de referencia sin datos o cuando falla la consulta', async () => {
    const { page, catalog } = await open();
    catalog.list.mockReturnValueOnce(of([]));
    await page.loadProducts();
    expect(page.products()).toEqual(page.fallbackProducts);
    catalog.list.mockReturnValueOnce(failure('Sin conexión'));
    await page.loadProducts();
    expect(page.products()).toEqual(page.fallbackProducts);
    expect(page.isLoadingProducts()).toBe(false);
  });

  it('exige sesión para agregar artículos o enviar el carrito y conserva el destino', async () => {
    const { page, navigate, isAuthenticated } = await open(false);
    page.addToCart(product);
    expect(page.cartItems()).toEqual([]);
    expect(navigate).toHaveBeenLastCalledWith(['/login'], { queryParams: { redirectTo: '/catalogo' } });
    await page.quoteCart();
    expect(navigate).toHaveBeenLastCalledWith(['/login'], {
      queryParams: { redirectTo: '/client/requests?source=cart' }
    });
    isAuthenticated.set(true);
    await page.quoteCart();
    expect(navigate).toHaveBeenLastCalledWith(['/client/requests'], { queryParams: { source: 'cart' } });
  });

  it('elige variantes y reinicia el aviso al agregar, eliminar y vaciar el carrito', async () => {
    const { page, fixture } = await open();
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    page.addToCart(product);
    page.updateMaterial('PETG');
    page.updateColor('Blanco');
    page.addToCart(product);
    expect(page.cartItems()).toMatchObject([
      { material: 'PLA', color: 'Negro' },
      { material: 'PETG', color: 'Blanco' }
    ]);
    expect(page.cartItemCount()).toBe(2);
    expect(page.cartEstimatedTotal()).toBe(2 * product.price_from);
    expect(page.isCartMessageVisible()).toBe(true);
    vi.advanceTimersByTime(2600);
    expect(page.isCartMessageVisible()).toBe(false);
    vi.advanceTimersByTime(220);
    expect(page.cartMessage()).toBe('');
    page.removeCartItem(0);
    expect(TestBed.inject(CartService).items()).toMatchObject([{ material: 'PETG', color: 'Blanco' }]);
    page.clearCart();
    expect(page.cartItems()).toEqual([]);
    const clearTimer = vi.spyOn(globalThis, 'clearTimeout');
    fixture.destroy();
    expect(clearTimer).toHaveBeenCalled();
  });
});

describe('Carrusel y acceso en la página de inicio', () => {
  afterEach(() => vi.useRealTimers());

  it('recorre el carrusel, reinicia el avance al seleccionar y libera los temporizadores al salir', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] });
    const currentUser = signal<User | null>(null);
    TestBed.configureTestingModule({ providers: [
      provideRouter([]),
      { provide: AuthService, useValue: { currentUser, isConfigured: signal(true) } }
    ] });
    const fixture = TestBed.createComponent(LandingPageComponent);
    const page = fixture.componentInstance;
    expect(page.dashboardLink()).toBe('/client/dashboard');
    currentUser.set(admin);
    expect(page.dashboardLink()).toBe('/admin/dashboard');
    currentUser.set(client);
    expect(page.dashboardLink()).toBe('/client/dashboard');
    expect(page.activePortfolioItem()).toBe(page.portfolioItems[0]);

    page.previousPortfolioItem();
    expect(page.isPortfolioChanging()).toBe(true);
    vi.advanceTimersByTime(180);
    expect(page.activePortfolioIndex()).toBe(page.portfolioItems.length - 1);
    page.previousPortfolioItem();
    page.selectPortfolioItem(0);
    vi.advanceTimersByTime(180);
    expect(page.activePortfolioItem()).toBe(page.portfolioItems[0]);
    page.nextPortfolioItem();
    vi.advanceTimersByTime(180);
    expect(page.activePortfolioIndex()).toBe(1);
    page.selectPortfolioItem(1);
    vi.advanceTimersByTime(4499);
    expect(page.isPortfolioChanging()).toBe(false);
    vi.advanceTimersByTime(181);
    expect(page.activePortfolioIndex()).toBe(2);
    page.nextPortfolioItem();
    fixture.destroy();
    vi.advanceTimersByTime(10_000);
    expect(page.activePortfolioIndex()).toBe(2);
  });
});
