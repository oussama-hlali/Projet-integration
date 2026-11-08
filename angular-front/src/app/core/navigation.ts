/**
 * Single source of truth for the app's shell navigation.
 *
 * The header tab rail and the floating dock both read from here, so a route
 * only has to be added once to appear in both places.
 */

export type NavIconName =
  | 'dashboard'
  | 'rooms'
  | 'calendar'
  | 'events'
  | 'megaphone'
  | 'transport'
  | 'cafeteria'
  | 'search'
  | 'bell'
  | 'user'
  | 'admin'
  | 'logout';

export interface NavItem {
  readonly label: string;
  readonly route: string;
  readonly icon: NavIconName;
  /** Hidden unless the signed-in user is an `ADMINISTRATOR`. */
  readonly adminOnly?: boolean;
}

/** Destinations shown in the header tab rail, in display order. */
export const PRIMARY_NAV: readonly NavItem[] = [
  { label: 'Dashboard', route: '/dashboard', icon: 'dashboard' },
  { label: 'Rooms', route: '/rooms', icon: 'rooms' },
  { label: 'Reservations', route: '/reservations', icon: 'calendar' },
  { label: 'Events', route: '/events', icon: 'events' },
  { label: 'Announcements', route: '/announcements', icon: 'megaphone' },
  { label: 'Transport', route: '/transport', icon: 'transport' },
  { label: 'Cafeteria', route: '/cafeteria', icon: 'cafeteria' },
  { label: 'Lost & Found', route: '/lost-found', icon: 'search' },
];

/**
 * Administrator rail. Students never see these destinations and the routes
 * themselves are protected by `adminGuard`.
 */
export const ADMIN_NAV: readonly NavItem[] = [
  { label: 'Overview', route: '/admin', icon: 'dashboard' },
  { label: 'Rooms', route: '/admin/rooms', icon: 'rooms' },
  { label: 'Events', route: '/admin/events', icon: 'events' },
  { label: 'Announcements', route: '/admin/announcements', icon: 'megaphone' },
  { label: 'Reservations', route: '/admin/reservations', icon: 'calendar' },
  { label: 'Lost & Found', route: '/admin/lost-found', icon: 'search' },
  { label: 'Users', route: '/admin/users', icon: 'user' },
];

/** Account destinations shown in the floating dock. */
export const ACCOUNT_NAV: readonly NavItem[] = [
  { label: 'Notifications', route: '/notifications', icon: 'bell' },
  { label: 'Profile', route: '/profile', icon: 'user' },
  { label: 'Admin', route: '/admin', icon: 'admin', adminOnly: true },
];
