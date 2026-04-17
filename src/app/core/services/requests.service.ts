import { Injectable, inject } from '@angular/core';
import { PrintRequest, PrintRequestPayload } from '../../interfaces';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class RequestsService {
  private readonly supabase = inject(SupabaseService);
  private readonly table = 'requests';

  list(filters?: { clientId?: string }) {
    return this.supabase.select<PrintRequest>(this.table, {
      filters: filters?.clientId ? [{ column: 'client_id', value: filters.clientId }] : undefined,
      order: { column: 'created_at', ascending: false }
    });
  }

  create(payload: PrintRequestPayload) {
    return this.supabase.insert<PrintRequest>(this.table, payload);
  }

  update(id: string, payload: Partial<PrintRequestPayload>) {
    return this.supabase.update<PrintRequest>(this.table, payload, [{ column: 'id', value: id }]);
  }

  delete(id: string) {
    return this.supabase.delete<PrintRequest>(this.table, [{ column: 'id', value: id }]);
  }
}
