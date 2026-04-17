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

  readonly session = signal<AppSession | null>(this.restoreSession());
  readonly currentUser = computed(() => this.session()?.user ?? null);
  readonly isAuthenticated = computed(() => !!this.session()?.accessToken);
  readonly isConfigured = computed(() => this.supabase.isConfigured);

  constructor() {
    this.supabase.setAccessToken(this.session()?.accessToken ?? null);
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
      refreshToken: response.refresh_token,
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
      refreshToken: this.session()!.refreshToken,
      user: updatedUser
    });

    return updatedUser;
  }

  async signOut(): Promise<void> {
    try {
      await firstValueFrom(this.supabase.signOut());
    } catch {
      // Local logout still happens even if the remote session is already invalid.
    }

    this.clearSession();
    await this.router.navigateByUrl('/landing');
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
  }

  private clearSession(): void {
    this.session.set(null);
    this.supabase.setAccessToken(null);
    localStorage.removeItem(this.storageKey);
  }
}
