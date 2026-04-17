import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from '../../../../core/constants/printlab.constants';
import { OrdersService, RequestsService, UsersService } from '../../../../core/services';
import { getApiErrorMessage } from '../../../../core/utils/api-error.util';
import {
  getFieldErrorMessage,
  isFieldInvalid,
  ValidationMessages
} from '../../../../core/utils/form-errors.util';
import { Order, OrderPayload, OrderStatus, PrintRequest, User } from '../../../../interfaces';

@Component({
  selector: 'app-admin-orders-page',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-orders-page.component.html',
  styleUrl: './admin-orders-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminOrdersPageComponent {
  private readonly ordersService = inject(OrdersService);
  private readonly requestsService = inject(RequestsService);
  private readonly usersService = inject(UsersService);

  readonly orders = signal<Order[]>([]);
  readonly requests = signal<PrintRequest[]>([]);
  readonly users = signal<User[]>([]);
  readonly clientOptions = computed(() => this.users().filter((user) => user.role === 'CLIENT'));
  readonly orderStatuses = ORDER_STATUSES;
  readonly orderStatusLabels = ORDER_STATUS_LABELS;
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly validationMessages: Record<string, ValidationMessages> = {
    request_id: {
      required: 'Selecciona una solicitud.'
    },
    client_id: {
      required: 'Selecciona un cliente.'
    },
    status: {
      required: 'Selecciona el estado.'
    },
    quantity: {
      required: 'Ingresa la cantidad.',
      min: 'La cantidad debe ser mayor o igual a 1.',
      max: 'La cantidad no debe exceder 1000 piezas.'
    },
    total: {
      required: 'Ingresa el total.',
      min: 'El total no puede ser negativo.'
    },
    notes: {
      maxlength: 'Las notas no deben exceder 250 caracteres.'
    }
  };

  readonly form = new FormGroup({
    request_id: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    client_id: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    status: new FormControl('CREATED', { nonNullable: true, validators: [Validators.required] }),
    quantity: new FormControl(1, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1), Validators.max(1000)]
    }),
    total: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)]
    }),
    notes: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(250)]
    })
  });

  constructor() {
    void this.loadData();
  }

  async loadData(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const [orders, requests, users] = await Promise.all([
        firstValueFrom(this.ordersService.list()),
        firstValueFrom(this.requestsService.list()),
        firstValueFrom(this.usersService.list())
      ]);

      this.orders.set(orders);
      this.requests.set(requests);
      this.users.set(users);

      if (!this.form.controls.request_id.value && this.requests().length) {
        this.form.controls.request_id.setValue(this.requests()[0].id);
        this.syncClientFromRequest(this.requests()[0].id);
      }
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'No pudimos cargar los pedidos.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  requestTitle(requestId: string): string {
    return this.requests().find((request) => request.id === requestId)?.title ?? requestId;
  }

  clientName(clientId: string): string {
    return this.users().find((user) => user.id === clientId)?.name ?? clientId;
  }

  syncClientFromRequest(requestId: string): void {
    const request = this.requests().find((item) => item.id === requestId);

    if (request) {
      this.form.controls.client_id.setValue(request.client_id);
    }
  }

  editOrder(order: Order): void {
    this.editingId.set(order.id);
    this.successMessage.set('');
    this.form.patchValue({
      request_id: order.request_id,
      client_id: order.client_id,
      status: order.status,
      quantity: order.quantity,
      total: Number(order.total),
      notes: order.notes ?? ''
    });
  }

  resetForm(): void {
    this.editingId.set(null);
    this.form.reset({
      request_id: this.requests()[0]?.id ?? '',
      client_id: this.requests()[0]?.client_id ?? '',
      status: 'CREATED',
      quantity: 1,
      total: 0,
      notes: ''
    });
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const rawValue = this.form.getRawValue();
    const payload: OrderPayload = {
      request_id: rawValue.request_id,
      client_id: rawValue.client_id,
      status: rawValue.status as OrderStatus,
      quantity: rawValue.quantity,
      total: Number(rawValue.total),
      notes: rawValue.notes || null
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
    if (!window.confirm(`¿Deseas eliminar el pedido "${order.id}"?`)) {
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
    if (status === 'CANCELLED') {
      return 'danger';
    }

    if (['CREATED', 'PRINTING'].includes(status)) {
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
}
