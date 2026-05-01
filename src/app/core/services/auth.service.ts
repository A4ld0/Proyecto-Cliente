import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AppSession, SupabaseAuthResponse, User, UserPayload } from '../../interfaces';
import { SupabaseService } from './supabase.service';
import { UsersService } from './users.service';

interface RegisterPayload extends UserPayload {
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);
  private readonly supabase = inject(SupabaseService);
  private readonly usersService = inject(UsersService);
  private readonly storageKey = 'printlab.session';
  private refreshTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private refreshPromise: Promise<AppSession | null> | null = null;

  readonly session = signal<AppSession | null>(this.restoreSession());
  readonly currentUser = computed(() => this.session()?.user ?? null);
  readonly isAuthenticated = computed(() => !!this.session()?.accessToken);
  readonly isConfigured = computed(() => this.supabase.isConfigured);

  constructor() {
    this.supabase.setAccessToken(this.session()?.accessToken ?? null);
    this.scheduleTokenRefresh();
    void this.refreshSessionIfNeeded();
  }

  async signIn(email: string, password: string): Promise<User> {
    const response = (await firstValueFrom(
      this.supabase.signIn(email, password)
    )) as SupabaseAuthResponse;

    if (!response.access_token || !response.user?.id) {
      throw new Error('No fue posible validar la sesion.');
    }

    this.supabase.setAccessToken(response.access_token);

    const profile =
      (await firstValueFrom(this.usersService.getById(response.user.id))) ??
      (await firstValueFrom(this.usersService.getByEmail(email)));

    if (!profile) {
      throw new Error('No encontramos un perfil asociado a esta cuenta.');
    }

    this.persistSession({
      accessToken: response.access_token,
      expiresAt: this.getExpiresAt(response),
      refreshToken: response.refresh_token,
      user: profile
    });

    return profile;
  }

  signInWithGoogle(): void {
    const redirectTo = `${window.location.origin}/auth/callback`;
    window.location.href = this.supabase.getOAuthUrl('google', redirectTo);
  }

  async completeOAuthSignIn(fragment: string): Promise<User> {
    const params = new URLSearchParams(fragment.replace(/^#/, ''));
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token') ?? undefined;

    if (!accessToken) {
      throw new Error('Google no devolvio una sesion valida.');
    }

    this.supabase.setAccessToken(accessToken);

    const authUser = (await firstValueFrom(
      this.supabase.getAuthUser(accessToken)
    )) as SupabaseAuthResponse['user'];

    if (!authUser?.id) {
      throw new Error('No fue posible validar la cuenta de Google.');
    }

    const email = authUser.email ?? '';
    const fullName = authUser.user_metadata?.full_name ?? authUser.user_metadata?.name ?? email;
    let profile =
      (await firstValueFrom(this.usersService.getById(authUser.id))) ??
      (email ? await firstValueFrom(this.usersService.getByEmail(email)) : null);

    if (!profile) {
      const [createdProfile] = await firstValueFrom(
        this.usersService.upsert({
          id: authUser.id,
          full_name: fullName || 'Cliente',
          email,
          phone: null,
          role: 'CLIENT',
          is_active: true
        })
      );
      profile = createdProfile ?? null;
    }

    if (!profile) {
      throw new Error('No encontramos un perfil asociado a esta cuenta.');
    }

    this.persistSession({
      accessToken,
      expiresAt: this.getExpiresAtFromParams(params),
      refreshToken,
      user: profile
    });

    return profile;
  }

  async register(payload: RegisterPayload): Promise<User> {
    const response = (await firstValueFrom(
      this.supabase.signUp(payload.email ?? '', payload.password, {
        name: payload.full_name
      })
    )) as SupabaseAuthResponse;

    const userId = response.user?.id;

    if (!userId) {
      throw new Error('No fue posible completar el registro.');
    }

    let profile =
      (await firstValueFrom(this.usersService.getById(userId))) ??
      (await firstValueFrom(this.usersService.getByEmail(payload.email ?? '')));

    if (response.access_token) {
      this.supabase.setAccessToken(response.access_token);
      const [updatedProfile] = await firstValueFrom(
        this.usersService.update(userId, {
          full_name: payload.full_name,
          phone: payload.phone,
          role: payload.role,
          is_active: payload.is_active ?? true
        })
      );
      profile = updatedProfile ?? profile;
    }

    if (!profile) {
      throw new Error('No fue posible crear el perfil de usuario.');
    }

    if (response.access_token) {
      this.persistSession({
        accessToken: response.access_token,
        expiresAt: this.getExpiresAt(response),
        refreshToken: response.refresh_token,
        user: profile
      });
    }

    return profile;
  }

  async updateCurrentUser(payload: Partial<UserPayload>): Promise<User> {
    const currentUser = this.currentUser();

    if (!currentUser) {
      throw new Error('No hay una sesion activa.');
    }

    const [updatedUser] = await firstValueFrom(this.usersService.update(currentUser.id, payload));

    if (!updatedUser) {
      throw new Error('No fue posible actualizar el perfil.');
    }

    this.persistSession({
      accessToken: this.session()!.accessToken,
      expiresAt: this.session()!.expiresAt,
      refreshToken: this.session()!.refreshToken,
      user: updatedUser
    });

    return updatedUser;
  }

  async refreshSessionIfNeeded(force = false): Promise<AppSession | null> {
    const currentSession = this.session();

    if (!currentSession?.refreshToken) {
      return currentSession;
    }

    const expiresAt = currentSession.expiresAt ?? 0;
    const shouldRefresh = force || !expiresAt || Date.now() >= expiresAt - 60_000;

    if (!shouldRefresh) {
      return currentSession;
    }

    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.refreshSession(currentSession)
      .catch(() => {
        this.clearSession();
        return null;
      })
      .finally(() => {
        this.refreshPromise = null;
      });

    return this.refreshPromise;
  }

  async signOut(redirectTo = '/landing'): Promise<void> {
    try {
      await firstValueFrom(this.supabase.signOut());
    } catch {
      // Local logout still happens even if the remote session is already invalid.
    }

    this.clearSession();
    await this.router.navigateByUrl(redirectTo);
  }

  private restoreSession(): AppSession | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    const rawSession = localStorage.getItem(this.storageKey);

    if (!rawSession) {
      return null;
    }

    try {
      return JSON.parse(rawSession) as AppSession;
    } catch {
      localStorage.removeItem(this.storageKey);
      return null;
    }
  }

  private persistSession(session: AppSession): void {
    this.session.set(session);
    this.supabase.setAccessToken(session.accessToken);
    localStorage.setItem(this.storageKey, JSON.stringify(session));
    this.scheduleTokenRefresh();
  }

  private clearSession(): void {
    this.session.set(null);
    this.supabase.setAccessToken(null);
    localStorage.removeItem(this.storageKey);
    this.clearRefreshTimer();
  }

  private async refreshSession(currentSession: AppSession): Promise<AppSession> {
    const response = (await firstValueFrom(
      this.supabase.refreshToken(currentSession.refreshToken!)
    )) as SupabaseAuthResponse;

    if (!response.access_token) {
      throw new Error('No fue posible renovar la sesion.');
    }

    const refreshedSession: AppSession = {
      accessToken: response.access_token,
      expiresAt: this.getExpiresAt(response),
      refreshToken: response.refresh_token ?? currentSession.refreshToken,
      user: currentSession.user
    };

    this.persistSession(refreshedSession);
    return refreshedSession;
  }

  private scheduleTokenRefresh(): void {
    this.clearRefreshTimer();

    const currentSession = this.session();

    if (!currentSession?.refreshToken || !currentSession.expiresAt) {
      return;
    }

    const refreshIn = Math.max(currentSession.expiresAt - Date.now() - 60_000, 5_000);
    this.refreshTimeoutId = setTimeout(() => {
      void this.refreshSessionIfNeeded(true);
    }, refreshIn);
  }

  private clearRefreshTimer(): void {
    if (this.refreshTimeoutId) {
      clearTimeout(this.refreshTimeoutId);
      this.refreshTimeoutId = null;
    }
  }

  private getExpiresAt(response: SupabaseAuthResponse): number | undefined {
    if (response.expires_at) {
      return response.expires_at * 1000;
    }

    if (response.expires_in) {
      return Date.now() + response.expires_in * 1000;
    }

    return undefined;
  }

  private getExpiresAtFromParams(params: URLSearchParams): number | undefined {
    const expiresAt = Number(params.get('expires_at'));
    const expiresIn = Number(params.get('expires_in'));

    if (expiresAt) {
      return expiresAt * 1000;
    }

    if (expiresIn) {
      return Date.now() + expiresIn * 1000;
    }

    return undefined;
  }
}
