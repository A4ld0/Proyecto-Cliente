export type OrderStatus = 'CREATED' | 'PAID' | 'PRINTING' | 'READY' | 'DELIVERED' | 'CANCELLED';

export interface Order {
  id: string;
  request_id: string;
  client_id: string;
  status: OrderStatus;
  quantity: number;
  total: number;
  notes?: string | null;
  created_at?: string | null;
}

export interface OrderPayload {
  request_id: string;
  client_id: string;
  status: OrderStatus;
  quantity: number;
  total: number;
  notes?: string | null;
}
