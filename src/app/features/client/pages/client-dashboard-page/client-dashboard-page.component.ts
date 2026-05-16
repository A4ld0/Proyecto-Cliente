import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, NgZone, OnDestroy, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RealtimeChannel } from '@supabase/supabase-js';
import { firstValueFrom } from 'rxjs';
import {
  ORDER_STATUS_LABELS,
  REQUEST_STATUS_LABELS,
  REQUEST_TYPE_LABELS
} from '../../../../core/constants/printlab.constants';
import {
  AuthService,
  OrderRealtimePayload,
  OrdersService,
  QuoteRealtimePayload,
  QuotesService,
  RequestRealtimePayload,
  RequestsService
} from '../../../../core/services';
import { getApiErrorMessage } from '../../../../core/utils/api-error.util';
import { Order, Quote, PrintRequest } from '../../../../interfaces';

@Component({
  selector: 'app-client-dashboard-page',
  imports: [CommonModule, RouterLink],
  templateUrl: './client-dashboard-page.component.html',
  styleUrl: './client-dashboard-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientDashboardPageComponent implements OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly requestsService = inject(RequestsService);
  private readonly ordersService = inject(OrdersService);
  private readonly quotesService = inject(QuotesService);
  private readonly zone = inject(NgZone);
  private ordersChannel: RealtimeChannel | null = null;
  private requestsChannel: RealtimeChannel | null = null;
  private quotesChannel: RealtimeChannel | null = null;

  readonly currentUser = this.authService.currentUser;
  readonly requests = signal<PrintRequest[]>([]);
  readonly orders = signal<Order[]>([]);
  readonly quotes = signal<Quote[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly requestStatusLabels = REQUEST_STATUS_LABELS;
  readonly requestTypeLabels = REQUEST_TYPE_LABELS;
  readonly orderStatusLabels = ORDER_STATUS_LABELS;

  readonly activeRequests = computed(
    () => this.requests().filter((request) => !['CLOSED', 'CANCELED'].includes(request.status)).length
  );
  readonly deliveredOrders = computed(
    () => this.orders().filter((order) => order.status === 'DELIVERED').length
  );
  readonly totalSpent = computed(() =>
    this.orders().reduce((total, order) => total + this.quoteTotal(order.quote_id), 0)
  );

  constructor() {
    void this.loadData();
    this.subscribeToOrdersRealtime();
  }

  ngOnDestroy(): void {
    if (this.ordersChannel) {
      this.ordersService.removeRealtimeChannel(this.ordersChannel);
    }

    if (this.requestsChannel) {
      this.requestsService.removeRealtimeChannel(this.requestsChannel);
    }

    if (this.quotesChannel) {
      this.quotesService.removeRealtimeChannel(this.quotesChannel);
    }
  }

  async loadData(): Promise<void> {
    const user = this.currentUser();

    if (!user) {
      this.errorMessage.set('Inicia sesion para ver tu informacion.');
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const [requests, orders] = await Promise.all([
        firstValueFrom(this.requestsService.list({ clientId: user.id })),
        firstValueFrom(this.ordersService.list({ clientId: user.id }))
      ]);
      const requestIds = requests.map((request) => request.id);
      const quotes = requestIds.length
        ? await firstValueFrom(this.quotesService.list({ requestIds }))
        : [];

      this.requests.set(requests);
      this.orders.set(orders);
      this.quotes.set(quotes);
      this.subscribeToRealtime(user.id);
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'No pudimos cargar tu resumen por ahora.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  quoteTotal(quoteId: string): number {
    return Number(this.quotes().find((quote) => quote.id === quoteId)?.price_total ?? 0);
  }

  private subscribeToOrdersRealtime(): void {
    const user = this.currentUser();

    if (!user) {
      return;
    }

    this.subscribeToRealtime(user.id);
  }

  private subscribeToRealtime(clientId: string): void {
    if (!this.ordersChannel) {
      this.ordersChannel = this.ordersService.watchClientOrders(clientId, (payload) => {
        this.zone.run(() => this.applyOrderRealtimePayload(payload));
      });
    }

    if (!this.requestsChannel) {
      this.requestsChannel = this.requestsService.watchClientRequests(clientId, (payload) => {
        this.zone.run(() => this.applyRequestRealtimePayload(payload));
      });
    }

    if (!this.quotesChannel) {
      this.quotesChannel = this.quotesService.watchQuotes((payload) => {
        this.zone.run(() => this.applyQuoteRealtimePayload(payload));
      });
    }
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

  private applyRequestRealtimePayload(payload: RequestRealtimePayload): void {
    if (payload.eventType === 'DELETE') {
      const deletedId = payload.old['id'];

      if (typeof deletedId === 'string') {
        this.requests.update((requests) => requests.filter((request) => request.id !== deletedId));
        this.quotes.update((quotes) => quotes.filter((quote) => quote.request_id !== deletedId));
      }

      return;
    }

    const changedRequest = payload.new as PrintRequest;

    if (!changedRequest?.id) {
      return;
    }

    this.requests.update((requests) => {
      const exists = requests.some((request) => request.id === changedRequest.id);

      if (!exists) {
        return [changedRequest, ...requests];
      }

      return requests.map((request) =>
        request.id === changedRequest.id ? changedRequest : request
      );
    });
  }

  private applyQuoteRealtimePayload(payload: QuoteRealtimePayload): void {
    if (payload.eventType === 'DELETE') {
      const deletedId = payload.old['id'];

      if (typeof deletedId === 'string') {
        this.quotes.update((quotes) => quotes.filter((quote) => quote.id !== deletedId));
      }

      return;
    }

    const changedQuote = payload.new as Quote;

    if (!changedQuote?.id || !this.requests().some((request) => request.id === changedQuote.request_id)) {
      return;
    }

    this.quotes.update((quotes) => {
      const exists = quotes.some((quote) => quote.id === changedQuote.id);

      if (!exists) {
        return [changedQuote, ...quotes];
      }

      return quotes.map((quote) => (quote.id === changedQuote.id ? changedQuote : quote));
    });
  }
}
