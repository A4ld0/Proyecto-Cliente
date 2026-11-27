import { expect, type Page } from '@playwright/test';

export class OrdersPage {
  constructor(readonly page: Page) {}

  async open() { await this.page.goto('/client/orders'); }

  async expectOrder(title: string, orderStatus: string, quoteStatus: string) {
    await this.open();
    const row = this.page.getByRole('row').filter({ has: this.page.getByRole('cell', { name: title, exact: true }) });
    await expect(row.getByRole('cell', { name: orderStatus, exact: true })).toBeVisible();
    await expect(row.getByRole('cell', { name: quoteStatus, exact: true })).toBeVisible();
    await expect(row).toHaveCount(1);
  }

  async expectEmpty() {
    await this.open();
    await expect(this.page.getByText('Aun no tienes pedidos registrados.', { exact: true })).toBeVisible();
  }
}
