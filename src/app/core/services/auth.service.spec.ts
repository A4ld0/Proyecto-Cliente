import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Observable, of, Subject } from 'rxjs';
import { client } from '../../../testing/fixtures';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';
import { UsersService } from './users.service';
import { User } from '../../interfaces';

describe('AuthService', () => {
  const storageKey = 'printlab.session';
  const credentials = { email: 'cliente@example.test', password: 'Prueba123' };
  const signUp = { ...credentials, full_name: client.full_name, phone: '12345678', role: 'CLIENT' } as const;
  const originalUrl = window.location.href;

  beforeEach(() => localStorage.removeItem(storageKey));
  afterEach(() => {
    localStorage.removeItem(storageKey);
    window.history.replaceState(null, '', originalUrl);
    vi.useRealTimers();
  });

  function setup() {
    const supabase = {
      isConfigured: true,
      setAccessToken: vi.fn(),
      signIn: vi.fn<() => Observable<unknown>>(() => of({ access_token: 'test-token', user: { id: client.id } })),
      signUp: vi.fn<() => Observable<unknown>>(() => of({ user: { id: client.id } })),
      signOut: vi.fn(() => of({})),
      getAuthUser: vi.fn<() => Observable<unknown>>(() => of({ id: client.id, email: client.email })),
      getOAuthUrl: vi.fn(() => '#authorize-google'),
      refreshToken: vi.fn<() => Observable<unknown>>(() => of({ access_token: 'fresh-token' }))
    };
    const users = {
      getById: vi.fn(() => of<User | null>(client)),
      getByEmail: vi.fn(() => of<User | null>(null)),
      upsert: vi.fn(() => of([client])),
      update: vi.fn(() => of([client]))
    };
    const navigateByUrl = vi.fn().mockResolvedValue(true);
    TestBed.configureTestingModule({ providers: [
      { provide: Router, useValue: { navigateByUrl } },
      { provide: SupabaseService, useValue: supabase },
      { provide: UsersService, useValue: users }
    ] });
    return { auth: TestBed.inject(AuthService), supabase, users, navigateByUrl };
  }

  it('descarta una sesión guardada ilegible y busca un perfil por correo si falta por ID', async () => {
    localStorage.setItem(storageKey, '{');
    const { auth, users, supabase } = setup();
    expect(auth.session()).toBeNull();
    expect(localStorage.getItem(storageKey)).toBeNull();
    users.getById.mockReturnValueOnce(of(null));
    users.getByEmail.mockReturnValueOnce(of(client));
    await expect(auth.signIn(credentials.email, credentials.password)).resolves.toEqual(client);
    expect(users.getByEmail).toHaveBeenCalledWith(credentials.email);
    expect(supabase.setAccessToken).toHaveBeenLastCalledWith('test-token');
    expect(JSON.parse(localStorage.getItem(storageKey) ?? '{}').user).toEqual(client);
  });

  it('rechaza acceso con respuesta incompleta o sin perfil y no guarda una sesión', async () => {
    const { auth, users, supabase } = setup();
    supabase.signIn.mockReturnValueOnce(of({}))
      .mockReturnValueOnce(of({ access_token: 'test-token' }));
    for (let attempt = 0; attempt < 2; attempt++) {
      await expect(auth.signIn(credentials.email, credentials.password)).rejects.toThrow('validar la sesion');
    }
    users.getById.mockReturnValueOnce(of(null));
    await expect(auth.signIn(credentials.email, credentials.password)).rejects.toThrow('perfil asociado');
    expect(localStorage.getItem(storageKey)).toBeNull();
  });

  it('envía el retorno de autenticación al proveedor de Google', () => {
    const { auth, supabase } = setup();
    auth.signInWithGoogle();
    expect(supabase.getOAuthUrl).toHaveBeenCalledWith('google', `${window.location.origin}/auth/callback`);
    expect(window.location.hash).toBe('#authorize-google');
  });

  it.each([
    ['#error_description=Acceso+cancelado', 'Acceso cancelado'],
    ['?error=access_denied', 'access_denied'],
    ['#code=sample', 'espera tokens'],
    ['#state=sample', 'no devolvio una sesion valida']
  ])('rechaza retornos de OAuth inválidos', async (input, message) => {
    const { auth, supabase } = setup();
    await expect(auth.completeOAuthSignIn(input)).rejects.toThrow(message);
    expect(supabase.getAuthUser).not.toHaveBeenCalled();
    expect(auth.isAuthenticated()).toBe(false);
  });

  it('rechaza usuarios de Google sin identificador o sin perfil tras intentar crearlo', async () => {
    const { auth, supabase, users } = setup();
    supabase.getAuthUser.mockReturnValueOnce(of(null));
    await expect(auth.completeOAuthSignIn('#access_token=oauth-token')).rejects.toThrow('cuenta de Google');
    supabase.getAuthUser.mockReturnValueOnce(of({ id: client.id }));
    users.getById.mockReturnValueOnce(of(null));
    users.upsert.mockReturnValueOnce(of([]));
    await expect(auth.completeOAuthSignIn('#access_token=oauth-token')).rejects.toThrow('perfil asociado');
    expect(users.getByEmail).not.toHaveBeenCalled();
    expect(users.upsert).toHaveBeenCalledWith(expect.objectContaining({ full_name: 'Cliente', email: '' }));
  });

  it.each([
    [{ full_name: 'Nombre completo' }, 'Nombre completo'],
    [{ name: 'Nombre corto' }, 'Nombre corto'],
    [undefined, credentials.email]
  ] as const)('crea perfiles de OAuth con el nombre disponible', async (metadata, expectedName) => {
    const { auth, users, supabase } = setup();
    supabase.getAuthUser.mockReturnValueOnce(of({ id: client.id, email: credentials.email, user_metadata: metadata }));
    users.getById.mockReturnValueOnce(of(null));
    await expect(auth.completeOAuthSignIn('#access_token=oauth-token')).resolves.toEqual(client);
    expect(users.upsert).toHaveBeenCalledWith({
      id: client.id, full_name: expectedName, email: credentials.email,
      role: 'CLIENT', phone: null, is_active: true
    });
    expect(auth.session()?.accessToken).toBe('oauth-token');
  });

  it('reutiliza un perfil consultado por correo y admite fechas de expiración absolutas y relativas', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
    const { auth, users } = setup();
    users.getById.mockReturnValueOnce(of(null));
    users.getByEmail.mockReturnValueOnce(of(client));
    await auth.completeOAuthSignIn('?access_token=oauth-token&expires_at=2000000000');
    expect(auth.session()?.expiresAt).toBe(2_000_000_000_000);
    await auth.completeOAuthSignIn('#access_token=oauth-token&expires_in=120');
    expect(auth.session()?.expiresAt).toBe(Date.now() + 120_000);
    expect(users.upsert).not.toHaveBeenCalled();
  });

  it('espera confirmación cuando el registro no devuelve sesión y activa el perfil si devuelve token', async () => {
    const { auth, supabase, users } = setup();
    users.getById.mockReturnValueOnce(of(null));
    users.getByEmail.mockReturnValueOnce(of(client));
    await expect(auth.register(signUp)).resolves.toEqual(client);
    expect(supabase.signUp).toHaveBeenCalledWith(credentials.email, credentials.password, { name: client.full_name });
    expect(users.update).not.toHaveBeenCalled();
    expect(auth.session()).toBeNull();
    supabase.signUp.mockReturnValueOnce(of({
      access_token: 'signup-token', user: { id: client.id }, expires_at: 2_000_000_000
    }));
    users.update.mockReturnValueOnce(of([]));
    await expect(auth.register({ ...signUp, email: null, is_active: false })).resolves.toEqual(client);
    expect(supabase.signUp).toHaveBeenLastCalledWith('', credentials.password, { name: client.full_name });
    expect(users.update).toHaveBeenCalledWith(client.id, expect.objectContaining({ is_active: false }));
    expect(auth.session()?.expiresAt).toBe(2_000_000_000_000);
    expect(auth.isAuthenticated()).toBe(true);
  });

  it('rechaza registros sin ID o sin perfil de usuario', async () => {
    const { auth, supabase, users } = setup();
    supabase.signUp.mockReturnValueOnce(of({}));
    await expect(auth.register(signUp)).rejects.toThrow('completar el registro');
    users.getById.mockReturnValueOnce(of(null));
    await expect(auth.register({ ...signUp, email: undefined })).rejects.toThrow('crear el perfil');
    expect(auth.session()).toBeNull();
  });

  it('actualiza el perfil sin reemplazar sus credenciales y elimina la sesión al salir', async () => {
    const { auth, supabase, users, navigateByUrl } = setup();
    await expect(auth.updateCurrentUser({ phone: '12345678' })).rejects.toThrow('sesion activa');
    await auth.signIn(credentials.email, credentials.password);
    users.update.mockReturnValueOnce(of([]));
    await expect(auth.updateCurrentUser({ phone: '12345678' })).rejects.toThrow('actualizar el perfil');
    const updated = { ...client, phone: '12345678' };
    users.update.mockReturnValueOnce(of([updated]));
    await expect(auth.updateCurrentUser({ phone: '12345678' })).resolves.toEqual(updated);
    expect(auth.session()).toMatchObject({ accessToken: 'test-token', user: updated });
    await auth.signOut();
    expect(supabase.signOut).toHaveBeenCalledOnce();
    expect(navigateByUrl).toHaveBeenCalledWith('/landing');
    expect(localStorage.getItem(storageKey)).toBeNull();
  });

  it('renueva automáticamente antes de vencer y comparte una sola renovación concurrente', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
    const { auth, supabase } = setup();
    supabase.signIn.mockReturnValueOnce(of({
      access_token: 'initial-token', refresh_token: 'old-refresh', expires_in: 120, user: { id: client.id }
    }));
    await auth.signIn(credentials.email, credentials.password);
    await expect(auth.refreshSessionIfNeeded()).resolves.toEqual(auth.session());
    const response = new Subject<unknown>();
    supabase.refreshToken.mockReturnValueOnce(response);
    await vi.advanceTimersByTimeAsync(59_999);
    expect(supabase.refreshToken).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    const shared = auth.refreshSessionIfNeeded(true);
    expect(supabase.refreshToken).toHaveBeenCalledExactlyOnceWith('old-refresh');
    response.next({ access_token: 'fresh-token', refresh_token: 'new-refresh' });
    await expect(shared).resolves.toMatchObject({ accessToken: 'fresh-token', refreshToken: 'new-refresh' });
    supabase.refreshToken.mockReturnValueOnce(of({}));
    await expect(auth.refreshSessionIfNeeded()).resolves.toBeNull();
    expect(localStorage.getItem(storageKey)).toBeNull();
  });
});
