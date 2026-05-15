import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { USER_ROLE_LABELS } from '../../../../core/constants/printlab.constants';
import { AuthService } from '../../../../core/services';

@Component({
  selector: 'app-public-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './public-navbar.component.html',
  styleUrl: './public-navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PublicNavbarComponent {
  private readonly authService = inject(AuthService);

  readonly currentUser = this.authService.currentUser;
  readonly isAuthenticated = this.authService.isAuthenticated;
  readonly dashboardLink = computed(() =>
    this.currentUser()?.role === 'ADMIN' ? '/admin/dashboard' : '/client/dashboard'
  );
  readonly roleLabels = USER_ROLE_LABELS;

  async signOut(): Promise<void> {
    await this.authService.signOut();
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }
}
