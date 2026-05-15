import { Injectable, inject } from '@angular/core';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Order, OrderPayload } from '../../interfaces';
import { SupabaseService } from './supabase.service';

export type OrderRealtimePayload = RealtimePostgresChangesPayload<Order>;

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly supabase = inject(SupabaseService);
  private readonly table = 'orders';

  list(filters?: { clientId?: string }) {
    return this.supabase.select<Order>(this.table, {
      filters: filters?.clientId ? [{ column: 'client_id', value: filters.clientId }] : undefined,
      order: { column: 'created_at', ascending: false }
    });
  }

  create(payload: OrderPayload) {
    return this.supabase.insert<Order>(this.table, payload);
  }

  update(id: string, payload: Partial<OrderPayload>) {
    return this.supabase.update<Order>(this.table, payload, [{ column: 'id', value: id }]);
  }

  delete(id: string) {
    return this.supabase.delete<Order>(this.table, [{ column: 'id', value: id }]);
  }

  watchClientOrders(
    clientId: string,
    onChange: (payload: OrderRealtimePayload) => void
  ): RealtimeChannel {
    return this.supabase
      .channel(`client-orders-${clientId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: this.table,
          filter: `client_id=eq.${clientId}`
        },
        onChange
      )
      .subscribe();
  }

  watchAllOrders(onChange: (payload: OrderRealtimePayload) => void): RealtimeChannel {
    return this.supabase
      .channel('admin-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: this.table
        },
        onChange
      )
      .subscribe();
  }

  removeRealtimeChannel(channel: RealtimeChannel): void {
    this.supabase.removeChannel(channel);
  }
}
