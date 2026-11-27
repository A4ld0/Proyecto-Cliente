import type { Page } from '@playwright/test';
import type {
  CatalogProduct,
  Order,
  PrintRequest,
  PrintRequestPayload,
  Quote,
  QuotePayload,
  User
} from '../../src/app/interfaces';
import { environment } from '../../src/environments/environment';

export const testPassword = 'printlab-test-123';

export const accounts = {
  cliente: {
    id: 'system-client',
    full_name: 'Cliente de sistema',
    email: 'cliente@example.test',
    role: 'CLIENT',
    is_active: true
  },
  administrador: {
    id: 'system-admin',
    full_name: 'Administradora de sistema',
    email: 'admin@example.test',
    role: 'ADMIN',
    is_active: true
  }
} as const satisfies Record<string, User>;

const product: CatalogProduct = {
  id: 'system-product',
  name: 'Organizador de escritorio',
  category: 'Oficina',
  description: 'Organizador impreso para accesorios de escritorio.',
  image_url: '/assets/landing/organizer.png',
  materials: ['PLA', 'PETG'],
  colors: ['Negro', 'Blanco'],
  price_from: 120,
  delivery: 'Tres días',
  tags: ['Organización'],
  is_active: true
};

const cors = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, PATCH, OPTIONS',
  'access-control-allow-headers': 'apikey, authorization, content-type, prefer'
};

function token(user: User): string {
  return `test-token-${user.id}`;
}

export async function mockSupabase(page: Page) {
  const requests: PrintRequest[] = [];
  const quotes: Quote[] = [];
  const orders: Order[] = [];
  const users = Object.values(accounts);
  const supabase = new URL(environment.supabase.url);

  await page.route('https://fonts.googleapis.com/**', (route) => route.abort());
  await page.routeWebSocket((url) => url.host === supabase.host, () => undefined);
  await page.route((url) => url.origin === supabase.origin, async (route) => {
    const incoming = route.request();
    const url = new URL(incoming.url());
    const reply = (json: unknown, status = 200) => route.fulfill({ status, headers: cors, json });
    const forbidden = () => reply({ message: 'Operación no autorizada.' }, 403);
    const method = incoming.method();

    if (method === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: cors });
    }

    if (method === 'POST' && url.pathname === '/auth/v1/token') {
      const { email, password } = incoming.postDataJSON();
      const account = users.find((user) => user.email === email && password === testPassword);
      if (!account || url.searchParams.get('grant_type') !== 'password') {
        return reply({ error_description: 'Credenciales incorrectas.' }, 401);
      }
      return reply({ access_token: token(account), user: { id: account.id } });
    }

    if (method === 'GET' && url.pathname === '/rest/v1/catalog_products') {
      return reply([product]);
    }

    const auth = await incoming.headerValue('authorization');
    const user = users.find((account) => auth === `Bearer ${token(account)}`);
    if (!user) {
      return forbidden();
    }

    const visibleRequests = requests.filter(
      (request) => user.role === 'ADMIN' || request.client_id === user.id
    );

    switch (`${method} ${url.pathname}`) {
      case 'POST /auth/v1/logout':
        return reply({});
      case 'GET /rest/v1/profiles': {
        const id = url.searchParams.get('id');
        return reply(id ? users.filter((account) => id === `eq.${account.id}`) : users);
      }
      case 'GET /rest/v1/requests':
        return reply(visibleRequests);
      case 'POST /rest/v1/requests': {
        const payload: PrintRequestPayload = incoming.postDataJSON();
        if (user.role !== 'CLIENT' || payload.client_id !== user.id || payload.status !== 'PENDING') {
          return forbidden();
        }
        const request = { ...payload, id: `system-request-${requests.length + 1}` };
        requests.push(request);
        return reply([request], 201);
      }
      case 'PATCH /rest/v1/requests': {
        const request = requests.find((row) => url.searchParams.get('id') === `eq.${row.id}`);
        if (user.role !== 'ADMIN' || !request) {
          return forbidden();
        }
        request.status = incoming.postDataJSON().status;
        return reply([request]);
      }
      case 'GET /rest/v1/quotes':
        return reply(quotes.filter((quote) => visibleRequests.some((row) => row.id === quote.request_id)));
      case 'POST /rest/v1/quotes': {
        const payload: QuotePayload = incoming.postDataJSON();
        if (user.role !== 'ADMIN' || payload.admin_id !== user.id ||
            !requests.some((row) => row.id === payload.request_id)) {
          return forbidden();
        }
        const quote = { ...payload, id: `system-quote-${quotes.length + 1}` };
        quotes.push(quote);
        return reply([quote], 201);
      }
      case 'POST /rest/v1/rpc/accept_quote': {
        const { p_quote_id } = incoming.postDataJSON();
        const quote = quotes.find((row) => row.id === p_quote_id && row.status === 'SENT');
        const request = visibleRequests.find((row) => row.id === quote?.request_id);
        if (user.role !== 'CLIENT' || !quote || !request) {
          return forbidden();
        }
        quote.status = 'ACCEPTED';
        request.status = 'CLOSED';
        const order: Order = {
          id: `system-order-${orders.length + 1}`,
          quote_id: quote.id,
          client_id: user.id,
          status: 'QUEUE'
        };
        orders.push(order);
        return reply(order);
      }
      case 'POST /rest/v1/rpc/reject_quote': {
        const { p_quote_id } = incoming.postDataJSON();
        const quote = quotes.find((row) => row.id === p_quote_id && row.status === 'SENT');
        const request = visibleRequests.find((row) => row.id === quote?.request_id);
        if (user.role !== 'CLIENT' || !quote || !request) return forbidden();
        quote.status = 'REJECTED';
        return reply(quote);
      }
      case 'GET /rest/v1/orders':
        return reply(orders.filter((order) => user.role === 'ADMIN' || order.client_id === user.id));
      default:
        return reply({ message: `Ruta de prueba sin implementar: ${method} ${url.pathname}` }, 501);
    }
  });

  function seedPendingRequest(title: string): PrintRequest {
    const request: PrintRequest = {
      id: `system-request-${requests.length + 1}`,
      client_id: accounts.cliente.id,
      title,
      description: 'Pieza funcional a partir de un diseño de referencia.',
      request_type: 'GENERAL_3D',
      status: 'PENDING'
    };
    requests.push(request);
    return request;
  }

  return {
    seedPendingRequest,
    seedSentQuote(title: string) {
      const request = seedPendingRequest(title);
      request.status = 'QUOTED';
      quotes.push({
        id: `system-quote-${quotes.length + 1}`,
        request_id: request.id,
        admin_id: accounts.administrador.id,
        price_total: 180,
        estimated_days: 3,
        status: 'SENT'
      });
    }
  };
}
