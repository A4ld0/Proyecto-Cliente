import { expect, type Page } from '@playwright/test';

export class AdminRequestsPage {
  constructor(readonly page: Page) {}

  card(title: string) {
    return this.page.getByRole('article').filter({ has: this.page.getByRole('heading', { name: title, exact: true }) });
  }

  async sendQuote(title: string, price: number) {
    await this.page.goto('/admin/requests');
    const request = this.card(title);
    await request.getByRole('button', { name: 'Cotizar', exact: true }).click();
    await expect(request.getByText('En revision', { exact: true })).toBeVisible();
    await this.page.getByLabel('Total', { exact: true }).fill(String(price));
    await this.page.getByLabel('Dias estimados', { exact: true }).fill('3');
    await this.page.getByRole('button', { name: 'Guardar cotizacion', exact: true }).click();
  }

  async expectQuote(title: string, price: number) {
    const request = this.card(title);
    await expect(request.getByText('Cotizada', { exact: true })).toBeVisible();
    await expect(request.getByText('Enviada', { exact: true })).toBeVisible();
    await expect(request.getByText(new RegExp(String(price)))).toBeVisible();
  }
}
