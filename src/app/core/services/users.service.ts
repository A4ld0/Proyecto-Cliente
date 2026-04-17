import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import { User, UserPayload } from '../../interfaces';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly supabase = inject(SupabaseService);
  private readonly table = 'profiles';

  list() {
    return this.supabase.select<User>(this.table, {
      order: { column: 'created_at', ascending: false }
    });
  }

  getById(id: string) {
    return this.supabase
      .select<User>(this.table, { filters: [{ column: 'id', value: id }], limit: 1 })
      .pipe(map((users) => users[0] ?? null));
  }

  getByEmail(email: string) {
    return this.supabase
      .select<User>(this.table, { filters: [{ column: 'email', value: email }], limit: 1 })
      .pipe(map((users) => users[0] ?? null));
  }

  upsert(payload: UserPayload & { id: string }) {
    return this.supabase.insert<User>(this.table, payload, {
      upsert: true,
      onConflict: ['id']
    });
  }

  update(id: string, payload: Partial<UserPayload>) {
    return this.supabase.update<User>(this.table, payload, [{ column: 'id', value: id }]);
  }
}
