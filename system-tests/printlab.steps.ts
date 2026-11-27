import { expect, type Page } from '@playwright/test';
import { createBdd, test as base } from 'playwright-bdd';
import { accounts, mockSupabase, testPassword } from './support/supabase';

export const test = base.extend<{ api: Awaited<ReturnType<typeof mockSupabase>> }>({
  api: [async ({ page }, use) => {
    await use(await mockSupabase(page));
  }, { auto: true }]
});

const { Given, When, Then } = createBdd(test);

function navigation(page: Page) {
  return page.locator('#primary-navigation');
}

function requestCard(page: Page, title: string) {
  return page.locator('article').filter({ has: page.getByRole('heading', { name: title, exact: true }) });
}

async function submitLogin(page: Page, email: string, password: string) {
  await page.getByLabel('Correo', { exact: true }).fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
}

async function signIn(page: Page, role: keyof typeof accounts) {
  await page.goto('/login');
  await submitLogin(page, accounts[role].email, testPassword);
  await expect(page).toHaveURL(role === 'administrador' ? /\/admin\/dashboard$/ : /\/client\/dashboard$/);
  await expect(page.getByText(accounts[role].full_name, { exact: true })).toBeVisible();
}

Given('que visito el catálogo público', async ({ page }) => {
  await page.goto('/catalogo');
  await expect(page.getByRole('heading', { name: 'Organizador de escritorio', exact: true })).toBeVisible();
});

Given(/^(?:que )?inicio sesión como (cliente|administrador)$/, async (
  { page }, role: keyof typeof accounts
) => {
  await signIn(page, role);
});

Given('que existe la solicitud pendiente {string}', ({ api }, title: string) => {
  api.seedPendingRequest(title);
});

When('agrego {string} al carrito', async ({ page }, name: string) => {
  const card = page.getByRole('article').filter({ has: page.getByRole('heading', { name, exact: true }) });
  await card.getByRole('button', { name: 'Agregar al carrito', exact: true }).click();
});

Then('veo el formulario de acceso con el catálogo como destino', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Bienvenido de nuevo', exact: true })).toBeVisible();
  const url = new URL(page.url());
  expect(url.pathname).toBe('/login');
  expect(url.searchParams.get('redirectTo')).toBe('/catalogo');
});

When('intento entrar con una contraseña incorrecta', async ({ page }) => {
  await submitLogin(page, accounts.cliente.email, 'incorrecta');
});

Then('veo el error de credenciales y sigo en el formulario de acceso', async ({ page }) => {
  await expect(page.getByText('Credenciales incorrectas.', { exact: true })).toBeVisible();
  expect(new URL(page.url()).pathname).toBe('/login');
});

When('elijo el material {string} y el color {string} en el catálogo', async (
  { page }, material: string, color: string
) => {
  await navigation(page).getByRole('link', { name: 'Catalogo', exact: true }).click();
  await page.getByRole('combobox', { name: 'Material' }).selectOption(material);
  await page.getByRole('combobox', { name: 'Color' }).selectOption(color);
});

When('convierto el carrito en una solicitud', async ({ page }) => {
  await page.getByRole('button', { name: 'Cotizar', exact: true }).click();
  await expect(page).toHaveURL(/\/client\/requests\?source=cart$/);
});

Then('el borrador contiene {string} con material {string} y color {string}', async (
  { page }, name: string, material: string, color: string
) => {
  await expect(page.getByLabel('Titulo', { exact: true })).toHaveValue(`Cotizacion catalogo: ${name}`);
  const description = await page.getByLabel('Descripcion', { exact: true }).inputValue();
  expect(description).toContain(`1 x ${name} | Material: ${material} | Color: ${color}`);
});

When('envío la solicitud', async ({ page }) => {
  await page.getByRole('button', { name: 'Crear solicitud', exact: true }).click();
  await expect(page.getByText('Tu solicitud se registro correctamente.', { exact: true })).toBeVisible();
});

Then('la solicitud {string} aparece como {string} tras recargar', async (
  { page }, title: string, status: string
) => {
  await page.reload();
  await expect(requestCard(page, title).getByText(status, { exact: true })).toBeVisible();
});

When('intento abrir los pedidos de administración', async ({ page }) => {
  await page.goto('/admin/orders');
});

Then('vuelvo a mi panel de cliente', async ({ page }) => {
  await expect(page).toHaveURL(/\/client\/dashboard$/);
  await expect(navigation(page).getByRole('link', { name: 'Perfil', exact: true })).toBeVisible();
});

When('envío una cotización de {int} pesos para {string}', async (
  { page }, price: number, title: string
) => {
  await navigation(page).getByRole('link', { name: 'Solicitudes', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/requests$/);
  const request = requestCard(page, title);
  await request.getByRole('button', { name: 'Cotizar', exact: true }).click();
  await expect(request.getByText('En revision', { exact: true })).toBeVisible();
  await page.getByLabel('Total', { exact: true }).fill(String(price));
  await page.getByLabel('Dias estimados', { exact: true }).fill('3');
  await page.getByRole('button', { name: 'Guardar cotizacion', exact: true }).click();
});

Then('la solicitud {string} aparece como cotizada por {int} pesos', async (
  { page }, title: string, price: number
) => {
  const request = requestCard(page, title);
  await expect(request.getByText('Cotizada', { exact: true })).toBeVisible();
  await expect(request.getByText('Enviada', { exact: true })).toBeVisible();
  await expect(request.getByText(new RegExp(String(price)))).toBeVisible();
});

When('cierro sesión', async ({ page }) => {
  await page.getByRole('button', { name: 'Salir', exact: true }).click();
  await expect(page).toHaveURL(/\/landing$/);
  await expect(navigation(page).getByRole('link', { name: 'Ingresar', exact: true })).toBeVisible();
});

When('entro con la cuenta del cliente', async ({ page }) => {
  await signIn(page, 'cliente');
});

When('acepto la cotización de {string}', async ({ page }, title: string) => {
  await navigation(page).getByRole('link', { name: 'Solicitudes', exact: true }).click();
  const accept = requestCard(page, title).getByRole('button', { name: 'Aceptar', exact: true });
  await Promise.all([
    page.waitForEvent('dialog').then((dialog) => dialog.accept()),
    accept.click()
  ]);
  await expect(page.getByText('Cotizacion aceptada. Tu pedido se creo correctamente.', { exact: true }))
    .toBeVisible();
});

Then('veo el pedido {string} con estado {string} y cotización {string}', async (
  { page }, title: string, orderStatus: string, quoteStatus: string
) => {
  await navigation(page).getByRole('link', { name: 'Pedidos', exact: true }).click();
  await expect(page).toHaveURL(/\/client\/orders$/);
  const row = page.getByRole('row').filter({ has: page.getByRole('cell', { name: title, exact: true }) });
  await expect(row.getByRole('cell', { name: orderStatus, exact: true })).toBeVisible();
  await expect(row.getByRole('cell', { name: quoteStatus, exact: true })).toBeVisible();
});
