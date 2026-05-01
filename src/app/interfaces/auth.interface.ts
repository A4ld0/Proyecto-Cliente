import { User } from './user.interface';

export interface SupabaseAuthUser {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
  };
}

export interface SupabaseAuthResponse {
  access_token?: string;
  expires_at?: number;
  expires_in?: number;
  refresh_token?: string;
  user?: SupabaseAuthUser;
}

export interface AppSession {
  accessToken: string;
  expiresAt?: number;
  refreshToken?: string;
  user: User;
}
