import { CartService } from './cart.service';

describe('CartService', () => {
  const storageKey = 'printlab.catalog.cart';
  const item = { name: 'Organizador', material: 'PLA', color: 'Negro', priceFrom: 120 };

  beforeEach(() => localStorage.removeItem(storageKey));
  afterEach(() => localStorage.removeItem(storageKey));

  it('combina productos de la misma variante y calcula cantidades y total', () => {
    const cart = new CartService();
    const otherVariant = { ...item, color: 'Blanco' };

    cart.addItem(item);
    cart.addItem(item);
    cart.addItem(otherVariant);

    expect(cart.items()).toEqual([
      { ...item, quantity: 2 },
      { ...otherVariant, quantity: 1 }
    ]);
    expect(cart.itemCount()).toBe(3);
    expect(cart.estimatedTotal()).toBe(360);
  });

  it('conserva el carrito entre instancias y persiste las eliminaciones', () => {
    const cart = new CartService();
    cart.addItem(item);
    const restoredCart = new CartService();

    expect(restoredCart.items()).toEqual([{ ...item, quantity: 1 }]);
    restoredCart.removeItem(0);

    expect(restoredCart.itemCount()).toBe(0);
    expect(new CartService().items()).toEqual([]);
  });

  it('genera los datos de la solicitud y los vacía al limpiar el carrito', () => {
    const cart = new CartService();
    cart.addItem(item);

    expect(cart.buildRequestTitle()).toBe('Cotizacion catalogo: Organizador');
    expect(cart.buildRequestDescription()).toContain('1 x Organizador | Material: PLA | Color: Negro');
    expect(cart.buildRequestDescription()).toContain('Total estimado desde: $120 MXN');

    cart.clear();

    expect(new CartService().items()).toEqual([]);
    expect(cart.buildRequestTitle()).toBe('');
    expect(cart.buildRequestDescription()).toBe('');
  });

  it('recupera un carrito vacío si el dato guardado no es JSON válido', () => {
    localStorage.setItem(storageKey, '{');

    expect(new CartService().items()).toEqual([]);
    expect(localStorage.getItem(storageKey)).toBeNull();
  });
});
