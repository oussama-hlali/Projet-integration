import {
  afterNextRender,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NavItem, PRIMARY_NAV } from '../../core/navigation';
import { NavIconComponent } from '../../shared/components/nav-icon.component';

interface LensBox {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly ready: boolean;
}

const EMPTY_LENS: LensBox = { x: 0, y: 0, width: 0, height: 0, ready: false };

/**
 * Pill rail with a lens that slides under the active destination.
 *
 * The lens is measured from the DOM (offsetLeft/offsetWidth) so it follows the
 * real rendered label widths, and it is re-measured on navigation, resize,
 * rail reflow and webfont load.
 */
@Component({
  selector: 'app-tab-nav',
  imports: [RouterLink, RouterLinkActive, NavIconComponent],
  templateUrl: './tab-nav.html',
  styleUrl: './tab-nav.scss',
})
export class TabNavComponent {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly track = viewChild<ElementRef<HTMLElement>>('track');

  protected readonly items: readonly NavItem[] = PRIMARY_NAV;
  protected readonly lens = signal<LensBox>(EMPTY_LENS);

  private observer: ResizeObserver | null = null;
  private frame = 0;

  constructor() {
    afterNextRender(() => {
      const track = this.track()?.nativeElement;
      if (track && typeof ResizeObserver !== 'undefined') {
        this.observer = new ResizeObserver(() => this.schedule());
        this.observer.observe(track);
      }

      this.schedule();
      void document.fonts?.ready.then(() => this.schedule());
    });

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.schedule());

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.handleResize, { passive: true });
    }

    this.destroyRef.onDestroy(() => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', this.handleResize);
      }
      this.observer?.disconnect();
      cancelAnimationFrame(this.frame);
    });
  }

  private readonly handleResize = (): void => this.schedule();

  private schedule(): void {
    // Measure synchronously first (cheap, and not dependent on a paint), then
    // again on the next frame in case the DOM changed in this tick.
    this.measure();
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => this.measure());
  }

  private measure(): void {
    const track = this.track()?.nativeElement;
    if (!track) {
      return;
    }

    const active = track.querySelector<HTMLElement>('.tab--active');
    if (!active) {
      this.lens.set(EMPTY_LENS);
      return;
    }

    this.lens.set({
      x: active.offsetLeft,
      y: active.offsetTop,
      width: active.offsetWidth,
      height: active.offsetHeight,
      ready: true,
    });

    // Only move the rail when the active tab is actually out of view.
    const viewLeft = track.scrollLeft;
    const viewRight = viewLeft + track.clientWidth;
    const tabLeft = active.offsetLeft;
    const tabRight = tabLeft + active.offsetWidth;

    if (tabRight > viewRight || tabLeft < viewLeft) {
      const centered = tabLeft - (track.clientWidth - active.offsetWidth) / 2;
      track.scrollTo({ left: Math.max(0, centered), behavior: 'smooth' });
    }
  }
}
