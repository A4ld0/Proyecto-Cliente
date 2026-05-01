import { OrderStatus, QuoteStatus, RequestStatus, RequestType, UserRole } from '../../interfaces';

export const USER_ROLES: UserRole[] = ['ADMIN', 'CLIENT'];
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  CLIENT: 'Cliente'
};

export const REQUEST_STATUSES: RequestStatus[] = [
  'PENDING',
  'IN_REVIEW',
  'QUOTED',
  'CANCELED',
  'CLOSED'
];
export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  PENDING: 'Pendiente',
  IN_REVIEW: 'En revision',
  QUOTED: 'Cotizada',
  CANCELED: 'Cancelada',
  CLOSED: 'Cerrada'
};

export const ORDER_STATUSES: OrderStatus[] = [
  'QUEUE',
  'PRINTING',
  'POSTPROCESS',
  'READY',
  'DELIVERED',
  'CANCELED'
];
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  QUEUE: 'En cola',
  PRINTING: 'En impresion',
  POSTPROCESS: 'Postproceso',
  READY: 'Listo para entrega',
  DELIVERED: 'Entregado',
  CANCELED: 'Cancelado'
};

export const REQUEST_TYPES: RequestType[] = ['CUTTER', 'GENERAL_3D'];
export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  CUTTER: 'Corte laser',
  GENERAL_3D: 'Impresion 3D general'
};

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  DRAFT: 'Borrador',
  SENT: 'Enviada',
  ACCEPTED: 'Aceptada',
  REJECTED: 'Rechazada',
  EXPIRED: 'Vencida'
};

export const QUOTE_STATUSES: QuoteStatus[] = ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'];
