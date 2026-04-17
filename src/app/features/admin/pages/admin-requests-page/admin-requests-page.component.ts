import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  REQUEST_STATUSES,
  REQUEST_STATUS_LABELS,
  REQUEST_TYPE_LABELS,
  REQUEST_TYPES
} from '../../../../core/constants/printlab.constants';
import { RequestsService, UsersService } from '../../../../core/services';
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
  RequestType,
  User
} from '../../../../interfaces';

@Component({
  selector: 'app-admin-requests-page',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-requests-page.component.html',
  styleUrl: './admin-requests-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminRequestsPageComponent {
  private readonly requestsService = inject(RequestsService);
  private readonly usersService = inject(UsersService);

  readonly requests = signal<PrintRequest[]>([]);
  readonly users = signal<User[]>([]);
  readonly clientOptions = computed(() => this.users().filter((user) => user.role === 'CLIENT'));
  readonly requestStatuses = REQUEST_STATUSES;
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
    },
    status: {
      required: 'Selecciona el estado.'
    },
    client_id: {
      required: 'Selecciona un cliente.'
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
    }),
    status: new FormControl('PENDING', { nonNullable: true, validators: [Validators.required] }),
    client_id: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  });

  constructor() {
    void this.loadData();
  }

  async loadData(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const [requests, users] = await Promise.all([
        firstValueFrom(this.requestsService.list()),
        firstValueFrom(this.usersService.list())
      ]);

      this.requests.set(requests);
      this.users.set(users);

      if (!this.form.controls.client_id.value && this.clientOptions().length) {
        this.form.controls.client_id.setValue(this.clientOptions()[0].id);
      }
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'No pudimos cargar las solicitudes.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  requestClientName(clientId: string): string {
    return this.users().find((user) => user.id === clientId)?.full_name ?? clientId;
  }

  editRequest(request: PrintRequest): void {
    this.editingId.set(request.id);
    this.successMessage.set('');
    this.form.patchValue({
      title: request.title,
      description: request.description ?? '',
      request_type: request.request_type,
      status: request.status,
      client_id: request.client_id
    });
  }

  resetForm(): void {
    this.editingId.set(null);
    this.form.reset({
      title: '',
      description: '',
      request_type: 'GENERAL_3D',
      status: 'PENDING',
      client_id: this.clientOptions()[0]?.id ?? ''
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
    const payload: PrintRequestPayload = {
      title: rawValue.title,
      description: rawValue.description || null,
      request_type: rawValue.request_type as RequestType,
      status: rawValue.status as RequestStatus,
      client_id: rawValue.client_id
    };

    try {
      if (this.editingId()) {
        await firstValueFrom(this.requestsService.update(this.editingId()!, payload));
        this.successMessage.set('La solicitud se actualizo correctamente.');
      } else {
        await firstValueFrom(this.requestsService.create(payload));
        this.successMessage.set('La solicitud se creo correctamente.');
      }

      this.resetForm();
      await this.loadData();
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

    try {
      await firstValueFrom(this.requestsService.delete(request.id));
      this.successMessage.set('La solicitud se elimino correctamente.');

      if (this.editingId() === request.id) {
        this.resetForm();
      }

      await this.loadData();
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
}
