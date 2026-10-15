import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { Topbar } from '../topbar/topbar';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, Sidebar, Topbar],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
})
export class AppShell {
  protected readonly sidebarCollapsed = signal(false);
  protected readonly mobileMenuOpen = signal(false);

  protected toggleSidebar(): void {
    this.sidebarCollapsed.update((collapsed) => !collapsed);
  }

  protected openMobileMenu(): void {
    this.mobileMenuOpen.set(true);
  }

  protected closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }
}
