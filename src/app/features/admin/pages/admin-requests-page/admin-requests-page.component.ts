import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-admin-requests-page',
  templateUrl: './admin-requests-page.component.html',
  styleUrl: './admin-requests-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminRequestsPageComponent {}
