import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Sign in · Smart Campus',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },

  {
    path: 'dashboard',
    title: 'Dashboard · Smart Campus',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'rooms',
    title: 'Rooms · Smart Campus',
    canActivate: [authGuard],
    loadComponent: () => import('./features/rooms/rooms').then((m) => m.Rooms),
  },
  {
    path: 'reservations',
    title: 'Reservations · Smart Campus',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/reservations/reservations').then((m) => m.Reservations),
  },
  {
    path: 'events',
    title: 'Events · Smart Campus',
    canActivate: [authGuard],
    loadComponent: () => import('./features/events/events').then((m) => m.Events),
  },
  {
    path: 'announcements',
    title: 'Announcements · Smart Campus',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/announcements/announcements').then((m) => m.Announcements),
  },
  {
    path: 'transport',
    title: 'Transport · Smart Campus',
    canActivate: [authGuard],
    loadComponent: () => import('./features/transport/transport').then((m) => m.Transport),
  },
  {
    path: 'cafeteria',
    title: 'Cafeteria · Smart Campus',
    canActivate: [authGuard],
    loadComponent: () => import('./features/cafeteria/cafeteria').then((m) => m.Cafeteria),
  },
  {
    path: 'lost-found',
    title: 'Lost & Found · Smart Campus',
    canActivate: [authGuard],
    loadComponent: () => import('./features/lost-found/lost-found').then((m) => m.LostFound),
  },
  {
    path: 'notifications',
    title: 'Notifications · Smart Campus',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/notifications/notifications').then((m) => m.Notifications),
  },
  {
    path: 'profile',
    title: 'Profile · Smart Campus',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile/profile').then((m) => m.Profile),
  },
  {
    path: 'admin',
    title: 'Admin · Smart Campus',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/admin').then((m) => m.Admin),
  },
  {
    path: 'admin/rooms',
    title: 'Admin · Rooms',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/rooms/admin-rooms').then((m) => m.AdminRooms),
  },
  {
    path: 'admin/events',
    title: 'Admin · Events',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/events/admin-events').then((m) => m.AdminEvents),
  },
  {
    path: 'admin/announcements',
    title: 'Admin · Announcements',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin/announcements/admin-announcements').then(
        (m) => m.AdminAnnouncements,
      ),
  },
  {
    path: 'admin/users',
    title: 'Admin · Users',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/users/admin-users').then((m) => m.AdminUsers),
  },
  {
    path: '**',
    title: 'Page not found · Smart Campus',
    loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFound),
  },
];
