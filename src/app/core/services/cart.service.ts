import { Injectable, computed, signal } from '@angular/core';

export interface CatalogCartItem {
  name: string;
  material: string;
  color: string;
  priceFrom: number;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly storageKey = 'printlab.catalog.cart';

  readonly items = signal<CatalogCartItem[]>(this.restoreItems());
  readonly itemCount = computed(() =>
    this.items().reduce((total, item) => total + item.quantity, 0)
  );
  readonly estimatedTotal = computed(() =>
    this.items().reduce((total, item) => total + item.priceFrom * item.quantity, 0)
  );

  addItem(item: Omit<CatalogCartItem, 'quantity'>): void {
    this.items.update((items) => {
      const existingIndex = items.findIndex(
        (cartItem) =>
          cartItem.name === item.name &&
          cartItem.material === item.material &&
          cartItem.color === item.color
      );

      if (existingIndex >= 0) {
        return items.map((cartItem, index) =>
          index === existingIndex
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }

      return [...items, { ...item, quantity: 1 }];
    });

    this.persistItems();
  }

  removeItem(index: number): void {
    this.items.update((items) => items.filter((_, itemIndex) => itemIndex !== index));
    this.persistItems();
  }

  clear(): void {
    this.items.set([]);
    this.persistItems();
  }

  buildRequestTitle(): string {
    const firstItem = this.items()[0];
    return firstItem ? `Cotizacion catalogo: ${firstItem.name}` : '';
  }

  buildRequestDescription(): string {
    if (!this.items().length) {
      return '';
    }

    const lines = this.items().map(
      (item) =>
        `- ${item.quantity} x ${item.name} | Material: ${item.material} | Color: ${item.color} | Desde: $${item.priceFrom} MXN`
    );

    return [
      'Hola, quiero cotizar estos productos del catalogo:',
      '',
      ...lines,
      '',
      `Total estimado desde: $${this.estimatedTotal()} MXN`,
      '',
      'Notas adicionales:'
    ].join('\n');
  }

  private restoreItems(): CatalogCartItem[] {
    if (typeof localStorage === 'undefined') {
      return [];
    }

    const rawItems = localStorage.getItem(this.storageKey);

    if (!rawItems) {
      return [];
    }

    try {
      return JSON.parse(rawItems) as CatalogCartItem[];
    } catch {
      localStorage.removeItem(this.storageKey);
      return [];
    }
  }

  private persistItems(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(this.items()));
  }
}
