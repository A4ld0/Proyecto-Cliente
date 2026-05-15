import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  REQUEST_STATUS_LABELS,
  REQUEST_TYPE_LABELS,
  REQUEST_TYPES
} from '../../../../core/constants/printlab.constants';
import { AuthService, CartService, RequestsService } from '../../../../core/services';
import { getApiErrorMessage } from '../../../../core/utils/api-error.util';
import {
  getFieldErrorMessage,
  isFieldInvalid,
  ValidationMessages
} from '../../../../core/utils/form-errors.util';
import {
  PrintRequest,
  PrintRequestPayload,
  RequestStatus,
  RequestType
} from '../../../../interfaces';

@Component({
  selector: 'app-client-requests-page',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './client-requests-page.component.html',
  styleUrl: './client-requests-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientRequestsPageComponent {
  private readonly authService = inject(AuthService);
  private readonly cartService = inject(CartService);
  private readonly requestsService = inject(RequestsService);

  readonly currentUser = this.authService.currentUser;
  readonly cartItems = this.cartService.items;
  readonly cartItemCount = this.cartService.itemCount;
  readonly cartEstimatedTotal = this.cartService.estimatedTotal;
  readonly requests = signal<PrintRequest[]>([]);
  readonly requestStatusLabels = REQUEST_STATUS_LABELS;
  readonly requestTypes = REQUEST_TYPES;
  readonly requestTypeLabels = REQUEST_TYPE_LABELS;
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly validationMessages: Record<string, ValidationMessages> = {
    title: {
      required: 'Ingresa un titulo para la solicitud.',
      minlength: 'El titulo debe tener al menos 3 caracteres.',
      maxlength: 'El titulo no debe exceder 80 caracteres.'
    },
    description: {
      required: 'Agrega una descripcion.',
      minlength: 'La descripcion debe tener al menos 10 caracteres.',
      maxlength: 'La descripcion no debe exceder 500 caracteres.'
    },
    request_type: {
      required: 'Selecciona el tipo de solicitud.'
    }
  };

  readonly form = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3), Validators.maxLength(80)]
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(10), Validators.maxLength(500)]
    }),
    request_type: new FormControl('GENERAL_3D', {
      nonNullable: true,
      validators: [Validators.required]
    })
  });

  constructor() {
    this.prefillFromCart();
    void this.loadRequests();
  }

  async loadRequests(): Promise<void> {
    const user = this.currentUser();

    if (!user) {
      this.errorMessage.set('Inicia sesion para administrar tus solicitudes.');
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const requests = await firstValueFrom(this.requestsService.list({ clientId: user.id }));
      this.requests.set(requests);
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'No pudimos cargar tus solicitudes.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  editRequest(request: PrintRequest): void {
    this.editingId.set(request.id);
    this.successMessage.set('');
    this.form.patchValue({
      title: request.title,
      description: request.description ?? '',
      request_type: request.request_type
    });
  }

  resetForm(): void {
    this.editingId.set(null);
    this.form.reset({
      title: '',
      description: '',
      request_type: 'GENERAL_3D'
    });
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const user = this.currentUser();

    if (!user) {
      this.errorMessage.set('Inicia sesion para guardar la solicitud.');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const rawValue = this.form.getRawValue();
    const payload = {
      title: rawValue.title,
      description: rawValue.description || null,
      request_type: rawValue.request_type as RequestType,
      client_id: user.id
    };

    try {
      if (this.editingId()) {
        await firstValueFrom(this.requestsService.update(this.editingId()!, payload));
        this.successMessage.set('La solicitud se actualizo correctamente.');
      } else {
        const createPayload: PrintRequestPayload = {
          ...payload,
          status: 'PENDING'
        };
        await firstValueFrom(this.requestsService.create(createPayload));
        this.successMessage.set('Tu solicitud se registro correctamente.');
        this.cartService.clear();
      }

      this.resetForm();
      await this.loadRequests();
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'No pudimos guardar la solicitud.'));
    } finally {
      this.isSaving.set(false);
    }
  }

  async deleteRequest(request: PrintRequest): Promise<void> {
    if (!window.confirm(`Deseas eliminar la solicitud "${request.title}"?`)) {
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      await firstValueFrom(this.requestsService.delete(request.id));
      this.successMessage.set('La solicitud se elimino correctamente.');

      if (this.editingId() === request.id) {
        this.resetForm();
      }

      await this.loadRequests();
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'No pudimos eliminar la solicitud.'));
    }
  }

  statusClass(status: RequestStatus): string {
    if (status === 'CANCELED') {
      return 'danger';
    }

    if (['PENDING', 'IN_REVIEW'].includes(status)) {
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

  prefillFromCart(): void {
    if (!this.cartItems().length || this.editingId()) {
      return;
    }

    this.form.patchValue({
      title: this.cartService.buildRequestTitle(),
      description: this.cartService.buildRequestDescription(),
      request_type: 'GENERAL_3D'
    });
  }

  clearCartDraft(): void {
    this.cartService.clear();
    this.resetForm();
  }
}
