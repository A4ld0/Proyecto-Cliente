import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PostgrestFilter {
  column: string;
  operator?: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in';
  value: string | number | boolean | string[];
}

export interface PostgrestOrder {
  column: string;
  ascending?: boolean;
}

export interface PostgrestQuery {
  select?: string;
  filters?: PostgrestFilter[];
  order?: PostgrestOrder;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private readonly http = inject(HttpClient);
  private accessToken: string | null = null;

  private readonly supabaseUrl = environment.supabase.url;
  private readonly supabaseAnonKey = environment.supabase.anonKey;

  get isConfigured(): boolean {
    return (
      !this.supabaseUrl.includes('TU-PROYECTO') && !this.supabaseAnonKey.includes('TU_SUPABASE_ANON_KEY')
    );
  }

  setAccessToken(token: string | null): void {
    this.accessToken = token;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  private get headers(): HttpHeaders {
    return new HttpHeaders({
      apikey: this.supabaseAnonKey,
      Authorization: `Bearer ${this.accessToken ?? this.supabaseAnonKey}`,
      'Content-Type': 'application/json'
    });
  }

  private buildParams(query?: PostgrestQuery): HttpParams {
    let params = new HttpParams().set('select', query?.select ?? '*');

    for (const filter of query?.filters ?? []) {
      if (filter.operator === 'in' && Array.isArray(filter.value)) {
        params = params.append(filter.column, `in.(${filter.value.join(',')})`);
      } else {
        params = params.append(filter.column, `${filter.operator ?? 'eq'}.${filter.value}`);
      }
    }

    if (query?.order) {
      params = params.set(
        'order',
        `${query.order.column}.${query.order.ascending === false ? 'desc' : 'asc'}`
      );
    }

    if (query?.limit) {
      params = params.set('limit', query.limit);
    }

    return params;
  }

  select<T>(table: string, query?: PostgrestQuery): Observable<T[]> {
    return this.http.get<T[]>(`${this.supabaseUrl}/rest/v1/${table}`, {
      headers: this.headers,
      params: this.buildParams(query)
    });
  }

  insert<T>(
    table: string,
    payload: Partial<T> | Partial<T>[],
    options?: { upsert?: boolean; onConflict?: string[] }
  ): Observable<T[]> {
    let headers = this.headers.set('Prefer', 'return=representation');

    if (options?.upsert) {
      headers = headers.set('Prefer', 'return=representation,resolution=merge-duplicates');
    }

    return this.http.post<T[]>(`${this.supabaseUrl}/rest/v1/${table}`, payload, {
      headers,
      params: options?.onConflict?.length
        ? new HttpParams().set('on_conflict', options.onConflict.join(','))
        : undefined
    });
  }

  update<T>(table: string, payload: Partial<T>, filters: PostgrestFilter[]): Observable<T[]> {
    return this.http.patch<T[]>(`${this.supabaseUrl}/rest/v1/${table}`, payload, {
      headers: this.headers.set('Prefer', 'return=representation'),
      params: this.buildParams({ filters })
    });
  }

  delete<T>(table: string, filters: PostgrestFilter[]): Observable<T[]> {
    return this.http.delete<T[]>(`${this.supabaseUrl}/rest/v1/${table}`, {
      headers: this.headers.set('Prefer', 'return=representation'),
      params: this.buildParams({ filters })
    });
  }

  signIn(email: string, password: string): Observable<unknown> {
    return this.http.post(
      `${this.supabaseUrl}/auth/v1/token?grant_type=password`,
      { email, password },
      { headers: this.headers }
    );
  }

  refreshToken(refreshToken: string): Observable<unknown> {
    return this.http.post(
      `${this.supabaseUrl}/auth/v1/token?grant_type=refresh_token`,
      { refresh_token: refreshToken },
      { headers: this.headers }
    );
  }

  getAuthUser(accessToken: string): Observable<unknown> {
    return this.http.get(`${this.supabaseUrl}/auth/v1/user`, {
      headers: this.headers.set('Authorization', `Bearer ${accessToken}`)
    });
  }

  getOAuthUrl(provider: 'google', redirectTo: string): string {
    const params = new URLSearchParams({
      provider,
      redirect_to: redirectTo
    });

    return `${this.supabaseUrl}/auth/v1/authorize?${params.toString()}`;
  }

  signUp(email: string, password: string, data?: Record<string, unknown>): Observable<unknown> {
    return this.http.post(
      `${this.supabaseUrl}/auth/v1/signup`,
      data ? { email, password, data } : { email, password },
      {
        headers: this.headers
      }
    );
  }

  signOut(): Observable<unknown> {
    return this.http.post(`${this.supabaseUrl}/auth/v1/logout`, {}, { headers: this.headers });
  }
}
