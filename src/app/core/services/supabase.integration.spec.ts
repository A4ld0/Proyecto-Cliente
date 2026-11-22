import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RealtimeChannel } from '@supabase/supabase-js';
import { firstValueFrom, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { client, order, product, quote, request } from '../../../testing/fixtures';
import { CatalogService } from './catalog.service';
import { OrdersService } from './orders.service';
import { QuotesService } from './quotes.service';
import { RequestsService } from './requests.service';
import { SupabaseService } from './supabase.service';
import { UsersService } from './users.service';

describe('Integración de servicios con las rutas de Supabase', () => {
  const api = environment.supabase.url;
  const rest = `${api}/rest/v1`;
  let supabase: SupabaseService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    supabase = TestBed.inject(SupabaseService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    http.verify();
  });

  async function roundTrip<T>(
    response: Observable<T>, method: string, url: string, data: T, inspect?: (pending: TestRequest) => void
  ): Promise<void> {
    const result = firstValueFrom(response);
    const pending = http.expectOne((candidate) => candidate.method === method && candidate.url === url);
    inspect?.(pending);
    pending.flush(data as object);
    await expect(result).resolves.toEqual(data);
  }

  it('codifica filtros, orden, campos y límite y usa las credenciales de la sesión al estar disponibles', async () => {
    expect(supabase.isConfigured).toBe(true);
    await roundTrip(supabase.select('profiles'), 'GET', `${rest}/profiles`, [client], ({ request: pending }) => {
      expect(pending.params.get('select')).toBe('*');
      expect(pending.headers.get('Authorization')).toBe(`Bearer ${environment.supabase.anonKey}`);
    });
    supabase.setAccessToken('session-token');
    await roundTrip(supabase.select('profiles', {
      select: 'id,role',
      filters: [
        { column: 'id', operator: 'in', value: ['a', 'b'] },
        { column: 'role', operator: 'neq', value: 'ADMIN' }
      ],
      order: { column: 'id' },
      limit: 2
    }), 'GET', `${rest}/profiles`, [client], ({ request: pending }) => {
      expect(pending.params.get('select')).toBe('id,role');
      expect(pending.params.get('id')).toBe('in.(a,b)');
      expect(pending.params.get('role')).toBe('neq.ADMIN');
      expect(pending.params.get('order')).toBe('id.asc');
      expect(pending.params.get('limit')).toBe('2');
      expect(pending.headers.get('Authorization')).toBe('Bearer session-token');
    });
  });

  it('consulta y actualiza perfiles, reporta ausencia y usa upsert por identificador', async () => {
    const users = TestBed.inject(UsersService);
    await roundTrip(users.list(), 'GET', `${rest}/profiles`, [client], ({ request: pending }) => {
      expect(pending.params.get('order')).toBe('created_at.desc');
    });

    const byEmail = firstValueFrom(users.getByEmail(client.email!));
    const filtered = http.expectOne((candidate) => candidate.params.has('email'));
    expect(filtered.request.params.get('email')).toBe(`eq.${client.email}`);
    expect(filtered.request.params.get('limit')).toBe('1');
    filtered.flush([client]);
    await expect(byEmail).resolves.toEqual(client);

    const absent = firstValueFrom(users.getByEmail('no-user@example.test'));
    http.expectOne((candidate) => candidate.params.has('email')).flush([]);
    await expect(absent).resolves.toBeNull();
    const unknownId = firstValueFrom(users.getById('missing'));
    http.expectOne((candidate) => candidate.params.get('id') === 'eq.missing').flush([]);
    await expect(unknownId).resolves.toBeNull();

    await roundTrip(users.upsert(client), 'POST', `${rest}/profiles`, [client], ({ request: pending }) => {
      expect(pending.params.get('on_conflict')).toBe('id');
      expect(pending.headers.get('Prefer')).toContain('resolution=merge-duplicates');
      expect(pending.body).toEqual(client);
    });
    await roundTrip(users.update(client.id, { is_active: false }), 'PATCH', `${rest}/profiles`, [client], ({ request: pending }) => {
      expect(pending.params.get('id')).toBe(`eq.${client.id}`);
      expect(pending.body).toEqual({ is_active: false });
    });
  });

  it('consulta pedidos, solicitudes y cotizaciones con y sin los filtros que se reciben', async () => {
    const orders = TestBed.inject(OrdersService);
    const requests = TestBed.inject(RequestsService);
    const quotes = TestBed.inject(QuotesService);
    await roundTrip(orders.list({ clientId: client.id }), 'GET', `${rest}/orders`, [order], ({ request: pending }) => {
      expect(pending.params.get('client_id')).toBe(`eq.${client.id}`);
    });
    await roundTrip(orders.list(), 'GET', `${rest}/orders`, [order], ({ request: pending }) => {
      expect(pending.params.has('client_id')).toBe(false);
    });
    await roundTrip(requests.list(), 'GET', `${rest}/requests`, [request], ({ request: pending }) => {
      expect(pending.params.has('client_id')).toBe(false);
    });
    await roundTrip(quotes.list({ requestIds: [] }), 'GET', `${rest}/quotes`, [quote], ({ request: pending }) => {
      expect(pending.params.has('request_id')).toBe(false);
    });
    await roundTrip(quotes.list(), 'GET', `${rest}/quotes`, [quote]);
  });

  it('escribe cotizaciones y pedidos y acota las eliminaciones de solicitudes y pedidos por ID', async () => {
    const orders = TestBed.inject(OrdersService);
    const requests = TestBed.inject(RequestsService);
    const quotes = TestBed.inject(QuotesService);
    await roundTrip(quotes.create(quote), 'POST', `${rest}/quotes`, [quote], ({ request: pending }) => {
      expect(pending.body).toEqual(quote);
      expect(pending.headers.get('Prefer')).toBe('return=representation');
    });
    await roundTrip(quotes.update(quote.id, { status: 'SENT' }), 'PATCH', `${rest}/quotes`, [quote], ({ request: pending }) => {
      expect(pending.params.get('id')).toBe(`eq.${quote.id}`);
    });
    await roundTrip(orders.create(order), 'POST', `${rest}/orders`, [order], ({ request: pending }) => {
      expect(pending.body).toEqual(order);
    });
    await roundTrip(orders.update(order.id, { status: 'READY' }), 'PATCH', `${rest}/orders`, [order], ({ request: pending }) => {
      expect(pending.body).toEqual({ status: 'READY' });
      expect(pending.params.get('id')).toBe(`eq.${order.id}`);
    });
    await roundTrip(orders.delete(order.id), 'DELETE', `${rest}/orders`, [order], ({ request: pending }) => {
      expect(pending.params.get('id')).toBe(`eq.${order.id}`);
    });
    await roundTrip(requests.delete(request.id), 'DELETE', `${rest}/requests`, [request], ({ request: pending }) => {
      expect(pending.params.get('id')).toBe(`eq.${request.id}`);
    });
  });

  it('filtra disponibilidad pública y escribe o elimina productos específicos en catálogo', async () => {
    const catalog = TestBed.inject(CatalogService);
    const url = `${rest}/catalog_products`;
    await roundTrip(catalog.list({ activeOnly: true }), 'GET', url, [product], ({ request: pending }) => {
      expect(pending.params.get('is_active')).toBe('eq.true');
    });
    await roundTrip(catalog.list(), 'GET', url, [product], ({ request: pending }) => {
      expect(pending.params.has('is_active')).toBe(false);
    });
    await roundTrip(catalog.create(product), 'POST', url, [product], ({ request: pending }) => {
      expect(pending.body).toEqual(product);
    });
    await roundTrip(catalog.update(product.id, { is_active: false }), 'PATCH', url, [product], ({ request: pending }) => {
      expect(pending.params.get('id')).toBe(`eq.${product.id}`);
      expect(pending.body).toEqual({ is_active: false });
    });
    await roundTrip(catalog.delete(product.id), 'DELETE', url, [product], ({ request: pending }) => {
      expect(pending.params.get('id')).toBe(`eq.${product.id}`);
    });
  });

  it('sube las imágenes con extensión y MIME correctos y genera la URL del mismo objeto', async () => {
    const catalog = TestBed.inject(CatalogService);
    const timestamp = 1767225600000;
    vi.spyOn(Date, 'now').mockReturnValue(timestamp);
    supabase.setAccessToken('storage-token');
    for (const [type, extension] of [['image/png', 'png'], ['image/webp', 'webp'], ['image/jpeg', 'jpg']]) {
      const file = new File(['sample'], 'test-image', { type });
      const object = `catalog-products/${product.id}/${timestamp}.${extension}`;
      const withUrl = catalog.uploadProductImageWithUrl(product.id, file);
      expect(withUrl.url).toBe(`${api}/storage/v1/object/public/${object}`);
      expect(catalog.getProductImageUrl(product.id, file)).toBe(withUrl.url);
      const url = `${api}/storage/v1/object/${object}`;
      await roundTrip(withUrl.request, 'PUT', url, {}, ({ request: pending }) => {
        expect(pending.body).toBe(file);
        expect(pending.headers.get('Content-Type')).toBe(type);
        expect(pending.headers.get('Authorization')).toBe('Bearer storage-token');
        expect(pending.headers.get('x-upsert')).toBe('true');
      });
      await roundTrip(catalog.uploadProductImage(product.id, file), 'PUT', url, {});
    }
    const image = new File(['sample'], 'Mi Foto.PNG', { type: 'image/png' });
    expect(TestBed.inject(RequestsService).getAttachmentContentType(image)).toBe('image/png');
  });

  it('construye las peticiones de registro, perfil OAuth y autorización de Google', async () => {
    const metadata = { name: client.full_name };
    await roundTrip(supabase.signUp(client.email!, 'demo-password', metadata), 'POST', `${api}/auth/v1/signup`, {}, ({ request: pending }) => {
      expect(pending.body).toEqual({ email: client.email, password: 'demo-password', data: metadata });
    });
    await roundTrip(supabase.signUp(client.email!, 'demo-password'), 'POST', `${api}/auth/v1/signup`, {}, ({ request: pending }) => {
      expect(pending.body).toEqual({ email: client.email, password: 'demo-password' });
    });
    await roundTrip(supabase.getAuthUser('oauth-token'), 'GET', `${api}/auth/v1/user`, client, ({ request: pending }) => {
      expect(pending.headers.get('Authorization')).toBe('Bearer oauth-token');
    });
    const redirect = 'https://app.example.test/auth/callback?from=home';
    const authorize = new URL(supabase.getOAuthUrl('google', redirect));
    expect(authorize.pathname).toBe('/auth/v1/authorize');
    expect(authorize.searchParams.get('provider')).toBe('google');
    expect(authorize.searchParams.get('redirect_to')).toBe(redirect);
  });

  it('suscribe los cambios de las tablas correctas y filtra por cliente donde corresponde', () => {
    const channel = { on: vi.fn(), subscribe: vi.fn() };
    channel.on.mockReturnValue(channel);
    channel.subscribe.mockReturnValue(channel);
    const handle = channel as unknown as RealtimeChannel;
    const createChannel = vi.spyOn(supabase, 'channel').mockReturnValue(handle);
    const removeChannel = vi.spyOn(supabase, 'removeChannel').mockImplementation(() => undefined);
    const orders = TestBed.inject(OrdersService);
    const requests = TestBed.inject(RequestsService);
    const quotes = TestBed.inject(QuotesService);
    const listener = vi.fn();
    const streams = [
      ['orders', `client-orders-${client.id}`, `client_id=eq.${client.id}`, () => orders.watchClientOrders(client.id, listener)],
      ['orders', 'admin-orders', undefined, () => orders.watchAllOrders(listener)],
      ['requests', `client-requests-${client.id}`, `client_id=eq.${client.id}`, () => requests.watchClientRequests(client.id, listener)],
      ['requests', 'admin-requests', undefined, () => requests.watchAllRequests(listener)],
      ['quotes', 'quotes', undefined, () => quotes.watchQuotes(listener)]
    ] as const;
    for (const [table, topic, filter, subscribe] of streams) {
      expect(subscribe()).toBe(handle);
      expect(createChannel).toHaveBeenLastCalledWith(topic);
      expect(channel.on).toHaveBeenLastCalledWith(
        'postgres_changes',
        { event: '*', schema: 'public', table, ...(filter ? { filter } : {}) },
        listener
      );
    }
    expect(channel.subscribe).toHaveBeenCalledTimes(streams.length);
    orders.removeRealtimeChannel(handle);
    requests.removeRealtimeChannel(handle);
    quotes.removeRealtimeChannel(handle);
    expect(removeChannel.mock.calls).toEqual([[handle], [handle], [handle]]);
  });
});
