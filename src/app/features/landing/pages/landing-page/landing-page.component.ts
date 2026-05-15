import { ChangeDetectionStrategy, Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services';

@Component({
  selector: 'app-landing-page',
  imports: [RouterLink],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LandingPageComponent implements OnDestroy {
  private readonly portfolioAutoplayDelay = 4500;
  private readonly portfolioTransitionDelay = 180;
  private portfolioAutoplayId: ReturnType<typeof setInterval> | null = null;
  private portfolioTransitionId: ReturnType<typeof setTimeout> | null = null;
  private readonly authService = inject(AuthService);

  readonly currentUser = this.authService.currentUser;
  readonly isConfigured = this.authService.isConfigured;
  readonly dashboardLink = computed(() =>
    this.currentUser()?.role === 'ADMIN' ? '/admin/dashboard' : '/client/dashboard'
  );

  readonly highlights = [
    'Solicitudes centralizadas',
    'Seguimiento de pedidos',
    'Cotizaciones organizadas'
  ];

  readonly portfolioItems = [
    {
      title: 'Figuras coleccionables',
      category: 'Miniaturas premium',
      description: 'Modelado de alto detalle con acabado listo para pintura y exhibicion.',
      image: 'assets/landing/hero-model.png',
      specs: ['Alta definicion', 'Resina gris', 'Base personalizada']
    },
    {
      title: 'Prototipos funcionales',
      category: 'Validacion de producto',
      description: 'Piezas resistentes para revisar ergonomia, ensamble y escala real.',
      image: 'assets/landing/prototype.png',
      specs: ['PLA tecnico', 'Entrega rapida', 'Iteracion guiada']
    },
    {
      title: 'Piezas bajo pedido',
      category: 'Fabricacion 3D',
      description: 'Produccion personalizada desde referencia, STL o requerimientos del cliente.',
      image: 'assets/landing/alien.webp',
      specs: ['Cotizacion clara', 'Seguimiento', 'Acabado final']
    }
  ];

  readonly activePortfolioIndex = signal(0);
  readonly isPortfolioChanging = signal(false);
  readonly activePortfolioItem = computed(() => this.portfolioItems[this.activePortfolioIndex()]);

  constructor() {
    this.startPortfolioAutoplay();
  }

  ngOnDestroy(): void {
    this.stopPortfolioAutoplay();
    this.stopPortfolioTransition();
  }

  nextPortfolioItem(): void {
    this.changePortfolioItem(
      (this.activePortfolioIndex() + 1) % this.portfolioItems.length,
      true
    );
  }

  previousPortfolioItem(): void {
    this.changePortfolioItem(
      this.activePortfolioIndex() === 0
        ? this.portfolioItems.length - 1
        : this.activePortfolioIndex() - 1,
      true
    );
  }

  selectPortfolioItem(index: number): void {
    this.changePortfolioItem(index, true);
  }

  private changePortfolioItem(index: number, shouldRestartAutoplay: boolean): void {
    if (index === this.activePortfolioIndex()) {
      if (shouldRestartAutoplay) {
        this.restartPortfolioAutoplay();
      }

      return;
    }

    this.stopPortfolioTransition();
    this.isPortfolioChanging.set(true);

    this.portfolioTransitionId = setTimeout(() => {
      this.activePortfolioIndex.set(index);
      this.isPortfolioChanging.set(false);
      this.portfolioTransitionId = null;
    }, this.portfolioTransitionDelay);

    if (shouldRestartAutoplay) {
      this.restartPortfolioAutoplay();
    }
  }

  private stopPortfolioTransition(): void {
    if (!this.portfolioTransitionId) {
      return;
    }

    clearTimeout(this.portfolioTransitionId);
    this.portfolioTransitionId = null;
    this.isPortfolioChanging.set(false);
  }

  private advancePortfolioAutoplay(): void {
    this.changePortfolioItem((this.activePortfolioIndex() + 1) % this.portfolioItems.length, false);
  }

  private startPortfolioAutoplay(): void {
    this.portfolioAutoplayId = setInterval(() => {
      this.advancePortfolioAutoplay();
    }, this.portfolioAutoplayDelay);
  }

  private stopPortfolioAutoplay(): void {
    if (!this.portfolioAutoplayId) {
      return;
    }

    clearInterval(this.portfolioAutoplayId);
    this.portfolioAutoplayId = null;
  }

  private restartPortfolioAutoplay(): void {
    this.stopPortfolioAutoplay();
    this.startPortfolioAutoplay();
  }
}
