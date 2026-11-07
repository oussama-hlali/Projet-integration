import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TabNavComponent } from '../tab-nav/tab-nav';

/**
 * Floating glass header: brand pill, pill tab rail and account tools.
 *
 * Sticky at the top of the scrolling document so it floats over the wall.
 */
@Component({
  selector: 'app-topbar',
  imports: [RouterLink, TabNavComponent],
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss',
})
export class Topbar {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected get roleLabel(): string {
    return this.auth.isAdmin() ? 'Administrator' : 'Student';
  }

  protected async logout(): Promise<void> {
    this.auth.logout();
    await this.router.navigateByUrl('/login');
  }
}
