import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-admin-users-page',
  templateUrl: './admin-users-page.component.html',
  styleUrl: './admin-users-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminUsersPageComponent {}
