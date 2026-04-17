export type RequestStatus =
  | 'PENDING'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'IN_PROGRESS'
  | 'DONE';

export interface PrintRequest {
  id: string;
  title: string;
  description: string;
  material: string;
  quantity: number;
  status: RequestStatus;
  client_id: string;
  due_date?: string | null;
  created_at?: string | null;
}

export interface PrintRequestPayload {
  title: string;
  description: string;
  material: string;
  quantity: number;
  status: RequestStatus;
  client_id: string;
  due_date?: string | null;
}
