import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PublicNavbarComponent } from '../../shared/components/navigation/public-navbar/public-navbar.component';
import { AppFooterComponent } from '../../shared/components/navigation/app-footer/app-footer.component';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, PublicNavbarComponent, AppFooterComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainLayoutComponent {}
