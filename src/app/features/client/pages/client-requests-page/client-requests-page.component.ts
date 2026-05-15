import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  QUOTE_STATUS_LABELS,
  REQUEST_STATUS_LABELS,
  REQUEST_TYPE_LABELS,
  REQUEST_TYPES
} from '../../../../core/constants/printlab.constants';
import { AuthService, CartService, QuotesService, RequestsService } from '../../../../core/services';
import { getApiErrorMessage } from '../../../../core/utils/api-error.util';
import {
  getFieldErrorMessage,
  isFieldInvalid,
  ValidationMessages
} from '../../../../core/utils/form-errors.util';
import {
  PrintRequest,
  PrintRequestPayload,
  Quote,
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
  private readonly quotesService = inject(QuotesService);
  private readonly allowedAttachmentTypes = ['image/png', 'image/jpeg', 'image/webp', 'model/stl'];
  private readonly maxAttachmentSize = 20 * 1024 * 1024;

  readonly currentUser = this.authService.currentUser;
  readonly cartItems = this.cartService.items;
  readonly cartItemCount = this.cartService.itemCount;
  readonly cartEstimatedTotal = this.cartService.estimatedTotal;
  readonly requests = signal<PrintRequest[]>([]);
  readonly quotes = signal<Quote[]>([]);
  readonly requestStatusLabels = REQUEST_STATUS_LABELS;
  readonly quoteStatusLabels = QUOTE_STATUS_LABELS;
  readonly requestTypes = REQUEST_TYPES;
  readonly requestTypeLabels = REQUEST_TYPE_LABELS;
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly selectedAttachment = signal<File | null>(null);
  readonly selectedAttachmentPreview = signal('');
  readonly editingId = signal<string | null>(null);
  readonly quoteActionId = signal<string | null>(null);
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
      const requestIds = requests.map((request) => request.id);
      const quotes = requestIds.length
        ? await firstValueFrom(this.quotesService.list({ requestIds }))
        : [];

      this.requests.set(requests);
      this.quotes.set(quotes);
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'No pudimos cargar tus solicitudes.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  editRequest(request: PrintRequest): void {
    this.editingId.set(request.id);
    this.successMessage.set('');
    this.selectedAttachment.set(null);
    this.selectedAttachmentPreview.set(
      request.attachment_kind === 'IMAGE' ? request.attachment_url ?? '' : ''
    );
    this.form.patchValue({
      title: request.title,
      description: request.description ?? '',
      request_type: request.request_type
    });
  }

  resetForm(): void {
    this.editingId.set(null);
    this.selectedAttachment.set(null);
    this.selectedAttachmentPreview.set('');
    this.form.reset({
      title: '',
      description: '',
      request_type: 'GENERAL_3D'
    });
  }

  onAttachmentSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.errorMessage.set('');
    this.successMessage.set('');

    if (!file) {
      return;
    }

    const isStl = file.name.toLowerCase().endsWith('.stl');
    const isAllowedType = this.allowedAttachmentTypes.includes(file.type) || isStl;

    if (!isAllowedType) {
      this.errorMessage.set('Sube una imagen PNG, JPG, WEBP o un archivo STL.');
      input.value = '';
      return;
    }

    if (file.size > this.maxAttachmentSize) {
      this.errorMessage.set('El archivo no debe pesar mas de 20 MB.');
      input.value = '';
      return;
    }

    this.selectedAttachment.set(file);
    this.selectedAttachmentPreview.set(file.type.startsWith('image/') ? URL.createObjectURL(file) : '');
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
        const attachmentPayload = await this.buildAttachmentPayload(this.editingId()!);
        await firstValueFrom(
          this.requestsService.update(this.editingId()!, { ...payload, ...attachmentPayload })
        );
        this.successMessage.set('La solicitud se actualizo correctamente.');
      } else {
        const createPayload: PrintRequestPayload = {
          ...payload,
          status: 'PENDING'
        };
        const [createdRequest] = await firstValueFrom(this.requestsService.create(createPayload));

        if (createdRequest && this.selectedAttachment()) {
          const attachmentPayload = await this.buildAttachmentPayload(createdRequest.id);
          await firstValueFrom(this.requestsService.update(createdRequest.id, attachmentPayload));
        }

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

  async cancelRequest(request: PrintRequest): Promise<void> {
    if (!window.confirm(`Deseas cancelar la solicitud "${request.title}"?`)) {
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      await firstValueFrom(this.requestsService.update(request.id, { status: 'CANCELED' }));
      this.successMessage.set('La solicitud se cancelo correctamente.');

      if (this.editingId() === request.id) {
        this.resetForm();
      }

      await this.loadRequests();
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'No pudimos cancelar la solicitud.'));
    }
  }

  async acceptQuote(quote: Quote): Promise<void> {
    if (!window.confirm('Deseas aceptar esta cotizacion y crear el pedido?')) {
      return;
    }

    this.quoteActionId.set(quote.id);
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      await firstValueFrom(this.quotesService.acceptQuote(quote.id));
      this.successMessage.set('Cotizacion aceptada. Tu pedido se creo correctamente.');
      await this.loadRequests();
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'No pudimos aceptar la cotizacion.'));
    } finally {
      this.quoteActionId.set(null);
    }
  }

  async rejectQuote(quote: Quote): Promise<void> {
    if (!window.confirm('Deseas rechazar esta cotizacion?')) {
      return;
    }

    this.quoteActionId.set(quote.id);
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      await firstValueFrom(this.quotesService.rejectQuote(quote.id));
      this.successMessage.set('Cotizacion rechazada correctamente.');
      await this.loadRequests();
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'No pudimos rechazar la cotizacion.'));
    } finally {
      this.quoteActionId.set(null);
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

  attachmentKind(file: File): 'IMAGE' | 'STL' {
    return file.name.toLowerCase().endsWith('.stl') ? 'STL' : 'IMAGE';
  }

  quoteForRequest(requestId: string): Quote | undefined {
    return this.quotes().find((quote) => quote.request_id === requestId);
  }

  canEditRequest(request: PrintRequest): boolean {
    return request.status === 'PENDING';
  }

  canCancelRequest(request: PrintRequest): boolean {
    return ['IN_REVIEW', 'QUOTED'].includes(request.status);
  }

  private async buildAttachmentPayload(requestId: string): Promise<Partial<PrintRequestPayload>> {
    const file = this.selectedAttachment();

    if (!file) {
      return {};
    }

    const upload = this.requestsService.uploadAttachment(requestId, file);
    await firstValueFrom(upload.request);

    return {
      attachment_url: `${upload.url}?v=${Date.now()}`,
      attachment_name: file.name,
      attachment_type: this.requestsService.getAttachmentContentType(file),
      attachment_kind: this.attachmentKind(file)
    };
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
