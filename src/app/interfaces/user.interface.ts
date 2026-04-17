export type UserRole = 'ADMIN' | 'CLIENT';

export interface User {
  id: string;
  full_name: string;
  email?: string | null;
  role: UserRole;
  phone?: string | null;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface UserPayload {
  full_name: string;
  email?: string | null;
  phone?: string | null;
  role: UserRole;
  is_active?: boolean;
}
