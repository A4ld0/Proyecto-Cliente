import { signal, Type } from '@angular/core';
import { of } from 'rxjs';
import { client, failure, fileSelected, mount, order, quote, realtime, request } from '../../../testing/fixtures';
import { AuthService, OrdersService, QuotesService, RequestsService, SupabaseService } from '../../core/services';
import { Order, PrintRequest, Quote, User } from '../../interfaces';
import { ClientDashboardPageComponent } from './pages/client-dashboard-page/client-dashboard-page.component';
import { ClientOrdersPageComponent } from './pages/client-orders-page/client-orders-page.component';
import { ClientProfilePageComponent } from './pages/client-profile-page/client-profile-page.component';

const delivered: Order = { ...order, status: 'DELIVERED' };

async function openOrderOverview<T>(pageType: Type<T>, signedIn = true) {
  const requests = realtime<PrintRequest>('requests');
  const quotes = realtime<Quote>('quotes');
  const orders = realtime<Order>('orders');
  const currentUser = signal<User | null>(signedIn ? client : null);
  const listRequests = vi.fn(() => of([request]));
  const listOrders = vi.fn(() => of([delivered]));
  const listQuotes = vi.fn(() => of([quote]));
  const fixture = await mount(pageType, [
    { provide: AuthService, useValue: { currentUser } },
    { provide: RequestsService, useValue: {
      list: listRequests, watchClientRequests: requests.watchForUser, removeRealtimeChannel: requests.remove
    } },
    { provide: OrdersService, useValue: {
      list: listOrders, watchClientOrders: orders.watchForUser, removeRealtimeChannel: orders.remove
    } },
    { provide: QuotesService, useValue: {
      list: listQuotes, watchQuotes: quotes.watch, removeRealtimeChannel: quotes.remove
    } }
  ]);
  return { fixture, page: fixture.componentInstance, requests, quotes, orders, listRequests, listOrders, listQuotes };
}

describe('Panel del cliente', () => {
  it('carga los indicadores del usuario y omite la consulta de cotizaciones si no hay solicitudes', async () => {
    const { page, listRequests, listQuotes, listOrders } = await openOrderOverview(ClientDashboardPageComponent);
    expect(listRequests).toHaveBeenCalledWith({ clientId: client.id });
    expect(listOrders).toHaveBeenCalledWith({ clientId: client.id });
    expect(listQuotes).toHaveBeenCalledWith({ requestIds: [request.id] });
    expect(page.activeRequests()).toBe(1);
    expect(page.deliveredOrders()).toBe(1);
    expect(page.totalSpent()).toBe(quote.price_total);

    listRequests.mockReturnValueOnce(of([]));
    await page.loadData();
    expect(listQuotes).toHaveBeenCalledTimes(1);
    expect(page.totalSpent()).toBe(0);
    listOrders.mockReturnValueOnce(failure('No se pudo consultar el panel'));
    await page.loadData();
    expect(page.errorMessage()).toBe('No se pudo consultar el panel');
    expect(page.isLoading()).toBe(false);
  });

  it('exige iniciar sesión antes de consultar o suscribirse', async () => {
    const { page, orders, listRequests } = await openOrderOverview(ClientDashboardPageComponent, false);
    expect(page.errorMessage()).toContain('Inicia sesion');
    expect(page.isLoading()).toBe(false);
    expect(listRequests).not.toHaveBeenCalled();
    expect(orders.watchForUser).not.toHaveBeenCalled();
  });

  it('actualiza los indicadores y mantiene fuera las cotizaciones ajenas', async () => {
    const { fixture, page, requests, quotes, orders } = await openOrderOverview(ClientDashboardPageComponent);
    expect(orders.watchForUser).toHaveBeenCalledWith(client.id, expect.any(Function));
    expect(requests.watchForUser).toHaveBeenCalledWith(client.id, expect.any(Function));
    const secondRequest = { ...request, id: 'request-2' };
    const secondQuote = { ...quote, id: 'quote-2', request_id: secondRequest.id };
    const secondOrder = { ...order, id: 'order-2', quote_id: secondQuote.id };
    quotes.insert(secondQuote);
    expect(page.quotes()).toEqual([quote]);
    orders.insert(secondOrder);
    requests.insert(secondRequest);
    quotes.insert(secondQuote);
    orders.update({ ...secondOrder, status: 'DELIVERED' });
    requests.update({ ...secondRequest, status: 'CLOSED' });
    quotes.update({ ...quote, price_total: 200 });
    expect(page.deliveredOrders()).toBe(2);
    expect(page.activeRequests()).toBe(1);
    expect(page.totalSpent()).toBe(380);

    orders.insert({ ...order, id: '' });
    requests.insert({ ...request, id: '' });
    quotes.insert({ ...quote, id: '' });
    orders.delete();
    requests.delete();
    quotes.delete();
    expect(page.orders()).toHaveLength(2);
    expect(page.requests()).toHaveLength(2);
    expect(page.quotes()).toHaveLength(2);
    requests.delete(secondRequest.id);
    quotes.delete(quote.id);
    orders.delete(order.id);
    expect(page.quotes()).toEqual([]);
    expect(page.deliveredOrders()).toBe(1);
    expect(page.totalSpent()).toBe(0);

    fixture.destroy();
    for (const stream of [orders, requests, quotes]) {
      expect(stream.remove).toHaveBeenCalledWith(stream.channel);
    }
  });
});

