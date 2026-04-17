import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ORDER_STATUS_LABELS, REQUEST_STATUS_LABELS } from '../../../../core/constants/printlab.constants';
import { OrdersService, RequestsService, UsersService } from '../../../../core/services';
import { getApiErrorMessage } from '../../../../core/utils/api-error.util';
import { Order, PrintRequest, User } from '../../../../interfaces';

@Component({
  selector: 'app-admin-dashboard-page',
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard-page.component.html',
  styleUrl: './admin-dashboard-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminDashboardPageComponent {
  private readonly usersService = inject(UsersService);
  private readonly requestsService = inject(RequestsService);
  private readonly ordersService = inject(OrdersService);

  readonly users = signal<User[]>([]);
  readonly requests = signal<PrintRequest[]>([]);
  readonly orders = signal<Order[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly requestStatusLabels = REQUEST_STATUS_LABELS;
  readonly orderStatusLabels = ORDER_STATUS_LABELS;

  readonly clientsCount = computed(() => this.users().filter((user) => user.role === 'CLIENT').length);
  readonly activeRequests = computed(
    () => this.requests().filter((request) => !['DONE', 'REJECTED'].includes(request.status)).length
  );
  readonly totalSales = computed(() =>
    this.orders().reduce((total, order) => total + Number(order.total || 0), 0)
  );

  constructor() {
    void this.loadData();
  }

  async loadData(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const [users, requests, orders] = await Promise.all([
        firstValueFrom(this.usersService.list()),
        firstValueFrom(this.requestsService.list()),
        firstValueFrom(this.ordersService.list())
      ]);

      this.users.set(users);
      this.requests.set(requests);
      this.orders.set(orders);
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'No pudimos cargar el resumen general.'));
    } finally {
      this.isLoading.set(false);
    }
  }
}
