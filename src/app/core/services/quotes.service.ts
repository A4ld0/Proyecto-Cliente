import { Injectable, inject } from '@angular/core';
import { Quote } from '../../interfaces';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class QuotesService {
  private readonly supabase = inject(SupabaseService);
  private readonly table = 'quotes';

  list() {
    return this.supabase.select<Quote>(this.table, {
      order: { column: 'created_at', ascending: false }
    });
  }
}
