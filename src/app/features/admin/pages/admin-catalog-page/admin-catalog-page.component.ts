import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-admin-catalog-page',
  templateUrl: './admin-catalog-page.component.html',
  styleUrl: './admin-catalog-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminCatalogPageComponent {}
