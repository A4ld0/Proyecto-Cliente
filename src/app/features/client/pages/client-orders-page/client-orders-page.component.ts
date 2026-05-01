import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  ORDER_STATUS_LABELS,
  QUOTE_STATUS_LABELS
} from '../../../../core/constants/printlab.constants';
import { AuthService, OrdersService, QuotesService, RequestsService } from '../../../../core/services';
import { getApiErrorMessage } from '../../../../core/utils/api-error.util';
import { Order, Quote, QuoteStatus, PrintRequest } from '../../../../interfaces';

@Component({
  selector: 'app-client-orders-page',
  imports: [CommonModule],
  templateUrl: './client-orders-page.component.html',
  styleUrl: './client-orders-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientOrdersPageComponent {
  private readonly authService = inject(AuthService);
  private readonly ordersService = inject(OrdersService);
  private readonly requestsService = inject(RequestsService);
  private readonly quotesService = inject(QuotesService);

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
}
