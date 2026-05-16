import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, NgZone, OnDestroy, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RealtimeChannel } from '@supabase/supabase-js';
import { firstValueFrom } from 'rxjs';
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  QUOTE_STATUS_LABELS
} from '../../../../core/constants/printlab.constants';
import {
  OrderRealtimePayload,
  OrdersService,
  QuotesService,
  RequestsService,
  UsersService
} from '../../../../core/services';
import { getApiErrorMessage } from '../../../../core/utils/api-error.util';
import {
  getFieldErrorMessage,
  isFieldInvalid,
  ValidationMessages
} from '../../../../core/utils/form-errors.util';
import { Order, OrderPayload, OrderStatus, Quote, PrintRequest, User } from '../../../../interfaces';

@Component({
  selector: 'app-admin-orders-page',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-orders-page.component.html',
  styleUrl: './admin-orders-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminOrdersPageComponent implements OnDestroy {
  private readonly ordersService = inject(OrdersService);
  private readonly quotesService = inject(QuotesService);
  private readonly requestsService = inject(RequestsService);
  private readonly usersService = inject(UsersService);
  private readonly zone = inject(NgZone);
  private ordersChannel: RealtimeChannel | null = null;

  readonly orders = signal<Order[]>([]);
  readonly quotes = signal<Quote[]>([]);
  readonly requests = signal<PrintRequest[]>([]);
  readonly users = signal<User[]>([]);
  readonly orderStatuses = ORDER_STATUSES;
  readonly orderStatusLabels = ORDER_STATUS_LABELS;
  readonly quoteStatusLabels = QUOTE_STATUS_LABELS;
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly availableQuotes = computed(() =>
    this.quotes().filter((quote) => {
      const assignedOrder = this.orders().find((order) => order.quote_id === quote.id);
      const belongsToEditedOrder = assignedOrder?.id === this.editingId();
      return (quote.status === 'ACCEPTED' && !assignedOrder) || belongsToEditedOrder;
    })
  );
  readonly validationMessages: Record<string, ValidationMessages> = {
    quote_id: {
      required: 'Selecciona una cotizacion.'
    },
    client_id: {
      required: 'Selecciona un cliente.'
    },
    status: {
      required: 'Selecciona el estado.'
    }
  };

  readonly form = new FormGroup({
    quote_id: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    client_id: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    status: new FormControl('QUEUE', { nonNullable: true, validators: [Validators.required] })
  });

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
    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const [orders, quotes, requests, users] = await Promise.all([
        firstValueFrom(this.ordersService.list()),
        firstValueFrom(this.quotesService.list()),
        firstValueFrom(this.requestsService.list()),
        firstValueFrom(this.usersService.list())
      ]);

      this.orders.set(orders);
      this.quotes.set(quotes);
      this.requests.set(requests);
      this.users.set(users);

      if (!this.form.controls.quote_id.value && this.availableQuotes().length) {
        this.form.controls.quote_id.setValue(this.availableQuotes()[0].id);
        this.syncClientFromQuote(this.availableQuotes()[0].id);
      }
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'No pudimos cargar los pedidos.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  quoteById(quoteId: string): Quote | undefined {
    return this.quotes().find((quote) => quote.id === quoteId);
  }

  requestTitleFromQuote(quoteId: string): string {
    const requestId = this.quoteById(quoteId)?.request_id;
    return this.requests().find((request) => request.id === requestId)?.title ?? quoteId;
  }

  clientName(clientId: string): string {
    return this.users().find((user) => user.id === clientId)?.full_name ?? clientId;
  }

  quoteTotal(quoteId: string): number {
    return Number(this.quoteById(quoteId)?.price_total ?? 0);
  }

  syncClientFromQuote(quoteId: string): void {
    const requestId = this.quoteById(quoteId)?.request_id;
    const clientId = this.requests().find((request) => request.id === requestId)?.client_id;

    if (clientId) {
      this.form.controls.client_id.setValue(clientId);
    }
  }

  editOrder(order: Order): void {
    this.editingId.set(order.id);
    this.successMessage.set('');
    this.form.patchValue({
      quote_id: order.quote_id,
      client_id: order.client_id,
      status: order.status
    });
  }

  resetForm(): void {
    this.editingId.set(null);
    this.form.reset({
      quote_id: this.availableQuotes()[0]?.id ?? '',
      client_id: '',
      status: 'QUEUE'
    });

    if (this.availableQuotes().length) {
      this.syncClientFromQuote(this.availableQuotes()[0].id);
    }
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const selectedQuote = this.quoteById(this.form.controls.quote_id.getRawValue());

    if (!this.editingId() && (!selectedQuote || selectedQuote.status !== 'ACCEPTED')) {
      this.errorMessage.set('Solo puedes crear pedidos desde cotizaciones aceptadas.');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const rawValue = this.form.getRawValue();
    const payload: OrderPayload = {
      quote_id: rawValue.quote_id,
      client_id: rawValue.client_id,
      status: rawValue.status as OrderStatus
    };

    try {
      if (this.editingId()) {
        await firstValueFrom(this.ordersService.update(this.editingId()!, payload));
        this.successMessage.set('El pedido se actualizo correctamente.');
      } else {
        await firstValueFrom(this.ordersService.create(payload));
        this.successMessage.set('El pedido se creo correctamente.');
      }

      this.resetForm();
      await this.loadData();
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'No pudimos guardar el pedido.'));
    } finally {
      this.isSaving.set(false);
    }
  }

  async deleteOrder(order: Order): Promise<void> {
    if (!window.confirm(`Deseas eliminar el pedido "${order.id}"?`)) {
      return;
    }

    try {
      await firstValueFrom(this.ordersService.delete(order.id));
      this.successMessage.set('El pedido se elimino correctamente.');

      if (this.editingId() === order.id) {
        this.resetForm();
      }

      await this.loadData();
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'No pudimos eliminar el pedido.'));
    }
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

  hasFieldError(controlName: string): boolean {
    return isFieldInvalid(this.form, controlName);
  }

  getFieldError(controlName: string): string {
    return getFieldErrorMessage(this.form, controlName, this.validationMessages[controlName] ?? {});
  }

  private subscribeToOrdersRealtime(): void {
    this.ordersChannel = this.ordersService.watchAllOrders((payload) => {
      this.zone.run(() => this.applyOrderRealtimePayload(payload));
    });
  }

  private applyOrderRealtimePayload(payload: OrderRealtimePayload): void {
    if (payload.eventType === 'DELETE') {
      const deletedId = payload.old['id'];

      if (typeof deletedId === 'string') {
        this.orders.update((orders) => orders.filter((order) => order.id !== deletedId));

        if (this.editingId() === deletedId) {
          this.resetForm();
        }
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
