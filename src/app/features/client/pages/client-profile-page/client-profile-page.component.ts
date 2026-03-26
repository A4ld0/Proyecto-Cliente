import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-client-profile-page',
  templateUrl: './client-profile-page.component.html',
  styleUrl: './client-profile-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientProfilePageComponent {}
