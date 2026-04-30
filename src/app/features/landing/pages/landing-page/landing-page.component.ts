import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services';

@Component({
  selector: 'app-landing-page',
  imports: [RouterLink],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LandingPageComponent {
  private readonly authService = inject(AuthService);

  readonly currentUser = this.authService.currentUser;
  readonly isConfigured = this.authService.isConfigured;
  readonly dashboardLink = computed(() =>
    this.currentUser()?.role === 'ADMIN' ? '/admin/dashboard' : '/client/dashboard'
  );

  readonly highlights = [
    'Solicitudes centralizadas',
    'Seguimiento de pedidos',
    'Cotizaciones organizadas'
  ];
}
