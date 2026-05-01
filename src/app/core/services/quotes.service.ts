import { Injectable, inject } from '@angular/core';
import { Quote, QuotePayload } from '../../interfaces';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class QuotesService {
  private readonly supabase = inject(SupabaseService);
  private readonly table = 'quotes';

  list(filters?: { requestIds?: string[] }) {
    return this.supabase.select<Quote>(this.table, {
      filters: filters?.requestIds?.length
        ? [{ column: 'request_id', operator: 'in', value: filters.requestIds }]
        : undefined,
      order: { column: 'created_at', ascending: false }
    });
  }

  create(payload: QuotePayload) {
    return this.supabase.insert<Quote>(this.table, payload);
  }

  update(id: string, payload: Partial<QuotePayload>) {
    return this.supabase.update<Quote>(this.table, payload, [{ column: 'id', value: id }]);
  }
}
