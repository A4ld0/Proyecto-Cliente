import { signal } from '@angular/core';
import { of } from 'rxjs';
import { admin, client, failure, mount, order, quote, realtime, request } from '../../../testing/fixtures';
import { AuthService, OrdersService, QuotesService, RequestsService, UsersService } from '../../core/services';
import { Order, PrintRequest, Quote, User } from '../../interfaces';
import { AdminOrdersPageComponent } from './pages/admin-orders-page/admin-orders-page.component';
import { AdminRequestsPageComponent } from './pages/admin-requests-page/admin-requests-page.component';

const otherRequest: PrintRequest = { ...request, id: 'request-2', status: 'CLOSED' };
const otherQuote: Quote = { ...quote, id: 'quote-2', request_id: otherRequest.id, status: 'ACCEPTED' };
const otherOrder: Order = { ...order, id: 'order-2', quote_id: otherQuote.id };

describe('Solicitudes y cotizaciones de administración', () => {
  async function open() {
    const requestEvents = realtime<PrintRequest>('requests');
    const quoteEvents = realtime<Quote>('quotes');
    const currentUser = signal<User | null>(admin);
    const requests = {
      list: vi.fn(() => of([request, otherRequest])),
      update: vi.fn(),
      watchAllRequests: requestEvents.watch,
      removeRealtimeChannel: requestEvents.remove
    };
    const quotes = {
      list: vi.fn(() => of([otherQuote])),
      create: vi.fn(() => of([quote])),
      update: vi.fn(() => of([otherQuote])),
      watchQuotes: quoteEvents.watch,
      removeRealtimeChannel: quoteEvents.remove
    };
    const fixture = await mount(AdminRequestsPageComponent, [
      { provide: AuthService, useValue: { currentUser } },
      { provide: RequestsService, useValue: requests },
      { provide: QuotesService, useValue: quotes },
      { provide: UsersService, useValue: { list: () => of([client]) } }
    ]);
    return { fixture, page: fixture.componentInstance, requests, quotes, currentUser, requestEvents, quoteEvents };
  }

  it('revisa una solicitud pendiente y crea una cotización con precio y plazo', async () => {
    const { page, requests, quotes } = await open();
    requests.update.mockReturnValueOnce(of([{ ...request, status: 'IN_REVIEW' }])).mockReturnValue(of([]));
    await page.openQuoteForm(request);
    expect(requests.update).toHaveBeenCalledWith(request.id, { status: 'IN_REVIEW' });
    expect(page.quotingRequest()?.status).toBe('IN_REVIEW');
    expect(page.requestClientName(client.id)).toBe(client.full_name);
    expect(page.requestClientName('unknown')).toBe('unknown');

    await page.submitQuote();
    expect(page.hasQuoteFieldError('price_total')).toBe(true);
    expect(page.getQuoteFieldError('price_total')).toContain('total cotizado');
    expect(page.getQuoteFieldError('unknown')).toBe('');
    expect(quotes.create).not.toHaveBeenCalled();

    page.quoteForm.patchValue({ price_total: 240, estimated_days: 3, notes: 'Incluye acabado' });
    await page.submitQuote();
    expect(quotes.create).toHaveBeenCalledWith({
      request_id: request.id, admin_id: admin.id, material_id: null, price_total: 240,
      estimated_days: 3, notes: 'Incluye acabado', status: 'SENT'
    });
    expect(requests.update).toHaveBeenLastCalledWith(request.id, { status: 'QUOTED' });
    expect(page.quotingRequestId()).toBeNull();
    expect(page.successMessage()).toContain('creo correctamente');
  });

  it('edita la cotización existente sin reabrir una solicitud cerrada', async () => {
    const { page, requests, quotes } = await open();
    await page.openQuoteForm(otherRequest);
    expect(page.editingQuoteId()).toBe(otherQuote.id);
    expect(page.quoteForm.controls.price_total.value).toBe(otherQuote.price_total);
    page.quoteForm.controls.price_total.setValue(210);
    await page.submitQuote();
    expect(quotes.update).toHaveBeenCalledWith(otherQuote.id, expect.objectContaining({
      price_total: 210, estimated_days: null, notes: null
    }));
    expect(requests.update).not.toHaveBeenCalled();
    expect(page.successMessage()).toContain('actualizo correctamente');
  });

  it('conserva el formulario cuando falla la escritura y exige un administrador y una solicitud', async () => {
    const { page, requests, quotes, currentUser } = await open();
    page.quoteForm.controls.price_total.setValue(180);
    await page.submitQuote();
    expect(page.errorMessage()).toContain('Selecciona una solicitud');
    requests.update.mockReturnValueOnce(failure('No se pudo iniciar revisión')).mockReturnValue(of([]));
    await page.openQuoteForm(request);
    expect(page.errorMessage()).toBe('No se pudo iniciar revisión');
    await page.openQuoteForm(request);
    expect(page.quotingRequest()?.status).toBe('PENDING');
    page.quoteForm.controls.price_total.setValue(180);
    currentUser.set(null);
    await page.submitQuote();
    expect(quotes.create).not.toHaveBeenCalled();
    currentUser.set(admin);
    quotes.create.mockReturnValueOnce(failure('Error de escritura'));
    await page.submitQuote();
    expect(page.errorMessage()).toBe('Error de escritura');
    expect(page.quotingRequest()?.id).toBe(request.id);
    expect(page.isSavingQuote()).toBe(false);
    requests.list.mockReturnValueOnce(failure('Sin conexión'));
    await page.loadData();
    expect(page.isLoading()).toBe(false);
    expect(page.errorMessage()).toBe('Sin conexión');
  });

  it('reconcilia solicitudes y cotizaciones en tiempo real y cierra ambas suscripciones', async () => {
    const { page, fixture, requestEvents, quoteEvents } = await open();
    const inserted = { ...request, id: 'request-3' };
    requestEvents.insert(inserted);
    requestEvents.update({ ...inserted, status: 'IN_REVIEW' });
    quoteEvents.insert(quote);
    quoteEvents.update({ ...quote, status: 'REJECTED' });
    expect(page.requests()[0].status).toBe('IN_REVIEW');
    expect(page.quoteForRequest(request.id)?.status).toBe('REJECTED');
    requestEvents.delete();
    quoteEvents.delete();
    expect(page.requests()).toHaveLength(3);
    requestEvents.delete(request.id);
    expect(page.quoteForRequest(request.id)).toBeUndefined();
    quoteEvents.delete(otherQuote.id);
    expect(page.quotes()).toEqual([]);
    expect(['CANCELED', 'PENDING', 'QUOTED'].map((status) =>
      page.statusClass(status as PrintRequest['status']))).toEqual(['danger', 'warn', '']);
    expect(['EXPIRED', 'DRAFT', 'ACCEPTED'].map((status) =>
      page.quoteStatusClass(status as Quote['status']))).toEqual(['danger', 'warn', '']);
    fixture.destroy();
    expect(requestEvents.remove).toHaveBeenCalledWith(requestEvents.channel);
    expect(quoteEvents.remove).toHaveBeenCalledWith(quoteEvents.channel);
  });
});

