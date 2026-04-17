export type UserRole = 'ADMIN' | 'CLIENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string | null;
  organization?: string | null;
  created_at?: string | null;
}

export interface UserPayload {
  name: string;
  email: string;
  role: UserRole;
  phone?: string | null;
  organization?: string | null;
}
