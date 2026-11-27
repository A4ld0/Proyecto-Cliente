import { expect, type Page } from '@playwright/test';
import { accounts, testPassword } from '../support/supabase';

export class AuthPage {
  constructor(readonly page: Page) {}

  async submit(email: string, password: string) {
    await this.page.getByLabel('Correo', { exact: true }).fill(email);
    await this.page.getByLabel('Contraseña', { exact: true }).fill(password);
    await this.page.getByRole('button', { name: 'Entrar', exact: true }).click();
  }

  async signIn(role: keyof typeof accounts) {
    await this.page.goto('/login');
    await this.submit(accounts[role].email, testPassword);
    await this.expectDashboard(role);
    await expect(this.page.getByText(accounts[role].full_name, { exact: true })).toBeVisible();
  }

  async expectDashboard(role: keyof typeof accounts) {
    await expect(this.page).toHaveURL(role === 'administrador' ? /\/admin\/dashboard$/ : /\/client\/dashboard$/);
  }

  async signOut() {
    await this.page.getByRole('button', { name: 'Salir', exact: true }).click();
    await expect(this.page).toHaveURL(/\/landing$/);
    await expect(this.page.locator('#primary-navigation').getByRole('link', { name: 'Ingresar', exact: true })).toBeVisible();
  }

  async expectLogin(redirectTo?: string) {
    await expect(this.page).toHaveURL(/\/login(?:\?.*)?$/);
    await expect(this.page.getByRole('heading', { name: 'Bienvenido de nuevo', exact: true })).toBeVisible();
    if (redirectTo) expect(new URL(this.page.url()).searchParams.get('redirectTo')).toBe(redirectTo);
  }

  async expectInvalidCredentials() {
    await expect(this.page.getByText('Credenciales incorrectas.', { exact: true })).toBeVisible();
    await this.expectLogin();
  }

  async fillShortRegistration() {
    await this.page.goto('/register');
    await this.page.getByLabel('Nombre', { exact: true }).fill('Cliente BDD');
    await this.page.getByLabel('Correo', { exact: true }).fill('bdd@example.test');
    await this.page.getByLabel('Contraseña', { exact: true }).fill('Abc1234');
    await this.page.getByLabel('Telefono', { exact: true }).click();
  }

  async expectRegistrationBlocked() {
    await expect(this.page.getByRole('button', { name: 'Crear cuenta', exact: true })).toBeDisabled();
    await expect(this.page.getByText('La contraseña debe tener al menos 8 caracteres.', { exact: true })).toBeVisible();
  }
}
