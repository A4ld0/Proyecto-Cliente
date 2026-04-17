import { User } from './user.interface';

export interface SupabaseAuthUser {
  id: string;
  email?: string;
}

export interface SupabaseAuthResponse {
  access_token?: string;
  refresh_token?: string;
  user?: SupabaseAuthUser;
}

export interface AppSession {
  accessToken: string;
  refreshToken?: string;
  user: User;
}
