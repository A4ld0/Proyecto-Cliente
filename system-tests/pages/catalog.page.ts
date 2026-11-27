import { expect, type Page } from '@playwright/test';

export class CatalogPage {
  constructor(readonly page: Page) {}

  get cart() { return this.page.locator('[aria-label="Carrito de cotizacion"]'); }

  product(name: string) {
    return this.page.getByRole('article')
      .filter({ has: this.page.getByRole('heading', { name, exact: true }) })
      .filter({ has: this.page.getByRole('button', { name: 'Agregar al carrito', exact: true }) });
  }

  async open() {
    await this.page.goto('/catalogo');
    await expect(this.product('Organizador de escritorio')).toBeVisible();
  }

  async choose(material: string, color: string) {
    await this.open();
    await this.page.getByRole('combobox', { name: 'Material', exact: true }).selectOption(material);
    await this.page.getByRole('combobox', { name: 'Color', exact: true }).selectOption(color);
  }

  async add(name: string) {
    await this.product(name).getByRole('button', { name: 'Agregar al carrito', exact: true }).click();
  }

  async quote() {
    await this.cart.getByRole('button', { name: 'Cotizar', exact: true }).click();
    await expect(this.page).toHaveURL(/\/client\/requests\?source=cart$/);
  }

  async setMaxPrice(price: number) {
    const slider = this.page.getByRole('slider', { name: /Precio maximo/ });
    await slider.press('Home');
    for (let value = 50; value < price; value += 10) await slider.press('ArrowRight');
  }

  async expectNoProducts() {
    await expect(this.page.getByRole('heading', { name: 'No hay productos con esos filtros', exact: true })).toBeVisible();
    await expect(this.product('Organizador de escritorio')).toHaveCount(0);
  }

  async resetFilters() {
    await this.page.getByRole('button', { name: 'Restablecer filtros', exact: true }).click();
    await expect(this.product('Organizador de escritorio')).toBeVisible();
  }

  async expectCart(quantity: number, total: number, material: string, color: string) {
    await expect(this.cart.locator('.cart-badge')).toHaveText(String(quantity));
    await expect(this.cart.getByText(`${quantity} x ${material} / ${color}`, { exact: true })).toBeVisible();
    await expect(this.cart.getByText(`Desde $${total} MXN`, { exact: true })).toBeVisible();
  }

  async clearCart() {
    await this.cart.getByRole('button', { name: 'Vaciar', exact: true }).click();
  }

  async expectEmptyCart() {
    await expect(this.cart.locator('.cart-badge')).toHaveText('0');
    await expect(this.cart.getByText('Tu carrito esta vacio. Agrega productos para solicitar una cotizacion.', { exact: true })).toBeVisible();
  }
}
