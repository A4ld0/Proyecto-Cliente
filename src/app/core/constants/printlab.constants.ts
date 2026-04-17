import { OrderStatus, RequestStatus, UserRole } from '../../interfaces';

export const USER_ROLES: UserRole[] = ['ADMIN', 'CLIENT'];
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  CLIENT: 'Cliente'
};

export const REQUEST_STATUSES: RequestStatus[] = [
  'PENDING',
  'IN_REVIEW',
  'APPROVED',
  'REJECTED',
  'IN_PROGRESS',
  'DONE'
];
export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  PENDING: 'Pendiente',
  IN_REVIEW: 'En revision',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
  IN_PROGRESS: 'En produccion',
  DONE: 'Completada'
};

export const ORDER_STATUSES: OrderStatus[] = [
  'CREATED',
  'PAID',
  'PRINTING',
  'READY',
  'DELIVERED',
  'CANCELLED'
];
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  CREATED: 'Creado',
  PAID: 'Pagado',
  PRINTING: 'En impresion',
  READY: 'Listo para entrega',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado'
};

export const MATERIAL_OPTIONS = ['PLA', 'ABS', 'PETG', 'Resina', 'TPU'];
