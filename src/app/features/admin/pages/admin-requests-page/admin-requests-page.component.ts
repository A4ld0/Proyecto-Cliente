import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, NgZone, OnDestroy, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RealtimeChannel } from '@supabase/supabase-js';
import { firstValueFrom } from 'rxjs';
import {
  QUOTE_STATUS_LABELS,
  QUOTE_STATUSES,
  REQUEST_STATUS_LABELS,
  REQUEST_TYPE_LABELS
} from '../../../../core/constants/printlab.constants';
import {
  AuthService,
  QuoteRealtimePayload,
  QuotesService,
  RequestRealtimePayload,
  RequestsService,
  UsersService
} from '../../../../core/services';
import { getApiErrorMessage } from '../../../../core/utils/api-error.util';
import {
  getFieldErrorMessage,
  isFieldInvalid,
  ValidationMessages
} from '../../../../core/utils/form-errors.util';
import {
  PrintRequest,
  Quote,
  QuotePayload,
  QuoteStatus,
  RequestStatus,
  User
} from '../../../../interfaces';

@Component({
  selector: 'app-admin-requests-page',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-requests-page.component.html',
  styleUrl: './admin-requests-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminRequestsPageComponent implements OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly quotesService = inject(QuotesService);
  private readonly requestsService = inject(RequestsService);
  private readonly usersService = inject(UsersService);
  private readonly zone = inject(NgZone);
  private requestsChannel: RealtimeChannel | null = null;
  private quotesChannel: RealtimeChannel | null = null;

  readonly requests = signal<PrintRequest[]>([]);
  readonly quotes = signal<Quote[]>([]);
  readonly users = signal<User[]>([]);
  readonly quotingRequest = computed(() =>
    this.requests().find((request) => request.id === this.quotingRequestId())
  );
  readonly requestStatusLabels = REQUEST_STATUS_LABELS;
  readonly requestTypeLabels = REQUEST_TYPE_LABELS;
  readonly quoteStatuses = QUOTE_STATUSES;
  readonly quoteStatusLabels = QUOTE_STATUS_LABELS;
  readonly isLoading = signal(true);
  readonly isSavingQuote = signal(false);
  readonly editingQuoteId = signal<string | null>(null);
  readonly quotingRequestId = signal<string | null>(null);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly validationMessages: Record<string, ValidationMessages> = {
    status: {
      required: 'Selecciona el estado.'
    },
    price_total: {
      required: 'Ingresa el total cotizado.',
      min: 'El total debe ser mayor a cero.'
    },
    estimated_days: {
      min: 'Los dias estimados deben ser mayores a cero.'
    }
  };

  readonly quoteForm = new FormGroup({
    price_total: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(1)]
    }),
    estimated_days: new FormControl<number | null>(null, {
      validators: [Validators.min(1)]
    }),
    notes: new FormControl('', { nonNullable: true }),
    status: new FormControl('SENT', { nonNullable: true, validators: [Validators.required] })
  });

  constructor() {
    void this.loadData();
  }

  ngOnDestroy(): void {
    if (this.requestsChannel) {
      this.requestsService.removeRealtimeChannel(this.requestsChannel);
    }

    if (this.quotesChannel) {
      this.quotesService.removeRealtimeChannel(this.quotesChannel);
    }
  }

  async loadData(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const [requests, quotes, users] = await Promise.all([
        firstValueFrom(this.requestsService.list()),
        firstValueFrom(this.quotesService.list()),
        firstValueFrom(this.usersService.list())
      ]);

      this.requests.set(requests);
      this.quotes.set(quotes);
      this.users.set(users);
      this.subscribeToRealtime();
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'No pudimos cargar las solicitudes.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  requestClientName(clientId: string): string {
    return this.users().find((user) => user.id === clientId)?.full_name ?? clientId;
  }

  quoteForRequest(requestId: string): Quote | undefined {
    return this.quotes().find((quote) => quote.request_id === requestId);
  }

  async openQuoteForm(request: PrintRequest): Promise<void> {
    const existingQuote = this.quoteForRequest(request.id);

    this.quotingRequestId.set(request.id);
    this.editingQuoteId.set(existingQuote?.id ?? null);
    this.successMessage.set('');
    this.errorMessage.set('');
    this.quoteForm.reset({
      price_total: Number(existingQuote?.price_total ?? 0) || null,
      estimated_days: existingQuote?.estimated_days ?? null,
      notes: existingQuote?.notes ?? '',
      status: existingQuote?.status ?? 'SENT'
    });

    if (request.status === 'PENDING') {
      try {
        const [updatedRequest] = await firstValueFrom(
          this.requestsService.update(request.id, { status: 'IN_REVIEW' })
        );

        if (updatedRequest) {
          this.requests.update((requests) =>
            requests.map((currentRequest) =>
              currentRequest.id === updatedRequest.id ? updatedRequest : currentRequest
            )
          );
        }
      } catch (error) {
        this.errorMessage.set(getApiErrorMessage(error, 'No pudimos marcar la solicitud en revision.'));
      }
    }
  }

  closeQuoteForm(): void {
    this.quotingRequestId.set(null);
    this.editingQuoteId.set(null);
    this.quoteForm.reset({
      price_total: null,
      estimated_days: null,
      notes: '',
      status: 'SENT'
    });
  }

  async submitQuote(): Promise<void> {
    const request = this.quotingRequest();
    const admin = this.authService.currentUser();

    if (this.quoteForm.invalid) {
      this.quoteForm.markAllAsTouched();
      return;
    }

    if (!request || !admin) {
      this.errorMessage.set('Selecciona una solicitud antes de cotizar.');
      return;
    }

    this.isSavingQuote.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const rawValue = this.quoteForm.getRawValue();
    const payload: QuotePayload = {
      request_id: request.id,
      admin_id: admin.id,
      material_id: null,
      price_total: Number(rawValue.price_total),
      estimated_days: rawValue.estimated_days ? Number(rawValue.estimated_days) : null,
      notes: rawValue.notes || null,
      status: rawValue.status as QuoteStatus
    };

    try {
      if (this.editingQuoteId()) {
        await firstValueFrom(this.quotesService.update(this.editingQuoteId()!, payload));
        this.successMessage.set('La cotizacion se actualizo correctamente.');
      } else {
        await firstValueFrom(this.quotesService.create(payload));
        this.successMessage.set('La cotizacion se creo correctamente.');
      }

      if (!['CLOSED', 'CANCELED'].includes(request.status)) {
        await firstValueFrom(this.requestsService.update(request.id, { status: 'QUOTED' }));
      }

      this.closeQuoteForm();
      await this.loadData();
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'No pudimos guardar la cotizacion.'));
    } finally {
      this.isSavingQuote.set(false);
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

  quoteStatusClass(status: QuoteStatus): string {
    if (['REJECTED', 'EXPIRED'].includes(status)) {
      return 'danger';
    }

    if (['DRAFT', 'SENT'].includes(status)) {
      return 'warn';
    }

    return '';
  }

  hasQuoteFieldError(controlName: string): boolean {
    return isFieldInvalid(this.quoteForm, controlName);
  }

  getQuoteFieldError(controlName: string): string {
    return getFieldErrorMessage(
      this.quoteForm,
      controlName,
      this.validationMessages[controlName] ?? {}
    );
  }

  private subscribeToRealtime(): void {
    if (!this.requestsChannel) {
      this.requestsChannel = this.requestsService.watchAllRequests((payload) => {
        this.zone.run(() => this.applyRequestRealtimePayload(payload));
      });
    }

    if (!this.quotesChannel) {
      this.quotesChannel = this.quotesService.watchQuotes((payload) => {
        this.zone.run(() => this.applyQuoteRealtimePayload(payload));
      });
    }
  }

  private applyRequestRealtimePayload(payload: RequestRealtimePayload): void {
    if (payload.eventType === 'DELETE') {
      const deletedId = payload.old['id'];

      if (typeof deletedId === 'string') {
        this.requests.update((requests) => requests.filter((request) => request.id !== deletedId));
        this.quotes.update((quotes) => quotes.filter((quote) => quote.request_id !== deletedId));
      }

      return;
    }

    const changedRequest = payload.new as PrintRequest;

    if (!changedRequest?.id) {
      return;
    }

    this.requests.update((requests) => {
      const exists = requests.some((request) => request.id === changedRequest.id);

      if (!exists) {
        return [changedRequest, ...requests];
      }

      return requests.map((request) =>
        request.id === changedRequest.id ? changedRequest : request
      );
    });
  }

  private applyQuoteRealtimePayload(payload: QuoteRealtimePayload): void {
    if (payload.eventType === 'DELETE') {
      const deletedId = payload.old['id'];

      if (typeof deletedId === 'string') {
        this.quotes.update((quotes) => quotes.filter((quote) => quote.id !== deletedId));
      }

      return;
    }

    const changedQuote = payload.new as Quote;

    if (!changedQuote?.id) {
      return;
    }

    this.quotes.update((quotes) => {
      const exists = quotes.some((quote) => quote.id === changedQuote.id);

      if (!exists) {
        return [changedQuote, ...quotes];
      }

      return quotes.map((quote) => (quote.id === changedQuote.id ? changedQuote : quote));
    });
  }
}
