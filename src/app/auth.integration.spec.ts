import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { authSessionInterceptor } from './core/interceptors';
import { AuthService, SupabaseService, UsersService } from './core/services';
import { User } from './interfaces';

describe('Integración de inicio de sesión y rutas protegidas', () => {
  const sessionKey = 'printlab.session';
  const tokenUrl = `${environment.supabase.url}/auth/v1/token?grant_type=password`;
  const refreshUrl = `${environment.supabase.url}/auth/v1/token?grant_type=refresh_token`;
  const logoutUrl = `${environment.supabase.url}/auth/v1/logout`;
  const profileUrl = `${environment.supabase.url}/rest/v1/profiles`;
  const profilePath = '/client/profile';
  const user: User = {
    id: 'client-1',
    full_name: 'Cliente de prueba',
    email: 'cliente@example.test',
    role: 'CLIENT',
    is_active: true
  };
  const credentials = { email: 'cliente@example.test', password: 'test-password' };
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.removeItem(sessionKey);
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideHttpClient(withInterceptors([authSessionInterceptor])),
        provideHttpClientTesting()
      ]
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.removeItem(sessionKey);
  });

  function submitLogin(harness: RouterTestingHarness): void {
    const form = harness.routeNativeElement!.querySelector('form')!;
    const inputs = form.querySelectorAll<HTMLInputElement>('#email, #password');

    for (const input of inputs) {
      input.value = input.type === 'email' ? credentials.email : credentials.password;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }

    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  }

  it('redirige al inicio de sesión cuando un visitante abre el perfil', async () => {
    const harness = await RouterTestingHarness.create(profilePath);

    expect(TestBed.inject(Router).url).toBe('/login');
    expect(harness.routeNativeElement?.querySelector('#email')).toBeTruthy();
  });

  it('autentica con Supabase, carga el perfil y abre la ruta protegida', async () => {
    const harness = await RouterTestingHarness.create(`/login?redirectTo=${profilePath}`);
    submitLogin(harness);

    const login = http.expectOne({ method: 'POST', url: tokenUrl });
    expect(login.request.body).toEqual(credentials);
    login.flush({ access_token: 'test-access-token', user: { id: user.id } });
    await Promise.resolve();

    const profile = http.expectOne(
      (request) => request.method === 'GET' && request.url === profileUrl
    );
    expect(profile.request.params.get('id')).toBe(`eq.${user.id}`);
    expect(profile.request.headers.get('Authorization')).toBe('Bearer test-access-token');
    profile.flush([user]);

    await harness.fixture.whenStable();
    harness.detectChanges();

    expect(TestBed.inject(Router).url).toBe(profilePath);
    expect(TestBed.inject(AuthService).currentUser()).toEqual(user);
    expect(JSON.parse(localStorage.getItem(sessionKey) ?? '{}')).toMatchObject({
      accessToken: 'test-access-token',
      user
    });
    expect(harness.routeNativeElement?.querySelector<HTMLInputElement>('#full_name')?.value)
      .toBe(user.full_name);
  });

  it('muestra el error y mantiene cerrada la sesión si Supabase rechaza el acceso', async () => {
    const harness = await RouterTestingHarness.create('/login');
    submitLogin(harness);

    http.expectOne({ method: 'POST', url: tokenUrl }).flush(
      { error_description: 'Credenciales inválidas.' },
      { status: 401, statusText: 'Unauthorized' }
    );
    await harness.fixture.whenStable();
    harness.detectChanges();

    expect(TestBed.inject(Router).url).toBe('/login');
    expect(harness.routeNativeElement?.querySelector('.alert')?.textContent)
      .toContain('Credenciales inválidas.');
    expect(TestBed.inject(AuthService).isAuthenticated()).toBe(false);
    expect(localStorage.getItem(sessionKey)).toBeNull();
  });

  it('bloquea el perfil de una cuenta desactivada aunque el cierre remoto falle', async () => {
    localStorage.setItem(sessionKey, JSON.stringify({
      accessToken: 'inactive-token',
      user: { ...user, is_active: false }
    }));
    const harness = await RouterTestingHarness.create();
    const navigation = harness.navigateByUrl(profilePath);

    const logout = await vi.waitFor(() => http.expectOne({ method: 'POST', url: logoutUrl }));
    expect(logout.request.headers.get('Authorization')).toBe('Bearer inactive-token');
    logout.flush({ message: 'Sesión inválida.' }, { status: 401, statusText: 'Unauthorized' });
    await navigation;
    await harness.fixture.whenStable();
    harness.detectChanges();

    expect(TestBed.inject(Router).url).toBe('/login');
    expect(harness.routeNativeElement?.querySelector('#full_name')).toBeNull();
    expect(TestBed.inject(AuthService).isAuthenticated()).toBe(false);
    expect(TestBed.inject(SupabaseService).getAccessToken()).toBeNull();
    expect(localStorage.getItem(sessionKey)).toBeNull();
  });

  function startProfileRequest() {
    const auth = TestBed.inject(AuthService);
    const session = {
      accessToken: 'expired-token',
      refreshToken: 'test-refresh-token',
      user
    };
    auth.session.set(session);
    localStorage.setItem(sessionKey, JSON.stringify(session));
    TestBed.inject(SupabaseService).setAccessToken(session.accessToken);

    const profile = firstValueFrom(TestBed.inject(UsersService).getById(user.id));
    const request = http.expectOne((candidate) => candidate.url === profileUrl);
    expect(request.request.headers.get('Authorization')).toBe('Bearer expired-token');
    request.flush({ message: 'JWT expired' }, { status: 401, statusText: 'Unauthorized' });

    return profile;
  }

  it('renueva un JWT vencido y reintenta con el token nuevo', async () => {
    const profile = startProfileRequest();

    const refresh = http.expectOne({ method: 'POST', url: refreshUrl });
    expect(refresh.request.body).toEqual({ refresh_token: 'test-refresh-token' });
    refresh.flush({ access_token: 'renewed-token' });

    const retried = await vi.waitFor(() => http.expectOne((request) => request.url === profileUrl));
    expect(retried.request.headers.get('Authorization')).toBe('Bearer renewed-token');
    expect(retried.request.params.get('id')).toBe(`eq.${user.id}`);
    retried.flush([user]);

    await expect(profile).resolves.toEqual(user);
    expect(TestBed.inject(AuthService).session()?.accessToken).toBe('renewed-token');
  });

  it('cierra la sesión y evita reintentos si Supabase rechaza la renovación', async () => {
    const profile = startProfileRequest();

    http.expectOne({ method: 'POST', url: refreshUrl }).flush(
      { message: 'Refresh token revoked' },
      { status: 401, statusText: 'Unauthorized' }
    );

    await expect(profile).rejects.toMatchObject({ status: 401, error: { message: 'JWT expired' } });
    expect(TestBed.inject(AuthService).currentUser()).toBeNull();
    expect(TestBed.inject(SupabaseService).getAccessToken()).toBeNull();
    expect(localStorage.getItem(sessionKey)).toBeNull();
  });
});
