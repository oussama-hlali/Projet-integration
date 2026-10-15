import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavigationItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  readonly collapsed = input(false);
  readonly closeRequested = output<void>();

  protected readonly navigation: NavigationItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'dashboard' },
    { label: 'Rooms', route: '/rooms', icon: 'rooms' },
    { label: 'Reservations', route: '/reservations', icon: 'calendar' },
    { label: 'Events', route: '/events', icon: 'events' },
    { label: 'Announcements', route: '/announcements', icon: 'megaphone' },
    { label: 'Transport', route: '/transport', icon: 'transport' },
    { label: 'Cafeteria', route: '/cafeteria', icon: 'cafeteria' },
    { label: 'Lost & Found', route: '/lost-found', icon: 'search' },
  ];

  protected requestClose(): void {
    this.closeRequested.emit();
  }

  protected closeMobileMenu(): void {
    this.closeRequested.emit();
  }
}
