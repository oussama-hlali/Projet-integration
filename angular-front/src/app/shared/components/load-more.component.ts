import { Component, computed, input, output } from '@angular/core';

/**
 * PB-28 — "load more" control shared by every long list.
 *
 * Shows how much of the list is visible and disappears on its own once
 * everything is revealed, so pages don't need their own progress logic.
 */
@Component({
  selector: 'app-load-more',
  template: `
    @if (total() > 0) {
      <div class="load-more">
        <p class="load-more__count" aria-live="polite">
          Showing {{ shown() }} of {{ total() }}
        </p>

        @if (hasMore()) {
          <button type="button" class="load-more__btn" (click)="loadMore.emit()">
            {{ label() }}
            <span class="load-more__remaining">({{ remaining() }} more)</span>
          </button>
        }
      </div>
    }
  `,
  styles: [
    `
      .load-more {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
        gap: var(--space-3);
        padding: var(--space-4) 0 var(--space-2);
      }

      .load-more__count {
        margin: 0;
        color: var(--color-text-muted);
        font-size: var(--font-size-sm);
      }

      .load-more__btn {
        min-height: 44px;
        padding: var(--space-2) var(--space-5);
        color: var(--color-accent-text);
        background: var(--color-accent-soft);
        border: 1px solid color-mix(in srgb, var(--color-accent) 40%, transparent);
        border-radius: var(--radius-full);
        cursor: pointer;
        transition:
          background-color var(--transition-fast),
          color var(--transition-fast);
      }

      .load-more__btn:hover {
        color: var(--color-accent-contrast);
        background: var(--color-accent);
      }

      .load-more__remaining {
        color: inherit;
        opacity: 0.75;
        font-size: var(--font-size-xs);
      }
    `,
  ],
})
export class LoadMoreComponent {
  total = input.required<number>();
  visible = input.required<number>();
  label = input('Load more');

  loadMore = output<void>();

  readonly shown = computed(() => Math.min(this.visible(), this.total()));
  readonly remaining = computed(() => Math.max(0, this.total() - this.visible()));
  readonly hasMore = computed(() => this.remaining() > 0);
}
