export type OrderStatus =
  | 'QUEUE'
  | 'PRINTING'
  | 'POSTPROCESS'
  | 'READY'
  | 'DELIVERED'
  | 'CANCELED';

export interface Order {
  id: string;
  quote_id: string;
  client_id: string;
  status: OrderStatus;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface OrderPayload {
  quote_id: string;
  client_id: string;
  status: OrderStatus;
}
