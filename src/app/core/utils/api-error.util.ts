import { HttpErrorResponse } from '@angular/common/http';

export function getApiErrorMessage(error: unknown, fallback = 'An unexpected error occurred.'): string {
  if (error instanceof HttpErrorResponse) {
    const supabaseMessage =
      error.error?.message || error.error?.msg || error.error?.error_description || error.message;

    return supabaseMessage || fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
