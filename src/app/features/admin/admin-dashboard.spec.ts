import { of } from 'rxjs';
import { admin, client, failure, mount, order, quote, realtime, request } from '../../../testing/fixtures';
import { OrdersService, QuotesService, RequestsService, UsersService } from '../../core/services';
import { Order, PrintRequest, Quote } from '../../interfaces';
import { AdminDashboardPageComponent } from './pages/admin-dashboard-page/admin-dashboard-page.component';

describe('Indicadores de administración', () => {
  async function open() {
    const requests = realtime<PrintRequest>('requests');
    const quotes = realtime<Quote>('quotes');
    const orders = realtime<Order>('orders');
    const canceled: Order = { ...order, id: 'canceled', status: 'CANCELED' };
    const users = { list: vi.fn(() => of([admin, client])) };
    const fixture = await mount(AdminDashboardPageComponent, [
      { provide: UsersService, useValue: users },
      { provide: RequestsService, useValue: {
        list: () => of([request, { ...request, id: 'closed', status: 'CLOSED' }]),
        watchAllRequests: requests.watch, removeRealtimeChannel: requests.remove
      } },
      { provide: QuotesService, useValue: {
        list: () => of([quote]), watchQuotes: quotes.watch, removeRealtimeChannel: quotes.remove
      } },
      { provide: OrdersService, useValue: {
        list: () => of([order, canceled]), watchAllOrders: orders.watch, removeRealtimeChannel: orders.remove
      } }
    ]);
    return { fixture, page: fixture.componentInstance, requests, quotes, orders, users };
  }

  it('calcula clientes, solicitudes activas, cotizaciones pendientes y ventas sin cancelaciones', async () => {
    const { page, users } = await open();
    expect(page.clientsCount()).toBe(1);
    expect(page.activeRequests()).toBe(1);
    expect(page.pendingQuotes()).toBe(1);
    expect(page.totalSales()).toBe(quote.price_total);
    expect(page.quoteTotal('missing')).toBe(0);
    users.list.mockReturnValueOnce(failure('Sin acceso al resumen'));
    await page.loadData();
    expect(page.errorMessage()).toBe('Sin acceso al resumen');
    expect(page.isLoading()).toBe(false);
  });

  it('refleja altas, actualizaciones y bajas de las tres tablas sin duplicar registros', async () => {
    const { fixture, page, requests, quotes, orders } = await open();
    const secondRequest = { ...request, id: 'request-2' };
    const secondQuote: Quote = { ...quote, id: 'quote-2', request_id: secondRequest.id, price_total: 50 };
    const secondOrder = { ...order, id: 'order-2', quote_id: secondQuote.id };
    requests.insert(secondRequest);
    quotes.insert(secondQuote);
    orders.insert(secondOrder);
    expect(page.activeRequests()).toBe(2);
    expect(page.totalSales()).toBe(230);

    requests.update({ ...secondRequest, status: 'CLOSED' });
    quotes.update({ ...secondQuote, status: 'ACCEPTED', price_total: 75 });
    orders.update({ ...secondOrder, status: 'READY' });
    expect(page.activeRequests()).toBe(1);
    expect(page.pendingQuotes()).toBe(1);
    expect(page.totalSales()).toBe(255);
    expect(page.orders()).toHaveLength(3);

    requests.delete();
    quotes.delete();
    orders.delete();
    expect(page.totalSales()).toBe(255);
    requests.delete(secondRequest.id);
    expect(page.quotes().map((row) => row.id)).toEqual([quote.id]);
    orders.delete(order.id);
    quotes.delete(quote.id);
    expect(page.totalSales()).toBe(0);
    expect(page.pendingQuotes()).toBe(0);

    fixture.destroy();
    for (const stream of [requests, quotes, orders]) {
      expect(stream.watch).toHaveBeenCalledTimes(1);
      expect(stream.remove).toHaveBeenCalledExactlyOnceWith(stream.channel);
    }
  });
});
