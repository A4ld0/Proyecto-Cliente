import { expect } from '@playwright/test';
import { createBdd, test as base } from 'playwright-bdd';
import { accounts, mockSupabase } from './support/supabase';
import { AuthPage } from './pages/auth.page';
import { CatalogPage } from './pages/catalog.page';
import { ClientRequestsPage } from './pages/client-requests.page';
import { AdminRequestsPage } from './pages/admin-requests.page';
import { OrdersPage } from './pages/orders.page';

interface UI {
  auth: AuthPage;
  catalog: CatalogPage;
  requests: ClientRequestsPage;
  adminRequests: AdminRequestsPage;
  orders: OrdersPage;
}

export const test = base.extend<{ api: Awaited<ReturnType<typeof mockSupabase>>; ui: UI }>({
  api: [async ({ page }, use) => {
    await use(await mockSupabase(page));
  }, { auto: true }],
  ui: async ({ page }, use) => {
    await use({
      auth: new AuthPage(page), catalog: new CatalogPage(page),
      requests: new ClientRequestsPage(page), adminRequests: new AdminRequestsPage(page),
      orders: new OrdersPage(page)
    });
  }
});

const { Given, When, Then } = createBdd(test);

Given('que visito el catálogo público', async ({ ui }) => { await ui.catalog.open(); });
Given(/^(?:que )?inicio sesión como (cliente|administrador)$/, async (
  { ui }, role: keyof typeof accounts
) => { await ui.auth.signIn(role); });
Given('que existe la solicitud pendiente {string}', ({ api }, title: string) => { api.seedPendingRequest(title); });
Given('que existe una cotización enviada para {string}', ({ api }, title: string) => { api.seedSentQuote(title); });
Given('que abro mis solicitudes', async ({ ui }) => { await ui.requests.open(); });
Given('que completo el registro con una contraseña de siete caracteres', async ({ ui }) => {
  await ui.auth.fillShortRegistration();
});

When('agrego {string} al carrito', async ({ ui }, name: string) => { await ui.catalog.add(name); });
When('intento entrar con una contraseña incorrecta', async ({ ui }) => {
  await ui.auth.submit(accounts.cliente.email, 'incorrecta');
});
When('elijo el material {string} y el color {string} en el catálogo', async (
  { ui }, material: string, color: string
) => { await ui.catalog.choose(material, color); });
When('convierto el carrito en una solicitud', async ({ ui }) => { await ui.catalog.quote(); });
When('envío la solicitud', async ({ ui }) => { await ui.requests.submit(); });
When('intento abrir los pedidos de administración', async ({ page }) => { await page.goto('/admin/orders'); });
When('intento abrir la ruta {string}', async ({ page }, path: string) => { await page.goto(path); });
When('envío una cotización de {int} pesos para {string}', async (
  { ui }, price: number, title: string
) => { await ui.adminRequests.sendQuote(title, price); });
When('cierro sesión', async ({ ui }) => { await ui.auth.signOut(); });
When('entro con la cuenta del cliente', async ({ ui }) => { await ui.auth.signIn('cliente'); });
When('acepto la cotización de {string}', async ({ ui }, title: string) => {
  await ui.requests.open();
  await ui.requests.decide(title, 'aceptar');
});
When('rechazo la cotización de {string}', async ({ ui }, title: string) => { await ui.requests.decide(title, 'rechazar'); });
When('cancelo la confirmación de aceptación para {string}', async ({ ui }, title: string) => {
  await ui.requests.decide(title, 'aceptar', false);
});
When('limito el precio máximo a {int} pesos', async ({ ui }, price: number) => { await ui.catalog.setMaxPrice(price); });
When('restablezco los filtros', async ({ ui }) => { await ui.catalog.resetFilters(); });
When('recargo la página', async ({ page }) => { await page.reload(); });
When('vacío el carrito', async ({ ui }) => { await ui.catalog.clearCart(); });
When('escribo el título {string} y la descripción {string}', async (
  { ui }, title: string, description: string
) => { await ui.requests.fill(title, description); });
When('selecciono un archivo PDF', async ({ ui }) => { await ui.requests.uploadUnsupportedFile(); });

Then('veo el formulario de acceso con el catálogo como destino', async ({ ui }) => { await ui.auth.expectLogin('/catalogo'); });
Then('veo el formulario de acceso', async ({ ui }) => { await ui.auth.expectLogin(); });
Then('veo el error de credenciales y sigo en el formulario de acceso', async ({ ui }) => { await ui.auth.expectInvalidCredentials(); });
Then('no puedo crear la cuenta y veo el error del mínimo', async ({ ui }) => { await ui.auth.expectRegistrationBlocked(); });
Then('el borrador contiene {string} con material {string} y color {string}', async (
  { ui }, name: string, material: string, color: string
) => { await ui.requests.expectDraft(name, material, color); });
Then('la solicitud {string} aparece como {string} tras recargar', async (
  { page, ui }, title: string, status: string
) => { await page.reload(); await ui.requests.expectStatus(title, status); });
Then('vuelvo a mi panel de cliente', async ({ ui }) => { await ui.auth.expectDashboard('cliente'); });
Then('vuelvo a mi panel de administrador', async ({ ui }) => { await ui.auth.expectDashboard('administrador'); });
Then('la solicitud {string} aparece como cotizada por {int} pesos', async (
  { ui }, title: string, price: number
) => { await ui.adminRequests.expectQuote(title, price); });
Then('veo el pedido {string} con estado {string} y cotización {string}', async (
  { ui }, title: string, orderStatus: string, quoteStatus: string
) => { await ui.orders.expectOrder(title, orderStatus, quoteStatus); });
Then('no hay productos que coincidan', async ({ ui }) => { await ui.catalog.expectNoProducts(); });
Then('vuelve a mostrarse {string}', async ({ ui }, name: string) => { await expect(ui.catalog.product(name)).toBeVisible(); });
Then('el carrito tiene {int} unidades de {string} y {string} con total {int} pesos', async (
  { ui }, quantity: number, material: string, color: string, total: number
) => { await ui.catalog.expectCart(quantity, total, material, color); });
Then('el carrito está vacío', async ({ ui }) => { await ui.catalog.expectEmptyCart(); });
Then('no puedo enviar la solicitud', async ({ ui }) => { await expect(ui.requests.submitButton).toBeDisabled(); });
Then('veo el error de formato y el selector queda vacío', async ({ ui }) => { await ui.requests.expectUnsupportedFile(); });
Then('la cotización de {string} aparece como {string}', async (
  { ui }, title: string, status: string
) => { await ui.requests.expectQuoteStatus(title, status); });
Then('no tengo pedidos', async ({ ui }) => { await ui.orders.expectEmpty(); });
