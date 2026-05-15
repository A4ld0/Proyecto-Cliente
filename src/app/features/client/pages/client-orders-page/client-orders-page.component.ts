import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { firstValueFrom } from 'rxjs';
import {
  ORDER_STATUS_LABELS,
  QUOTE_STATUS_LABELS
} from '../../../../core/constants/printlab.constants';
import {
  AuthService,
  OrderRealtimePayload,
  OrdersService,
  QuotesService,
  RequestsService
} from '../../../../core/services';
import { getApiErrorMessage } from '../../../../core/utils/api-error.util';
import { Order, Quote, QuoteStatus, PrintRequest } from '../../../../interfaces';

@Component({
  selector: 'app-client-orders-page',
  imports: [CommonModule],
  templateUrl: './client-orders-page.component.html',
  styleUrl: './client-orders-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientOrdersPageComponent implements OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly ordersService = inject(OrdersService);
  private readonly requestsService = inject(RequestsService);
  private readonly quotesService = inject(QuotesService);
  private ordersChannel: RealtimeChannel | null = null;

  readonly currentUser = this.authService.currentUser;
  readonly orders = signal<Order[]>([]);
  readonly requests = signal<PrintRequest[]>([]);
  readonly quotes = signal<Quote[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly orderStatusLabels = ORDER_STATUS_LABELS;
  readonly quoteStatusLabels = QUOTE_STATUS_LABELS;
  readonly totalAmount = computed(() =>
    this.orders().reduce((total, order) => total + this.quoteTotal(order.quote_id), 0)
  );

  constructor() {
    void this.loadOrders();
    this.subscribeToOrdersRealtime();
  }

  ngOnDestroy(): void {
    if (this.ordersChannel) {
      this.ordersService.removeRealtimeChannel(this.ordersChannel);
    }
  }

  async loadOrders(): Promise<void> {
    const user = this.currentUser();

    if (!user) {
      this.errorMessage.set('Inicia sesion para ver tus pedidos.');
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const [orders, requests] = await Promise.all([
        firstValueFrom(this.ordersService.list({ clientId: user.id })),
        firstValueFrom(this.requestsService.list({ clientId: user.id }))
      ]);
      const requestIds = requests.map((request) => request.id);
      const quotes = requestIds.length
        ? await firstValueFrom(this.quotesService.list({ requestIds }))
        : [];

      this.orders.set(orders);
      this.requests.set(requests);
      this.quotes.set(quotes);
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'No pudimos cargar tus pedidos por ahora.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  quoteById(quoteId: string): Quote | undefined {
    return this.quotes().find((quote) => quote.id === quoteId);
  }

  quoteTotal(quoteId: string): number {
    return Number(this.quoteById(quoteId)?.price_total ?? 0);
  }

  quoteStatus(quoteId: string): QuoteStatus | null {
    return this.quoteById(quoteId)?.status ?? null;
  }

  requestTitleFromQuote(quoteId: string): string {
    const requestId = this.quoteById(quoteId)?.request_id;
    return this.requests().find((request) => request.id === requestId)?.title ?? quoteId;
  }

  statusClass(status: string): string {
    if (status === 'CANCELED') {
      return 'danger';
    }

    if (['QUEUE', 'PRINTING', 'POSTPROCESS'].includes(status)) {
      return 'warn';
    }

    return '';
  }

  private subscribeToOrdersRealtime(): void {
    const user = this.currentUser();

    if (!user) {
      return;
    }

    this.ordersChannel = this.ordersService.watchClientOrders(user.id, (payload) => {
      this.applyOrderRealtimePayload(payload);
    });
  }

  private applyOrderRealtimePayload(payload: OrderRealtimePayload): void {
    if (payload.eventType === 'DELETE') {
      const deletedId = payload.old['id'];

      if (typeof deletedId === 'string') {
        this.orders.update((orders) => orders.filter((order) => order.id !== deletedId));
      }

      return;
    }

    const changedOrder = payload.new as Order;

    if (!changedOrder?.id) {
      return;
    }

    this.orders.update((orders) => {
      const exists = orders.some((order) => order.id === changedOrder.id);

      if (!exists) {
        return [changedOrder, ...orders];
      }

      return orders.map((order) => (order.id === changedOrder.id ? changedOrder : order));
    });
  }
}
