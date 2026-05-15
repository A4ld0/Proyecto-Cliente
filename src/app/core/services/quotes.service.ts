import { Injectable, inject } from '@angular/core';
import { Order, Quote, QuotePayload } from '../../interfaces';
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

  acceptQuote(quoteId: string) {
    return this.supabase.rpc<Order>('accept_quote', { p_quote_id: quoteId });
  }

  rejectQuote(quoteId: string) {
    return this.supabase.rpc<Quote>('reject_quote', { p_quote_id: quoteId });
  }
}
