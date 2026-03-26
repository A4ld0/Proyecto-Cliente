import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'landing'
      },
      {
        path: 'landing',
        loadComponent: () =>
          import('./features/landing/pages/landing-page/landing-page.component').then(
            (m) => m.LandingPageComponent
          )
      },
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/pages/login-page/login-page.component').then(
            (m) => m.LoginPageComponent
          )
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/pages/register-page/register-page.component').then(
            (m) => m.RegisterPageComponent
          )
      },
      {
        path: 'client/dashboard',
        loadComponent: () =>
          import('./features/client/pages/client-dashboard-page/client-dashboard-page.component').then(
            (m) => m.ClientDashboardPageComponent
          )
      },
      {
        path: 'client/requests',
        loadComponent: () =>
          import('./features/client/pages/client-requests-page/client-requests-page.component').then(
            (m) => m.ClientRequestsPageComponent
          )
      },
      {
        path: 'client/orders',
        loadComponent: () =>
          import('./features/client/pages/client-orders-page/client-orders-page.component').then(
            (m) => m.ClientOrdersPageComponent
          )
      },
      {
        path: 'client/profile',
        loadComponent: () =>
          import('./features/client/pages/client-profile-page/client-profile-page.component').then(
            (m) => m.ClientProfilePageComponent
          )
      },
      {
        path: 'admin/dashboard',
        loadComponent: () =>
          import('./features/admin/pages/admin-dashboard-page/admin-dashboard-page.component').then(
            (m) => m.AdminDashboardPageComponent
          )
      },
      {
        path: 'admin/requests',
        loadComponent: () =>
          import('./features/admin/pages/admin-requests-page/admin-requests-page.component').then(
            (m) => m.AdminRequestsPageComponent
          )
      },
      {
        path: 'admin/orders',
        loadComponent: () =>
          import('./features/admin/pages/admin-orders-page/admin-orders-page.component').then(
            (m) => m.AdminOrdersPageComponent
          )
      },
      {
        path: 'admin/catalog',
        loadComponent: () =>
          import('./features/admin/pages/admin-catalog-page/admin-catalog-page.component').then(
            (m) => m.AdminCatalogPageComponent
          )
      },
      {
        path: 'admin/users',
        loadComponent: () =>
          import('./features/admin/pages/admin-users-page/admin-users-page.component').then(
            (m) => m.AdminUsersPageComponent
          )
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'landing'
  }
];