describe('Pedidos del cliente', () => {
  it('muestra resumen, título y cotización de sus pedidos y tolera vínculos faltantes', async () => {
    const { page, listOrders, listRequests, listQuotes } = await openOrderOverview(ClientOrdersPageComponent);
    expect(listOrders).toHaveBeenCalledWith({ clientId: client.id });
    expect(page.totalAmount()).toBe(quote.price_total);
    expect(page.quoteStatus(quote.id)).toBe('SENT');
    expect(page.quoteStatus('unknown')).toBeNull();
    expect(page.requestTitleFromQuote(quote.id)).toBe(request.title);
    expect(page.requestTitleFromQuote('unknown')).toBe('unknown');
    expect(['CANCELED', 'QUEUE', 'DELIVERED'].map((status) => page.statusClass(status)))
      .toEqual(['danger', 'warn', '']);
    listRequests.mockReturnValueOnce(of([]));
    await page.loadOrders();
    expect(listQuotes).toHaveBeenCalledTimes(1);
    expect(page.totalAmount()).toBe(0);
    listOrders.mockReturnValueOnce(failure('Sin acceso a pedidos'));
    await page.loadOrders();
    expect(page.errorMessage()).toBe('Sin acceso a pedidos');
    expect(page.isLoading()).toBe(false);
  });

  it('recibe pedidos en tiempo real y se desuscribe al salir', async () => {
    const { fixture, page, orders } = await openOrderOverview(ClientOrdersPageComponent);
    const second = { ...order, id: 'order-2' };
    orders.insert(second);
    orders.update({ ...second, status: 'READY' });
    orders.insert({ ...second, id: '' });
    orders.delete();
    expect(page.orders().map(({ status }) => status)).toEqual(['READY', 'DELIVERED']);
    orders.delete(order.id);
    expect(page.orders()).toHaveLength(1);
    fixture.destroy();
    expect(orders.remove).toHaveBeenCalledWith(orders.channel);
  });

  it('no consulta los pedidos de un visitante', async () => {
    const { page, listOrders, orders } = await openOrderOverview(ClientOrdersPageComponent, false);
    expect(page.errorMessage()).toContain('Inicia sesion');
    expect(listOrders).not.toHaveBeenCalled();
    expect(orders.watchForUser).not.toHaveBeenCalled();
  });
});

