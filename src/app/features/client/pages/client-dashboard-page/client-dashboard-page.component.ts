import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  ORDER_STATUS_LABELS,
  REQUEST_STATUS_LABELS,
  REQUEST_TYPE_LABELS
} from '../../../../core/constants/printlab.constants';
import {
  AuthService,
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
export class ClientDashboardPageComponent {
  private readonly authService = inject(AuthService);
  private readonly requestsService = inject(RequestsService);
  private readonly ordersService = inject(OrdersService);
  private readonly quotesService = inject(QuotesService);

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
}
