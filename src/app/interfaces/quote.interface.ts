export type QuoteStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export interface Quote {
  id: string;
  request_id: string;
  admin_id: string;
  material_id?: string | null;
  grams?: number | null;
  print_hours?: number | null;
  price_total: number;
  estimated_days?: number | null;
  notes?: string | null;
  status: QuoteStatus;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface QuotePayload {
  request_id: string;
  admin_id: string;
  material_id?: string | null;
  grams?: number | null;
  print_hours?: number | null;
  price_total: number;
  estimated_days?: number | null;
  notes?: string | null;
  status: QuoteStatus;
}
