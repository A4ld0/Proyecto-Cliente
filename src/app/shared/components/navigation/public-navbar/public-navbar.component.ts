import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-public-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './public-navbar.component.html',
  styleUrl: './public-navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PublicNavbarComponent {}
