import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { User } from '../../interfaces';
import { AuthService } from '../services';
import { adminGuard, clientGuard } from './role.guard';

describe('guards de permisos por rol', () => {
  const client: User = { id: 'client-1', full_name: 'Cliente', role: 'CLIENT', is_active: true };
  const admin: User = { id: 'admin-1', full_name: 'Admin', role: 'ADMIN', is_active: true };
  const user = signal<User | null>(null);
  const isAuthenticated = signal(false);
  const signOut = vi.fn<() => Promise<void>>();

  beforeEach(() => {
    user.set(null);
    isAuthenticated.set(false);
    signOut.mockReset().mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { currentUser: user, isAuthenticated, signOut } }
      ]
    });
  });

  async function checkGuard(guard: typeof clientGuard) {
    const router = TestBed.inject(Router);
    const state = router.routerState.snapshot;
    const result = await TestBed.runInInjectionContext(() => guard(state.root, state));
    return result instanceof UrlTree ? router.serializeUrl(result) : result;
  }

  it.each([
    [clientGuard, client],
    [adminGuard, admin]
  ] as const)('permite el acceso al rol asignado', async (guard, profile) => {
    user.set(profile);
    isAuthenticated.set(true);

    expect(await checkGuard(guard)).toBe(true);
  });

  it.each([
    [adminGuard, client, '/client/dashboard'],
    [clientGuard, admin, '/admin/dashboard']
  ] as const)('redirige al panel del propio rol si el otro está restringido', async (guard, profile, url) => {
    user.set(profile);
    isAuthenticated.set(true);

    expect(await checkGuard(guard)).toBe(url);
    expect(signOut).not.toHaveBeenCalled();
  });

  it('exige una sesión aunque exista un perfil en memoria', async () => {
    user.set(admin);

    expect(await checkGuard(adminGuard)).toBe('/login');
  });

  it('cierra la sesión de una cuenta desactivada y deniega la navegación', async () => {
    user.set({ ...client, is_active: false });
    isAuthenticated.set(true);

    expect(await checkGuard(clientGuard)).toBe(false);
    expect(signOut).toHaveBeenCalledExactlyOnceWith('/login');
  });
});
