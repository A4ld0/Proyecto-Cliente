import { EnvironmentProviders, Provider, Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { throwError } from 'rxjs';
import { CatalogProduct, Order, PrintRequest, Quote, User } from '../app/interfaces';

export const client: User = {
  id: 'client-1',
  full_name: 'Cliente de prueba',
  email: 'cliente@example.test',
  role: 'CLIENT',
  is_active: true
};

export const admin: User = { ...client, id: 'admin-1', full_name: 'Administradora', role: 'ADMIN' };

export const request: PrintRequest = {
  id: 'request-1',
  client_id: client.id,
  title: 'Pieza de prueba',
  description: 'Pieza funcional para ensamblar.',
  request_type: 'GENERAL_3D',
  status: 'PENDING'
};

export const quote: Quote = {
  id: 'quote-1',
  request_id: request.id,
  admin_id: admin.id,
  price_total: 180,
  status: 'SENT'
};

export const order: Order = {
  id: 'order-1',
  client_id: client.id,
  quote_id: quote.id,
  status: 'QUEUE'
};

export const product: CatalogProduct = {
  id: 'product-1',
  name: 'Organizador',
  category: 'Hogar',
  description: 'Organizador para escritorio',
  image_url: 'https://storage.example.test/organizador.png',
  materials: ['PLA', 'PETG'],
  colors: ['Negro', 'Blanco'],
  price_from: 120,
  delivery: 'Tres días',
  tags: ['oficina'],
  is_active: true
};

export function failure(message: string) {
  return throwError(() => new Error(message));
}

export async function mount<T>(component: Type<T>, providers: (Provider | EnvironmentProviders)[]) {
  TestBed.configureTestingModule({ providers: [provideRouter([]), ...providers] });
  const fixture = TestBed.createComponent(component);
  await fixture.whenStable();
  return fixture;
}

export function fileSelected(file?: File): Event {
  const input = document.createElement('input');
  input.type = 'file';
  Object.defineProperty(input, 'files', { value: file ? [file] : [] });
  const event = new Event('change');
  Object.defineProperty(event, 'target', { value: input });
  return event;
}

export function realtime<T extends { id: string }>(table: string) {
  const channel = { topic: table } as RealtimeChannel;
  let listener: ((payload: RealtimePostgresChangesPayload<T>) => void) | undefined;
  const context = { table, schema: 'public', commit_timestamp: '2026-01-01T00:00:00Z', errors: [] };
  const watch = vi.fn((callback: (payload: RealtimePostgresChangesPayload<T>) => void) => {
    listener = callback;
    return channel;
  });
  const remove = vi.fn();

  return {
    channel,
    watch,
    watchForUser: vi.fn((_userId: string, callback: Parameters<typeof watch>[0]) => watch(callback)),
    remove,
    insert(record: T) {
      listener?.({ ...context, eventType: 'INSERT', new: record, old: {} });
    },
    update(record: T) {
      listener?.({ ...context, eventType: 'UPDATE', new: record, old: { id: record.id } as Partial<T> });
    },
    delete(id?: string) {
      listener?.({ ...context, eventType: 'DELETE', new: {}, old: (id ? { id } : {}) as Partial<T> });
    }
  };
}
