import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services';
import { getApiErrorMessage } from '../../../../core/utils/api-error.util';

@Component({
  selector: 'app-auth-callback-page',
  templateUrl: './auth-callback-page.component.html',
  styleUrl: './auth-callback-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthCallbackPageComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly errorMessage = signal('');

  constructor() {
    void this.completeSignIn();
  }

  private async completeSignIn(): Promise<void> {
    try {
      const user = await this.authService.completeOAuthSignIn(
        window.location.hash || window.location.search
      );
      await this.router.navigateByUrl(
        user.role === 'ADMIN' ? '/admin/dashboard' : '/client/dashboard'
      );
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'No pudimos completar el acceso con Google.'));
    }
  }
}