describe('Pedidos de administración', () => {
  afterEach(() => vi.restoreAllMocks());

  async function open() {
    const events = realtime<Order>('orders');
    const accepted: Quote = { ...quote, status: 'ACCEPTED' };
    const pending: Quote = { ...quote, id: 'quote-pending' };
    const orders = {
      list: vi.fn(() => of([otherOrder])),
      create: vi.fn(() => of([order])),
      update: vi.fn(() => of([order])),
      delete: vi.fn(() => of([order])),
      watchAllOrders: events.watch,
      removeRealtimeChannel: events.remove
    };
    const fixture = await mount(AdminOrdersPageComponent, [
      { provide: OrdersService, useValue: orders },
      { provide: QuotesService, useValue: { list: () => of([accepted, otherQuote, pending]) } },
      { provide: RequestsService, useValue: { list: () => of([request, otherRequest]) } },
      { provide: UsersService, useValue: { list: () => of([client]) } }
    ]);
    return { fixture, page: fixture.componentInstance, orders, events, accepted, pending };
  }

  it('preselecciona una cotización aceptada que no tenga pedido y guarda el cliente asociado', async () => {
    const { page, orders, accepted, pending } = await open();
    expect(page.availableQuotes()).toEqual([accepted]);
    expect(page.form.controls.client_id.value).toBe(client.id);
    expect(page.requestTitleFromQuote(quote.id)).toBe(request.title);
    expect(page.requestTitleFromQuote('missing')).toBe('missing');
    expect(page.clientName(client.id)).toBe(client.full_name);
    expect(page.clientName('missing')).toBe('missing');
    expect(page.quoteTotal(quote.id)).toBe(quote.price_total);
    expect(page.quoteTotal('missing')).toBe(0);
    page.syncClientFromQuote('missing');
    page.form.controls.quote_id.setValue('');
    await page.submit();
    expect(page.hasFieldError('quote_id')).toBe(true);
    expect(page.getFieldError('quote_id')).toContain('Selecciona');
    expect(page.getFieldError('missing')).toBe('');
    page.form.controls.quote_id.setValue(pending.id);
    await page.submit();
    expect(orders.create).not.toHaveBeenCalled();
    expect(page.errorMessage()).toContain('cotizaciones aceptadas');
    page.form.controls.quote_id.setValue(accepted.id);
    await page.submit();
    expect(orders.create).toHaveBeenCalledWith({
      quote_id: accepted.id, client_id: client.id, status: 'QUEUE'
    });
    expect(page.successMessage()).toContain('creo correctamente');
  });

  it('actualiza un pedido existente y solo lo elimina tras confirmar', async () => {
    const { page, orders } = await open();
    page.editOrder(otherOrder);
    expect(page.availableQuotes().map((value) => value.id)).toContain(otherQuote.id);
    page.form.controls.status.setValue('DELIVERED');
    await page.submit();
    expect(orders.update).toHaveBeenCalledWith(otherOrder.id, {
      quote_id: otherQuote.id, client_id: client.id, status: 'DELIVERED'
    });
    expect(page.editingId()).toBeNull();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValue(true);
    await page.deleteOrder(otherOrder);
    expect(orders.delete).not.toHaveBeenCalled();
    page.editOrder(otherOrder);
    await page.deleteOrder(otherOrder);
    expect(confirm).toHaveBeenCalledTimes(2);
    expect(orders.delete).toHaveBeenCalledWith(otherOrder.id);
    expect(page.editingId()).toBeNull();
    expect(page.successMessage()).toContain('elimino correctamente');
  });

  it('muestra los errores de carga, guardado y eliminación sin quedar ocupado', async () => {
    const { page, orders } = await open();
    orders.create.mockReturnValueOnce(failure('Guardado fallido'));
    await page.submit();
    expect(page.errorMessage()).toBe('Guardado fallido');
    expect(page.isSaving()).toBe(false);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    orders.delete.mockReturnValueOnce(failure('Eliminación fallida'));
    await page.deleteOrder(otherOrder);
    expect(page.errorMessage()).toBe('Eliminación fallida');
    orders.list.mockReturnValueOnce(failure('Carga fallida'));
    await page.loadData();
    expect(page.errorMessage()).toBe('Carga fallida');
    expect(page.isLoading()).toBe(false);
  });

  it('actualiza pedidos en tiempo real y descarta el formulario si se elimina el pedido editado', async () => {
    const { page, fixture, events } = await open();
    events.insert(order);
    events.update({ ...order, status: 'PRINTING' });
    expect(page.orders()[0].status).toBe('PRINTING');
    page.editOrder(order);
    events.delete();
    expect(page.editingId()).toBe(order.id);
    events.delete(order.id);
    expect(page.orders()).toEqual([otherOrder]);
    expect(page.editingId()).toBeNull();
    expect(['CANCELED', 'PRINTING', 'READY'].map((status) => page.statusClass(status)))
      .toEqual(['danger', 'warn', '']);
    fixture.destroy();
    expect(events.remove).toHaveBeenCalledWith(events.channel);
  });
});
