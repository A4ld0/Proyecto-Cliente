import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { environment } from '../../../../../environments/environment';
import { AuthService, CartService, QuotesService, RequestsService, SupabaseService } from '../../../../core/services';
import { PrintRequest, Quote, User } from '../../../../interfaces';
import { ClientRequestsPageComponent } from './client-requests-page.component';

describe('Integración de solicitudes del cliente', () => {
  const cartKey = 'printlab.catalog.cart';
  const restUrl = `${environment.supabase.url}/rest/v1`;
  const user: User = {
    id: 'client-1',
    full_name: 'Cliente de prueba',
    role: 'CLIENT',
    is_active: true
  };
  const item = { name: 'Organizador', material: 'PLA', color: 'Negro', priceFrom: 120 };
  let cart: CartService;
  let http: HttpTestingController;
  let fixture: ComponentFixture<ClientRequestsPageComponent>;

  function expectRequestsList() {
    const request = http.expectOne(
      (candidate) => candidate.method === 'GET' && candidate.url === `${restUrl}/requests`
    );
    expect(request.request.params.get('client_id')).toBe(`eq.${user.id}`);
    return request;
  }

  beforeEach(async () => {
    localStorage.removeItem(cartKey);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { currentUser: signal(user) } }
      ]
    });
    http = TestBed.inject(HttpTestingController);
    cart = TestBed.inject(CartService);
    cart.addItem(item);

    const supabase = TestBed.inject(SupabaseService);
    vi.spyOn(TestBed.inject(RequestsService), 'watchClientRequests')
      .mockReturnValue(supabase.channel('test-requests'));
    vi.spyOn(TestBed.inject(QuotesService), 'watchQuotes')
      .mockReturnValue(supabase.channel('test-quotes'));

    fixture = TestBed.createComponent(ClientRequestsPageComponent);
    expectRequestsList().flush([]);
    await fixture.whenStable();
  });

  afterEach(() => {
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
    expectRequestsList().flush([quotedRequest]);
    await Promise.resolve();

    const quote: Quote = {
      id: 'quote-1',
      request_id: request.id,
      admin_id: 'admin-1',
      price_total: 150,
      status: 'SENT'
    };
    const quotes = http.expectOne(
      (candidate) => candidate.method === 'GET' && candidate.url === `${restUrl}/quotes`
    );
    expect(quotes.request.params.get('request_id')).toBe(`in.(${request.id})`);
    quotes.flush([quote]);
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
});
