import { expect, type Page } from '@playwright/test';

export class ClientRequestsPage {
  constructor(readonly page: Page) {}

  get submitButton() { return this.page.getByRole('button', { name: 'Crear solicitud', exact: true }); }
  card(title: string) {
    return this.page.getByRole('listitem').filter({ has: this.page.getByRole('heading', { name: title, exact: true }) });
  }

  async open() {
    await this.page.goto('/client/requests');
    await expect(this.page.getByRole('heading', { name: 'Nueva solicitud', exact: true })).toBeVisible();
  }

  async fill(title: string, description: string) {
    await this.page.getByLabel('Titulo', { exact: true }).fill(title);
    await this.page.getByLabel('Descripcion', { exact: true }).fill(description);
  }

  async expectDraft(name: string, material: string, color: string) {
    await expect(this.page.getByLabel('Titulo', { exact: true })).toHaveValue(`Cotizacion catalogo: ${name}`);
    const description = await this.page.getByLabel('Descripcion', { exact: true }).inputValue();
    expect(description).toContain(`1 x ${name} | Material: ${material} | Color: ${color}`);
  }

  async submit() {
    await this.submitButton.click();
    await expect(this.page.getByText('Tu solicitud se registro correctamente.', { exact: true })).toBeVisible();
  }

  async expectStatus(title: string, status: string) {
    await expect(this.card(title).getByText(status, { exact: true })).toBeVisible();
  }

  async uploadUnsupportedFile() {
    await this.page.getByLabel('Archivo de referencia o STL', { exact: true }).setInputFiles({
      name: 'documento.pdf', mimeType: 'application/pdf', buffer: Buffer.from('Archivo sintético BDD')
    });
  }

  async expectUnsupportedFile() {
    await expect(this.page.getByText('Sube una imagen PNG, JPG, WEBP o un archivo STL.', { exact: true })).toBeVisible();
    await expect(this.page.getByLabel('Archivo de referencia o STL', { exact: true })).toHaveValue('');
  }

  async decide(title: string, decision: 'aceptar' | 'rechazar', confirm = true) {
    const button = this.card(title).getByRole('button', { name: decision === 'aceptar' ? 'Aceptar' : 'Rechazar', exact: true });
    await Promise.all([
      this.page.waitForEvent('dialog').then((dialog) => confirm ? dialog.accept() : dialog.dismiss()),
      button.click()
    ]);
    if (confirm) {
      const message = decision === 'aceptar'
        ? 'Cotizacion aceptada. Tu pedido se creo correctamente.'
        : 'Cotizacion rechazada correctamente.';
      await expect(this.page.getByText(message, { exact: true })).toBeVisible();
    }
  }

  async expectQuoteStatus(title: string, status: string) {
    await expect(this.card(title).getByText(status, { exact: true })).toBeVisible();
  }
}
