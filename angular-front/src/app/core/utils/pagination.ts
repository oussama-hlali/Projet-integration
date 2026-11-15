import { Signal, computed, signal } from '@angular/core';

/** Default page size for "load more" lists. */
export const DEFAULT_PAGE_SIZE = 6;

export interface Pager<T> {
  /** How many items are currently revealed. */
  readonly visible: Signal<number>;
  /** The revealed slice of the source list. */
  readonly items: Signal<readonly T[]>;
  /** Total items in the source list, filters included. */
  readonly total: Signal<number>;
  /** Items still hidden behind the button. */
  readonly remaining: Signal<number>;
  readonly hasMore: Signal<boolean>;
  loadMore(): void;
  /** Call whenever the filter changes so the list restarts at page one. */
  reset(): void;
}

/**
 * PB-28 — progressive disclosure for long lists.
 *
 * The source is expected to be a computed signal (already filtered and
 * sorted), so the same pager keeps working when filters change; `reset()`
 * simply collapses back to the first page.
 */
export function createPager<T>(
  source: Signal<readonly T[]>,
  pageSize: number = DEFAULT_PAGE_SIZE,
): Pager<T> {
  const size = Math.max(1, pageSize);
  const visible = signal(size);

  const items = computed(() => source().slice(0, visible()));
  const total = computed(() => source().length);
  const remaining = computed(() => Math.max(0, total() - items().length));
  const hasMore = computed(() => remaining() > 0);

  return {
    visible: visible.asReadonly(),
    items,
    total,
    remaining,
    hasMore,
    loadMore: () => visible.update((current) => current + size),
    reset: () => visible.set(size),
  };
}
