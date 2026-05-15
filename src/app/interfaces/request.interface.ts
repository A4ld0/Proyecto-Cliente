export type RequestStatus =
  | 'PENDING'
  | 'IN_REVIEW'
  | 'QUOTED'
  | 'CANCELED'
  | 'CLOSED';

export type RequestType = 'CUTTER' | 'GENERAL_3D';
export type RequestAttachmentKind = 'IMAGE' | 'STL';

export interface PrintRequest {
  id: string;
  client_id: string;
  title: string;
  description?: string | null;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_type?: string | null;
  attachment_kind?: RequestAttachmentKind | null;
  request_type: RequestType;
  status: RequestStatus;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface PrintRequestPayload {
  title: string;
  description?: string | null;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_type?: string | null;
  attachment_kind?: RequestAttachmentKind | null;
  request_type: RequestType;
  status: RequestStatus;
  client_id: string;
}
