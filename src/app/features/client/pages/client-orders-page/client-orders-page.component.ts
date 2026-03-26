import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-client-orders-page',
  templateUrl: './client-orders-page.component.html',
  styleUrl: './client-orders-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientOrdersPageComponent {}
