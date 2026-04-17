export type RequestStatus =
  | 'PENDING'
  | 'IN_REVIEW'
  | 'QUOTED'
  | 'CANCELED'
  | 'CLOSED';

export type RequestType = 'CUTTER' | 'GENERAL_3D';

export interface PrintRequest {
  id: string;
  client_id: string;
  title: string;
  description?: string | null;
  request_type: RequestType;
  status: RequestStatus;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface PrintRequestPayload {
  title: string;
  description?: string | null;
  request_type: RequestType;
  status: RequestStatus;
  client_id: string;
}
