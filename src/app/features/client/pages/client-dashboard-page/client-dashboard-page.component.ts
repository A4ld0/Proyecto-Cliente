import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-client-dashboard-page',
  templateUrl: './client-dashboard-page.component.html',
  styleUrl: './client-dashboard-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientDashboardPageComponent {}
