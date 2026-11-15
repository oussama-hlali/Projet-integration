import { computed, signal } from '@angular/core';
import { createPager, DEFAULT_PAGE_SIZE } from './pagination';

describe('createPager', () => {
  const list = (length: number) => Array.from({ length }, (_, index) => index + 1);

  it('reveals the first page only', () => {
    const pager = createPager(signal(list(10)), 4);

    expect(pager.items()).toEqual([1, 2, 3, 4]);
    expect(pager.total()).toBe(10);
    expect(pager.remaining()).toBe(6);
    expect(pager.hasMore()).toBeTrue();
  });

  it('loads the next page and stops at the end', () => {
    const pager = createPager(signal(list(7)), 3);

    pager.loadMore();
    expect(pager.items()).toEqual([1, 2, 3, 4, 5, 6]);
    expect(pager.remaining()).toBe(1);

    pager.loadMore();
    expect(pager.items()).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(pager.hasMore()).toBeFalse();

    pager.loadMore();
    expect(pager.items().length).toBe(7);
  });

  it('resets to one page', () => {
    const pager = createPager(signal(list(20)), 5);

    pager.loadMore();
    pager.loadMore();
    expect(pager.visible()).toBe(15);

    pager.reset();
    expect(pager.visible()).toBe(5);
    expect(pager.items().length).toBe(5);
  });

  it('follows the source signal when filters change', () => {
    const source = signal([1, 2, 3, 4, 5, 6]);
    const filtered = computed(() => source().filter((value) => value % 2 === 0));
    const pager = createPager(filtered, 2);

    expect(pager.items()).toEqual([2, 4]);
    expect(pager.total()).toBe(3);
    expect(pager.hasMore()).toBeTrue();

    pager.loadMore();
    expect(pager.items()).toEqual([2, 4, 6]);
    expect(pager.hasMore()).toBeFalse();
  });

  it('never uses a page size below one', () => {
    const pager = createPager(signal(list(3)), 0);

    expect(pager.items().length).toBe(1);
  });

  it('defaults to the shared page size', () => {
    const pager = createPager(signal(list(DEFAULT_PAGE_SIZE + 1)));

    expect(pager.items().length).toBe(DEFAULT_PAGE_SIZE);
    expect(pager.hasMore()).toBeTrue();
  });

  it('handles an empty source', () => {
    const pager = createPager(signal([] as number[]), 5);

    expect(pager.items()).toEqual([]);
    expect(pager.total()).toBe(0);
    expect(pager.hasMore()).toBeFalse();
  });
});