describe('Perfil del cliente', () => {
  afterEach(() => vi.unstubAllGlobals());

  async function open(profile: User | null = client) {
    const currentUser = signal<User | null>(profile);
    const updateCurrentUser = vi.fn().mockResolvedValue(profile);
    const storage = {
      uploadStorageObject: vi.fn(() => of({})),
      getPublicStorageUrl: vi.fn((_bucket: string, path: string) => `https://storage.example.test/${path}`)
    };
    const fixture = await mount(ClientProfilePageComponent, [
      { provide: AuthService, useValue: { currentUser, updateCurrentUser } },
      { provide: SupabaseService, useValue: storage }
    ]);
    fixture.detectChanges();
    return { fixture, page: fixture.componentInstance, currentUser, updateCurrentUser, storage };
  }

  function previewUrls() {
    const revoke = vi.fn();
    vi.stubGlobal('URL', Object.assign(class extends URL {}, {
      createObjectURL: vi.fn(() => 'blob:avatar'),
      revokeObjectURL: revoke
    }));
    return revoke;
  }

  it('carga datos protegidos y guarda solo campos editables, después de validarlos', async () => {
    const { page, updateCurrentUser } = await open();
    expect(page.getInitials()).toBe('CD');
    expect(page.form.controls.email.value).toBe(client.email);
    expect(page.form.controls.email.disabled).toBe(true);
    page.form.controls.full_name.setValue('');
    await page.submit();
    expect(page.hasFieldError('full_name')).toBe(true);
    expect(page.getFieldError('full_name')).toContain('nombre');
    expect(page.getFieldError('unknown')).toBe('');
    page.form.patchValue({ full_name: 'Nombre cambiado', phone: '12345678' });
    updateCurrentUser.mockRejectedValueOnce(new Error('Sin conexión'));
    await page.submit();
    expect(page.errorMessage()).toBe('Sin conexión');
    await page.submit();
    expect(updateCurrentUser).toHaveBeenLastCalledWith({ full_name: 'Nombre cambiado', phone: '12345678' });
    expect(page.successMessage()).toContain('actualizaron correctamente');
    expect(page.isSaving()).toBe(false);
  });

  it('omite cargas sin usuario o archivo y valida formato y tamaño', async () => {
    const { page, currentUser, storage } = await open(null);
    expect(page.getInitials()).toBe('');
    page.onAvatarSelected(fileSelected());
    await page.uploadAvatar();
    currentUser.set(client);
    await page.uploadAvatar();
    page.onAvatarSelected(fileSelected(new File(['pdf'], 'photo.pdf', { type: 'application/pdf' })));
    expect(page.errorMessage()).toContain('JPG, PNG o WEBP');
    page.onAvatarSelected(fileSelected(new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'big.jpg', { type: 'image/jpeg' })));
    expect(page.errorMessage()).toContain('2 MB');
    expect(storage.uploadStorageObject).not.toHaveBeenCalled();
  });

  it.each([['image/png', 'png'], ['image/webp', 'webp'], ['image/jpeg', 'jpg']])(
    'sube y asocia un avatar %s con su extensión',
    async (mime, extension) => {
      const revoke = previewUrls();
      const { fixture, page, storage, updateCurrentUser } = await open({ ...client, email: null, avatar_url: 'https://old.example.test/avatar' });
      expect(page.avatarPreviewUrl()).toContain('old.example.test');
      const file = new File(['photo'], 'photo', { type: mime });
      page.onAvatarSelected(fileSelected(file));
      fixture.detectChanges();
      expect(page.avatarPreviewUrl()).toBe('blob:avatar');
      const path = `${client.id}/profile.${extension}`;
      await page.uploadAvatar();
      expect(storage.uploadStorageObject).toHaveBeenCalledWith('avatars', path, file);
      expect(updateCurrentUser).toHaveBeenCalledWith({ avatar_url: expect.stringContaining(`/${path}?v=`) });
      expect(revoke).toHaveBeenCalledWith('blob:avatar');
      expect(page.selectedAvatarFile()).toBeNull();
    }
  );

  it('conserva el avatar seleccionado para reintentar y revoca la vista previa al salir', async () => {
    const revoke = previewUrls();
    const { fixture, page, storage, updateCurrentUser } = await open();
    const file = new File(['photo'], 'photo.png', { type: 'image/png' });
    page.onAvatarSelected(fileSelected(file));
    storage.uploadStorageObject.mockReturnValueOnce(failure('No se pudo subir'));
    await page.uploadAvatar();
    expect(page.errorMessage()).toBe('No se pudo subir');
    expect(page.selectedAvatarFile()).toBe(file);
    expect(page.isUploadingAvatar()).toBe(false);
    expect(updateCurrentUser).not.toHaveBeenCalled();
    fixture.destroy();
    expect(revoke).toHaveBeenCalledWith('blob:avatar');
  });
});
