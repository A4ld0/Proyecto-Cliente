import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-client-requests-page',
  templateUrl: './client-requests-page.component.html',
  styleUrl: './client-requests-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientRequestsPageComponent {}
