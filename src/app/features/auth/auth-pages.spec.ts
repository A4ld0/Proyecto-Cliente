import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { admin, client, mount } from '../../../testing/fixtures';
import { AuthService } from '../../core/services';
import { User } from '../../interfaces';
import { AuthCallbackPageComponent } from './pages/auth-callback-page/auth-callback-page.component';
import { LoginPageComponent } from './pages/login-page/login-page.component';
import { RegisterPageComponent } from './pages/register-page/register-page.component';

const credentials = { email: 'client@example.test', password: 'Demo1234' };

describe('Formulario de registro', () => {
  afterEach(() => vi.restoreAllMocks());

  async function open() {
    const currentUser = signal<User | null>(null);
    const register = vi.fn().mockResolvedValue(client);
    const signInWithGoogle = vi.fn();
    const fixture = await mount(RegisterPageComponent, [
      { provide: AuthService, useValue: { isConfigured: signal(true), currentUser, register, signInWithGoogle } }
    ]);
    const navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    return { page: fixture.componentInstance, currentUser, register, signInWithGoogle, navigateByUrl };
  }

  it('valida campos y registra un cliente, con destino según si la sesión está activa', async () => {
    const { page, currentUser, register, navigateByUrl } = await open();
    await page.submit();
    expect(page.hasFieldError('password')).toBe(true);
    expect(page.getFieldError('password')).toContain('contraseña');
    expect(page.getFieldError('unknown')).toBe('');
    expect(register).not.toHaveBeenCalled();

    page.form.patchValue({ full_name: client.full_name, ...credentials });
    await page.submit();
    expect(register).toHaveBeenCalledWith({ full_name: client.full_name, ...credentials, phone: '', role: 'CLIENT' });
    expect(navigateByUrl).toHaveBeenLastCalledWith('/login');
    currentUser.set(client);
    await page.submit();
    expect(navigateByUrl).toHaveBeenLastCalledWith('/client/dashboard');
  });

  it('presenta el fallo de registro y permite iniciar la alternativa de Google', async () => {
    const { page, register, signInWithGoogle } = await open();
    page.form.patchValue({ full_name: client.full_name, ...credentials });
    register.mockRejectedValueOnce(new Error('Correo ya registrado'));
    await page.submit();
    expect(page.errorMessage()).toBe('Correo ya registrado');
    expect(page.isSubmitting()).toBe(false);
    page.signInWithGoogle();
    expect(page.errorMessage()).toBe('');
    expect(signInWithGoogle).toHaveBeenCalledOnce();
  });
});

describe('Formulario de acceso', () => {
  const oauthErrorKey = 'printlab.oauthError';
  afterEach(() => sessionStorage.removeItem(oauthErrorKey));

  it('recupera el aviso de OAuth, valida los campos y elige el panel según el rol', async () => {
    sessionStorage.setItem(oauthErrorKey, 'Acceso de Google cancelado.');
    const signIn = vi.fn().mockResolvedValueOnce(admin).mockResolvedValueOnce(client);
    const signInWithGoogle = vi.fn();
    const navigateByUrl = vi.fn().mockResolvedValue(true);
    const fixture = await mount(LoginPageComponent, [
      { provide: AuthService, useValue: { isConfigured: signal(true), signIn, signInWithGoogle } },
      { provide: Router, useValue: { navigateByUrl } },
      { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({ redirectTo: 'https://example.test' }) } } }
    ]);
    const page = fixture.componentInstance;
    expect(page.errorMessage()).toBe('Acceso de Google cancelado.');
    expect(sessionStorage.getItem(oauthErrorKey)).toBeNull();
    await page.submit();
    expect(page.hasFieldError('email')).toBe(true);
    expect(page.getFieldError('email')).toContain('correo');
    expect(page.getFieldError('unknown')).toBe('');
    expect(signIn).not.toHaveBeenCalled();
    page.form.patchValue(credentials);
    await page.submit();
    expect(signIn).toHaveBeenCalledWith(credentials.email, credentials.password);
    expect(navigateByUrl).toHaveBeenLastCalledWith('/admin/dashboard');
    await page.submit();
    expect(navigateByUrl).toHaveBeenLastCalledWith('/client/dashboard');
    page.signInWithGoogle();
    expect(signInWithGoogle).toHaveBeenCalledOnce();
    expect(page.errorMessage()).toBe('');
  });
});

describe('Retorno de autenticación con Google', () => {
  const initialUrl = window.location.href;
  afterEach(() => window.history.replaceState(null, '', initialUrl));

  it.each([
    [admin, '/auth/callback#access_token=test', '#access_token=test', '/admin/dashboard'],
    [client, '/auth/callback?access_token=test', '?access_token=test', '/client/dashboard']
  ] as const)('procesa el retorno de Google y abre el panel asignado', async (profile, url, payload, dashboard) => {
    window.history.replaceState(null, '', url);
    const completeOAuthSignIn = vi.fn().mockResolvedValue(profile);
    const navigateByUrl = vi.fn().mockResolvedValue(true);
    await mount(AuthCallbackPageComponent, [
      { provide: AuthService, useValue: { completeOAuthSignIn } },
      { provide: Router, useValue: { navigateByUrl } }
    ]);
    expect(completeOAuthSignIn).toHaveBeenCalledWith(payload);
    expect(navigateByUrl).toHaveBeenCalledWith(dashboard);
  });

  it('muestra el error si Google no devuelve una sesión válida', async () => {
    const completeOAuthSignIn = vi.fn().mockRejectedValue(new Error('Respuesta inválida'));
    const navigateByUrl = vi.fn();
    const { componentInstance: page } = await mount(AuthCallbackPageComponent, [
      { provide: AuthService, useValue: { completeOAuthSignIn } },
      { provide: Router, useValue: { navigateByUrl } }
    ]);
    expect(page.errorMessage()).toBe('Respuesta inválida');
    expect(navigateByUrl).not.toHaveBeenCalled();
  });
});
