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
    if (
      window.location.pathname.endsWith('/auth/callback') ||
      !window.location.hash.includes('access_token=')
    ) {
      return;
    }

    try {
      const user = await this.authService.completeOAuthSignIn(window.location.hash);
      window.history.replaceState({}, document.title, '/auth/callback');
      await this.router.navigateByUrl(
        user.role === 'ADMIN' ? '/admin/dashboard' : '/client/dashboard'
      );
    } catch {
      window.history.replaceState({}, document.title, '/login');
      await this.router.navigateByUrl('/login');
    }
  }
}
