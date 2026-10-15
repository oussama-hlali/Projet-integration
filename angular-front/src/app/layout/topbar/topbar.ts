import { Component, inject, input, output } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-topbar',
  imports: [RouterLink],
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss',
})
export class Topbar {
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);
  readonly sidebarCollapsed = input(false);
  readonly menuRequested = output<void>();
  readonly collapseRequested = output<void>();

  protected get title(): string {
    const segment = this.router.url.split('?')[0].split('/').filter(Boolean).pop();
    if (!segment) return 'Dashboard';
    return segment
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  protected logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
