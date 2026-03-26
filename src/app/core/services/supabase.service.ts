import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private readonly http = inject(HttpClient);

  private readonly supabaseUrl = environment.supabase.url;
  private readonly supabaseAnonKey = environment.supabase.anonKey;

  private get headers(): HttpHeaders {
    return new HttpHeaders({
      apikey: this.supabaseAnonKey,
      Authorization: `Bearer ${this.supabaseAnonKey}`,
      'Content-Type': 'application/json'
    });
  }

  select<T>(table: string): Observable<T[]> {
    return this.http.get<T[]>(`${this.supabaseUrl}/rest/v1/${table}`, {
      headers: this.headers
    });
  }

  insert<T>(table: string, payload: Partial<T>): Observable<T[]> {
    return this.http.post<T[]>(`${this.supabaseUrl}/rest/v1/${table}`, payload, {
      headers: this.headers
    });
  }

  signIn(email: string, password: string): Observable<unknown> {
    return this.http.post(
      `${this.supabaseUrl}/auth/v1/token?grant_type=password`,
      { email, password },
      { headers: this.headers }
    );
  }
}
