import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService, SupabaseService } from '../services';

function isExpiredJwtError(error: unknown): boolean {
  if (!(error instanceof HttpErrorResponse)) {
    return false;
  }

  const message = typeof error.error === 'string' ? error.error : JSON.stringify(error.error ?? {});
  return error.status === 401 && message.toLowerCase().includes('jwt expired');
}

export const authSessionInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  const supabaseService = inject(SupabaseService);
  const isAuthEndpoint = request.url.includes('/auth/v1/token') || request.url.includes('/auth/v1/logout');

  return next(request).pipe(
    catchError((error) => {
      if (!isExpiredJwtError(error) || isAuthEndpoint) {
        return throwError(() => error);
      }

      return from(authService.refreshSessionIfNeeded(true)).pipe(
        switchMap((session) => {
          if (!session) {
            return throwError(() => error);
          }

          const retriedRequest = request.clone({
            setHeaders: {
              Authorization: `Bearer ${supabaseService.getAccessToken() ?? session.accessToken}`
            }
          });

          return next(retriedRequest);
        })
      );
    })
  );
};
