import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { environment } from '../../../../../environments/environment';
import { fileSelected, realtime } from '../../../../../testing/fixtures';
import { AuthService, CartService, QuotesService, RequestsService, SupabaseService } from '../../../../core/services';
import { Order, PrintRequest, Quote, User } from '../../../../interfaces';
import { ClientRequestsPageComponent } from './client-requests-page.component';

describe('Integración de solicitudes del cliente', () => {
  const cartKey = 'printlab.catalog.cart';
  const restUrl = `${environment.supabase.url}/rest/v1`;
  const storageUrl = `${environment.supabase.url}/storage/v1/object`;
  const user: User = {
    id: 'client-1',
    full_name: 'Cliente de prueba',
    role: 'CLIENT',
    is_active: true
  };
  const item = { name: 'Organizador', material: 'PLA', color: 'Negro', priceFrom: 120 };
  const quotedRequest: PrintRequest = {
    id: 'quoted-request',
    client_id: user.id,
    title: 'Pieza cotizada',
    request_type: 'GENERAL_3D',
    status: 'QUOTED'
  };
  const sentQuote: Quote = {
    id: 'sent-quote',
    request_id: quotedRequest.id,
    admin_id: 'admin-1',
    price_total: 150,
    status: 'SENT'
  };
  let cart: CartService;
  let http: HttpTestingController;
  let fixture: ComponentFixture<ClientRequestsPageComponent>;
  let currentUser: WritableSignal<User | null>;
  let requestEvents: ReturnType<typeof realtime<PrintRequest>>;
  let quoteEvents: ReturnType<typeof realtime<Quote>>;

  function expectRequestsList() {
    const request = http.expectOne(
      (candidate) => candidate.method === 'GET' && candidate.url === `${restUrl}/requests`
    );
    expect(request.request.params.get('client_id')).toBe(`eq.${user.id}`);
    return request;
  }

  async function respondWithQuotes(request: PrintRequest, quotes: Quote[]): Promise<void> {
    expectRequestsList().flush([request]);
    await Promise.resolve();
    const quoteList = http.expectOne(
      (candidate) => candidate.method === 'GET' && candidate.url === `${restUrl}/quotes`
    );
    expect(quoteList.request.params.get('request_id')).toBe(`in.(${request.id})`);
    quoteList.flush(quotes);
  }

  async function loadSentQuote(): Promise<void> {
    const load = fixture.componentInstance.loadRequests();
    await respondWithQuotes(quotedRequest, [sentQuote]);
    await load;
    fixture.detectChanges();
  }

  beforeEach(async () => {
    localStorage.removeItem(cartKey);
    currentUser = signal(user);
    requestEvents = realtime<PrintRequest>('requests');
    quoteEvents = realtime<Quote>('quotes');
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { currentUser } }
      ]
    });
    http = TestBed.inject(HttpTestingController);
    cart = TestBed.inject(CartService);
    cart.addItem(item);

    const supabase = TestBed.inject(SupabaseService);
    vi.spyOn(TestBed.inject(RequestsService), 'watchClientRequests')
      .mockImplementation((id, listener) => {
        requestEvents.watchForUser(id, listener);
        return supabase.channel('test-requests');
      });
    vi.spyOn(TestBed.inject(QuotesService), 'watchQuotes')
      .mockImplementation((listener) => {
        quoteEvents.watch(listener);
        return supabase.channel('test-quotes');
      });

    fixture = TestBed.createComponent(ClientRequestsPageComponent);
    expectRequestsList().flush([]);
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    http.verify();
    localStorage.removeItem(cartKey);
  });

  it('envía el borrador del carrito, recarga la lista con su cotización y limpia el carrito', async () => {
    const component = fixture.componentInstance;
    const title = 'Cotizacion catalogo: Organizador';
    expect(component.form.controls.title.value).toBe(title);

    const submission = component.submit();
    const create = http.expectOne({ method: 'POST', url: `${restUrl}/requests` });
    const description = cart.buildRequestDescription();
    expect(create.request.body).toEqual({
      client_id: user.id,
      title,
      description,
      request_type: 'GENERAL_3D',
      status: 'PENDING'
    });
    const request: PrintRequest = {
      id: 'request-1',
      client_id: user.id,
      title,
      description,
      request_type: 'GENERAL_3D',
      status: 'PENDING'
    };
    create.flush([request]);
    await Promise.resolve();

    const quotedRequest: PrintRequest = { ...request, status: 'QUOTED' };
    const quote: Quote = {
      id: 'quote-1',
      request_id: request.id,
      admin_id: 'admin-1',
      price_total: 150,
      status: 'SENT'
    };
    await respondWithQuotes(quotedRequest, [quote]);
    await submission;
    fixture.detectChanges();

    expect(component.requests()).toEqual([quotedRequest]);
    expect(component.quoteForRequest(request.id)).toEqual(quote);
    expect(component.form.controls.title.value).toBe('');
    expect(cart.items()).toEqual([]);
    expect((fixture.nativeElement as HTMLElement).textContent)
      .toContain('Tu solicitud se registro correctamente.');
  });

  it('conserva el borrador y muestra el error cuando falla la creación de la solicitud', async () => {
    const component = fixture.componentInstance;
    const submission = component.submit();
    http.expectOne({ method: 'POST', url: `${restUrl}/requests` }).flush(
      { message: 'No se pudo registrar la solicitud.' },
      { status: 500, statusText: 'Internal Server Error' }
    );
    await submission;
    fixture.detectChanges();

    expect(component.form.controls.title.value).toBe('Cotizacion catalogo: Organizador');
    expect(cart.items()).toEqual([{ ...item, quantity: 1 }]);
    expect(component.isSaving()).toBe(false);
    expect((fixture.nativeElement as HTMLElement).textContent)
      .toContain('No se pudo registrar la solicitud.');
  });

  it('acepta una cotización una sola vez mientras el pedido se está creando', async () => {
    await loadSentQuote();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const component = fixture.componentInstance;
    const acceptance = component.acceptQuote(sentQuote);
    void component.acceptQuote(sentQuote);
    void component.rejectQuote(sentQuote);
    fixture.detectChanges();

    expect(confirm).toHaveBeenCalledTimes(1);
    const buttons = (fixture.nativeElement as HTMLElement)
      .querySelectorAll<HTMLButtonElement>('.quote-actions button');
    expect(Array.from(buttons, (button) => button.disabled)).toEqual([true, true]);

    const rpc = http.expectOne({ method: 'POST', url: `${restUrl}/rpc/accept_quote` });
    expect(rpc.request.body).toEqual({ p_quote_id: sentQuote.id });
    const order: Order = {
      id: 'order-1',
      client_id: user.id,
      quote_id: sentQuote.id,
      status: 'QUEUE'
    };
    rpc.flush(order);
    await Promise.resolve();
    await respondWithQuotes({ ...quotedRequest, status: 'CLOSED' }, [{ ...sentQuote, status: 'ACCEPTED' }]);
    await acceptance;
    fixture.detectChanges();

    expect(component.quoteForRequest(quotedRequest.id)?.status).toBe('ACCEPTED');
    expect(component.quoteActionId()).toBeNull();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Tu pedido se creo correctamente.');
  });

  it('solo ejecuta el rechazo cuando el cliente confirma la decisión', async () => {
    await loadSentQuote();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValue(true);
    const component = fixture.componentInstance;

    await component.rejectQuote(sentQuote);
    expect(confirm).toHaveBeenCalledTimes(1);
    http.expectNone((request) => request.method === 'POST');
    expect(component.quoteForRequest(quotedRequest.id)?.status).toBe('SENT');

    const rejection = component.rejectQuote(sentQuote);
    const rpc = http.expectOne({ method: 'POST', url: `${restUrl}/rpc/reject_quote` });
    expect(rpc.request.body).toEqual({ p_quote_id: sentQuote.id });
    const quote: Quote = { ...sentQuote, status: 'REJECTED' };
    rpc.flush(quote);
    await Promise.resolve();
    await respondWithQuotes(quotedRequest, [quote]);
    await rejection;
    await component.acceptQuote(quote);

    expect(component.quoteForRequest(quotedRequest.id)?.status).toBe('REJECTED');
    expect(confirm).toHaveBeenCalledTimes(2);
    http.expectNone((request) => request.method === 'POST');
  });

  it('mantiene la cotización disponible si falla la aceptación y permite reintentar', async () => {
    await loadSentQuote();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const component = fixture.componentInstance;
    const firstAttempt = component.acceptQuote(sentQuote);
    const rpc = { method: 'POST', url: `${restUrl}/rpc/accept_quote` };
    http.expectOne(rpc).flush(
      { message: 'No se pudo crear el pedido.' },
      { status: 503, statusText: 'Service Unavailable' }
    );
    await firstAttempt;
    fixture.detectChanges();

    expect(component.quoteActionId()).toBeNull();
    expect(component.quoteForRequest(quotedRequest.id)?.status).toBe('SENT');
    expect((fixture.nativeElement as HTMLElement).querySelector('.alert')?.textContent)
      .toContain('No se pudo crear el pedido.');
    expect((fixture.nativeElement as HTMLElement).querySelector('.notice')).toBeNull();

    const retry = component.acceptQuote(sentQuote);
    http.expectOne(rpc).flush({
      id: 'order-1', client_id: user.id, quote_id: sentQuote.id, status: 'QUEUE'
    });
    await Promise.resolve();
    await respondWithQuotes({ ...quotedRequest, status: 'CLOSED' }, [{ ...sentQuote, status: 'ACCEPTED' }]);
    await retry;
    expect(component.quoteForRequest(quotedRequest.id)?.status).toBe('ACCEPTED');
  });

  it('evita otra decisión cuando la aceptación ya se confirmó y falla la recarga', async () => {
    await loadSentQuote();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const component = fixture.componentInstance;
    const acceptance = component.acceptQuote(sentQuote);
    http.expectOne({ method: 'POST', url: `${restUrl}/rpc/accept_quote` }).flush({
      id: 'order-1', client_id: user.id, quote_id: sentQuote.id, status: 'QUEUE'
    });
    await Promise.resolve();
    expectRequestsList().flush(null, { status: 503, statusText: 'Service Unavailable' });
    await acceptance;
    await component.rejectQuote(sentQuote);

    expect(component.quoteForRequest(quotedRequest.id)?.status).toBe('ACCEPTED');
    expect(confirm).toHaveBeenCalledTimes(1);
    http.expectNone((candidate) => candidate.method === 'POST');
  });

  it('valida el formulario y la sesión antes de enviar o consultar y permite limpiar el carrito', async () => {
    const component = fixture.componentInstance;
    component.resetForm();
    await component.submit();
    expect(component.hasFieldError('title')).toBe(true);
    expect(component.getFieldError('title')).toContain('titulo');
    expect(component.getFieldError('unknown')).toBe('');
    component.prefillFromCart();
    currentUser.set(null);
    await component.submit();
    expect(component.errorMessage()).toContain('guardar la solicitud');
    await component.loadRequests();
    expect(component.errorMessage()).toContain('administrar tus solicitudes');
    expect(component.isLoading()).toBe(false);
    http.expectNone((candidate) => candidate.url === `${restUrl}/requests`);
    component.clearCartDraft();
    component.prefillFromCart();
    expect(cart.items()).toEqual([]);
    expect(component.form.controls.title.value).toBe('');
  });

  it('conserva el borrador al editar, valida adjuntos y actualiza una solicitud existente', async () => {
    const page = fixture.componentInstance;
    const existing: PrintRequest = { ...quotedRequest, status: 'PENDING', attachment_kind: 'IMAGE' };
    page.editRequest(existing);
    expect(page.canEditRequest(existing)).toBe(true);
    expect(page.canEditRequest(quotedRequest)).toBe(false);
    expect(page.canCancelRequest(existing)).toBe(false);
    expect(page.canCancelRequest(quotedRequest)).toBe(true);
    page.prefillFromCart();
    expect(page.form.controls.title.value).toBe(existing.title);
    expect(page.selectedAttachmentPreview()).toBe('');
    page.onAttachmentSelected(fileSelected());
    page.onAttachmentSelected(fileSelected(new File(['pdf'], 'example.pdf', { type: 'application/pdf' })));
    expect(page.errorMessage()).toContain('archivo STL');
    page.onAttachmentSelected(fileSelected(new File([new Uint8Array(20 * 1024 * 1024 + 1)], 'large.stl')));
    expect(page.errorMessage()).toContain('20 MB');

    const image = new File(['image'], 'sample.png', { type: 'image/png' });
    vi.stubGlobal('URL', Object.assign(class extends URL {}, { createObjectURL: () => 'blob:reference' }));
    page.onAttachmentSelected(fileSelected(image));
    expect(page.attachmentKind(image)).toBe('IMAGE');
    expect(page.selectedAttachmentPreview()).toBe('blob:reference');
    page.form.controls.description.setValue('Descripción de la pieza modificada.');
    const submission = page.submit();
    const upload = http.expectOne((candidate) => candidate.method === 'PUT' && candidate.url.includes(existing.id));
    expect(upload.request.headers.get('Content-Type')).toBe('image/png');
    upload.flush({});
    const patch = await vi.waitFor(() => http.expectOne((candidate) => candidate.method === 'PATCH'));
    expect(patch.request.params.get('id')).toBe(`eq.${existing.id}`);
    expect(patch.request.body).toMatchObject({
      description: 'Descripción de la pieza modificada.', attachment_kind: 'IMAGE', attachment_name: image.name
    });
    patch.flush([{ ...existing, ...patch.request.body }]);
    await Promise.resolve();
    expectRequestsList().flush([]);
    await submission;
    expect(cart.itemCount()).toBe(1);
    expect(page.editingId()).toBeNull();
    expect(page.successMessage()).toContain('actualizo correctamente');
  });

  it.each([
    ['elimina', 'DELETE', 'deleteRequest'],
    ['cancela', 'PATCH', 'cancelRequest']
  ] as const)('%s únicamente si se confirma la acción y maneja fallos de la API', async (_label, method, action) => {
    const page = fixture.componentInstance;
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValue(true);
    await page[action](quotedRequest);
    http.expectNone((candidate) => candidate.method === method);
    const failed = page[action](quotedRequest);
    http.expectOne((candidate) => candidate.method === method).flush(
      { message: 'Operación rechazada.' },
      { status: 403, statusText: 'Forbidden' }
    );
    await failed;
    expect(page.errorMessage()).toBe('Operación rechazada.');
    page.editRequest(quotedRequest);
    const succeeded = page[action](quotedRequest);
    const mutation = http.expectOne((candidate) => candidate.method === method);
    expect(mutation.request.params.get('id')).toBe(`eq.${quotedRequest.id}`);
    if (method === 'PATCH') {
      expect(mutation.request.body).toEqual({ status: 'CANCELED' });
    }
    mutation.flush([quotedRequest]);
    await Promise.resolve();
    expectRequestsList().flush([]);
    await succeeded;
    expect(confirm).toHaveBeenCalledTimes(3);
    expect(page.editingId()).toBeNull();
    expect(page.successMessage()).toContain('correctamente');
  });

  it('actualiza registros por eventos y descarta cotizaciones de solicitudes ajenas', async () => {
    const page = fixture.componentInstance;
    quoteEvents.insert(sentQuote);
    expect(page.quotes()).toEqual([]);
    requestEvents.insert(quotedRequest);
    requestEvents.update({ ...quotedRequest, status: 'CANCELED' });
    const another = { ...quotedRequest, id: 'another-request' };
    requestEvents.insert(another);
    quoteEvents.insert(sentQuote);
    const secondQuote = { ...sentQuote, id: 'second-quote', request_id: another.id };
    quoteEvents.insert(secondQuote);
    quoteEvents.update({ ...sentQuote, status: 'REJECTED' });
    expect(page.quoteForRequest(quotedRequest.id)?.status).toBe('REJECTED');
    expect(page.statusClass('CANCELED')).toBe('danger');
    expect(page.statusClass('IN_REVIEW')).toBe('warn');
    expect(page.statusClass('CLOSED')).toBe('');
    requestEvents.insert({ ...quotedRequest, id: '' });
    quoteEvents.insert({ ...sentQuote, id: '' });
    requestEvents.delete();
    quoteEvents.delete();
    expect(page.requests()).toHaveLength(2);
    expect(page.quotes()).toHaveLength(2);
    requestEvents.delete(quotedRequest.id);
    quoteEvents.delete(secondQuote.id);
    expect(page.requests()).toEqual([another]);
    expect(page.quotes()).toEqual([]);
  });

  it.each(['carga', 'asociación'] as const)(
    'reintenta la %s de un STL sin duplicar la solicitud ni el archivo',
    async (failure) => {
      const component = fixture.componentInstance;
      const file = new File(['solid pieza\nendsolid pieza'], 'Pieza.STL');
      fixture.detectChanges();
      const fileInput = (fixture.nativeElement as HTMLElement)
        .querySelector<HTMLInputElement>('#attachment')!;
      Object.defineProperty(fileInput, 'files', { value: [file] });
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));

      const submission = component.submit();
      await component.submit();
      const insert = { method: 'POST', url: `${restUrl}/requests` };
      const initialInsert = http.expectOne(insert);
      const request: PrintRequest = {
        ...initialInsert.request.body,
        id: 'request-with-file'
      };
      const attachmentUrl = `${storageUrl}/request-files/${request.id}/`;
      const updateUrl = (candidate: { method: string; url: string }) =>
        candidate.method === 'PATCH' && candidate.url === `${restUrl}/requests`;
      http.expectNone(updateUrl);
      initialInsert.flush([request]);
      await Promise.resolve();

      const upload = http.expectOne((candidate) =>
        candidate.method === 'PUT' && candidate.url.startsWith(attachmentUrl)
      );
      expect(upload.request.headers.get('Content-Type')).toBe('model/stl');
      expect(upload.request.body).toBe(file);

      if (failure === 'carga') {
        upload.flush({ message: 'Carga interrumpida.' }, { status: 503, statusText: 'Service Unavailable' });
        http.expectNone(updateUrl);
      } else {
        upload.flush({});
        await Promise.resolve();
        (await vi.waitFor(() => http.expectOne(updateUrl))).flush([]);
      }
      await submission;

      expect(component.selectedAttachment()).toBe(file);
      expect(cart.itemCount()).toBe(1);
      expect(component.successMessage()).toBe('');
      expect(component.errorMessage()).toContain('La solicitud se guardó');
      const retry = component.submit();
      http.expectNone(insert);

      if (failure === 'carga') {
        const uploadRetry = http.expectOne({ method: 'PUT', url: upload.request.url });
        uploadRetry.flush({});
      } else {
        http.expectNone((candidate) => candidate.method === 'PUT');
      }

      const update = await vi.waitFor(() => http.expectOne(updateUrl));
      expect(update.request.params.get('id')).toBe(`eq.${request.id}`);
      expect(update.request.body).toMatchObject({
        attachment_name: file.name,
        attachment_type: 'model/stl',
        attachment_kind: 'STL'
      });
      expect(update.request.body.attachment_url).toContain(`/public/request-files/${request.id}/`);
      const saved = { ...request, ...update.request.body };
      update.flush([saved]);
      await Promise.resolve();
      await respondWithQuotes(saved, []);
      await retry;
      fixture.detectChanges();

      expect(component.errorMessage()).toBe('');
      expect(cart.itemCount()).toBe(0);
      expect((fixture.nativeElement as HTMLElement).querySelector('.request-attachment a')?.textContent)
        .toContain(file.name);
    }
  );
});
