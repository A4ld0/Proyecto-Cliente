import { reflectComponentType, signal, Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { admin, client, mount } from '../testing/fixtures';
import { App } from './app';
import { appConfig } from './app.config';
import { routes } from './app.routes';
import { adminGuard, clientGuard } from './core/guards';
import { AuthService } from './core/services';
import { User } from './interfaces';
import { PublicNavbarComponent } from './shared/components/navigation/public-navbar/public-navbar.component';

describe('Rutas de la aplicación', () => {
  it.each([
    ['landing', 'app-landing-page'],
    ['catalogo', 'app-catalog-page'],
    ['login', 'app-login-page'],
    ['register', 'app-register-page'],
    ['auth/callback', 'app-auth-callback-page'],
    ['client/dashboard', 'app-client-dashboard-page'],
    ['client/requests', 'app-client-requests-page'],
    ['client/orders', 'app-client-orders-page'],
    ['client/profile', 'app-client-profile-page'],
    ['admin/dashboard', 'app-admin-dashboard-page'],
    ['admin/requests', 'app-admin-requests-page'],
    ['admin/orders', 'app-admin-orders-page'],
    ['admin/catalog', 'app-admin-catalog-page'],
    ['admin/users', 'app-admin-users-page']
  ])('carga la vista y aplica el control de acceso de %s', async (path, selector) => {
    const route = routes[0].children?.find((candidate) => candidate.path === path);
    expect(route).toBeDefined();
    const guard = path.startsWith('admin/') ? adminGuard : path.startsWith('client/') ? clientGuard : null;
    expect(route?.canActivate ?? []).toEqual(guard ? [guard] : []);
    const component = await route?.loadComponent?.();
    expect(reflectComponentType(component as Type<unknown>)?.selector).toBe(selector);
  });
});

describe('Navegación de arranque', () => {
  const originalUrl = window.location.href;
  const errorKey = 'printlab.oauthError';
  afterEach(() => {
    vi.restoreAllMocks();
    window.history.replaceState(null, '', originalUrl);
    sessionStorage.removeItem(errorKey);
  });

  async function open(url: string, completeOAuthSignIn = vi.fn().mockResolvedValue(client)) {
    window.history.replaceState(null, '', url);
    TestBed.configureTestingModule({ providers: [
      ...appConfig.providers,
      { provide: AuthService, useValue: { completeOAuthSignIn } }
    ] });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    return { navigate, completeOAuthSignIn };
  }

  it('normaliza un enlace antiguo y deja el callback específico a cargo de su propia ruta', async () => {
    const { completeOAuthSignIn, navigate } = await open('/#/auth/callback?code=sample');
    expect(window.location.pathname).toBe('/auth/callback');
    expect(window.location.hash).toBe('');
    expect(completeOAuthSignIn).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it.each([
    [client, '/?access_token=oauth', '?access_token=oauth', '/client/dashboard'],
    [admin, '/#access_token=oauth', '#access_token=oauth', '/admin/dashboard']
  ] as const)('completa un retorno de OAuth recibido en la raíz', async (user, url, payload, destination) => {
    const { navigate, completeOAuthSignIn } = await open(url, vi.fn().mockResolvedValue(user));
    expect(completeOAuthSignIn).toHaveBeenCalledWith(payload);
    expect(window.location.pathname).toBe('/auth/callback');
    expect(navigate).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith(destination);
  });

  it.each([
    [new Error('Acceso cancelado'), 'Acceso cancelado'],
    [null, 'No pudimos completar el acceso con Google.']
  ] as const)('vuelve al inicio de sesión y conserva el aviso si falla OAuth', async (error, message) => {
    const { navigate } = await open('/#error=access_denied', vi.fn().mockRejectedValue(error));
    expect(window.location.pathname).toBe('/login');
    expect(navigate).toHaveBeenCalledWith('/login');
    expect(sessionStorage.getItem(errorKey)).toBe(message);
  });
});

describe('Menú público', () => {
  it('muestra las iniciales y el destino del rol, y cierra el menú al salir', async () => {
    const currentUser = signal<User | null>(null);
    const signOut = vi.fn().mockResolvedValue(undefined);
    const { componentInstance: menu } = await mount(PublicNavbarComponent, [
      { provide: AuthService, useValue: { currentUser, isAuthenticated: signal(false), signOut } }
    ]);
    expect(menu.dashboardLink()).toBe('/client/dashboard');
    currentUser.set(admin);
    expect(menu.dashboardLink()).toBe('/admin/dashboard');
    currentUser.set(client);
    expect(menu.dashboardLink()).toBe('/client/dashboard');
    expect(menu.getInitials('  Ana   Pérez López  ')).toBe('AP');
    expect(menu.getInitials('')).toBe('');
    menu.toggleMenu();
    expect(menu.isMenuOpen()).toBe(true);
    menu.toggleMenu();
    expect(menu.isMenuOpen()).toBe(false);
    menu.toggleMenu();
    await menu.signOut();
    expect(menu.isMenuOpen()).toBe(false);
    expect(signOut).toHaveBeenCalledOnce();
  });
});
