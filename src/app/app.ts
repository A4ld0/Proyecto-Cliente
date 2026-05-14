import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  constructor() {
    void this.completeRootOAuthRedirect();
  }

  private async completeRootOAuthRedirect(): Promise<void> {
    if (window.location.pathname.endsWith('/auth/callback')) {
      return;
    }

    const callbackPayload = window.location.hash || window.location.search;

    if (!this.hasOAuthPayload(callbackPayload)) {
      return;
    }

    try {
      const user = await this.authService.completeOAuthSignIn(callbackPayload);
      window.history.replaceState({}, document.title, '/auth/callback');
      await this.router.navigateByUrl(
        user.role === 'ADMIN' ? '/admin/dashboard' : '/client/dashboard'
      );
    } catch (error) {
      this.storeOAuthError(error);
      window.history.replaceState({}, document.title, '/login');
      await this.router.navigateByUrl('/login');
    }
  }

  private hasOAuthPayload(fragmentOrQuery: string): boolean {
    return ['access_token=', 'error=', 'error_description=', 'code='].some((key) =>
      fragmentOrQuery.includes(key)
    );
  }

  private storeOAuthError(error: unknown): void {
    if (typeof sessionStorage === 'undefined') {
      return;
    }

    const message =
      error instanceof Error ? error.message : 'No pudimos completar el acceso con Google.';
    sessionStorage.setItem('printlab.oauthError', message);
  }
}
