import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-admin-orders-page',
  templateUrl: './admin-orders-page.component.html',
  styleUrl: './admin-orders-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminOrdersPageComponent {}
