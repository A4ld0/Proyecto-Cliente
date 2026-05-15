import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, computed, inject, signal } from '@angular/core';
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
  QuotesService,
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
  private ordersChannel: RealtimeChannel | null = null;

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
