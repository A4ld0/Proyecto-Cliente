import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ORDER_STATUS_LABELS } from '../../../../core/constants/printlab.constants';
import { AuthService, OrdersService, RequestsService } from '../../../../core/services';
import { getApiErrorMessage } from '../../../../core/utils/api-error.util';
import { Order, PrintRequest } from '../../../../interfaces';

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

  readonly currentUser = this.authService.currentUser;
  readonly orders = signal<Order[]>([]);
  readonly requests = signal<PrintRequest[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly orderStatusLabels = ORDER_STATUS_LABELS;
  readonly totalAmount = computed(() =>
    this.orders().reduce((total, order) => total + Number(order.total || 0), 0)
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

      this.orders.set(orders);
      this.requests.set(requests);
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'No pudimos cargar tus pedidos por ahora.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  requestTitle(requestId: string): string {
    return this.requests().find((request) => request.id === requestId)?.title ?? requestId;
  }

  statusClass(status: string): string {
    if (status === 'CANCELLED') {
      return 'danger';
    }

    if (['CREATED', 'PRINTING'].includes(status)) {
      return 'warn';
    }

    return '';
  }
}
