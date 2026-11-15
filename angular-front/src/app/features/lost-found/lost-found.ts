import { Component, computed, inject, signal } from '@angular/core';
import {
  LOST_FOUND_STATUSES,
  LOST_FOUND_STATUS_LABELS,
  LostFoundItem,
  LostFoundReportInput,
  LostFoundStatus,
} from '../../core/models/lost-found.model';
import { AuthService } from '../../core/services/auth.service';
import { LostFoundService } from '../../core/services/lost-found.service';
import { ToastService } from '../../core/services/toast.service';
import { UserService } from '../../core/services/user.service';
import { createPager } from '../../core/utils/pagination';
import {
  BadgeVariant,
  EmptyStateComponent,
  LoadMoreComponent,
  PageHeaderComponent,
  ReportItemComponent,
  StatCardComponent,
  StatusBadgeComponent,
  TagPerson,
} from '../../shared/components';

type StatusFilter = 'all' | LostFoundStatus;

/**
 * PB-17 — Lost & Found community.
 *
 * Students post lost or found items, tag the people involved and comment under
 * each post. The feed is backed by `LostFoundService`, so a post, a like or a
 * comment appears immediately and survives a reload.
 */
@Component({
  selector: 'app-lost-found',
  imports: [
    EmptyStateComponent,
    LoadMoreComponent,
    PageHeaderComponent,
    ReportItemComponent,
    StatCardComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './lost-found.html',
  styleUrl: './lost-found.scss',
})
export class LostFound {
  private readonly lostFoundService = inject(LostFoundService);
  private readonly users = inject(UserService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly posts = this.lostFoundService.items;
  readonly statuses = LOST_FOUND_STATUSES;
  readonly statusLabels = LOST_FOUND_STATUS_LABELS;

  readonly statusFilter = signal<StatusFilter>('all');
  readonly search = signal('');

  readonly currentUser = this.auth.currentUser;
  readonly currentUserId = computed(() => this.currentUser()?.id ?? 'u1');
  readonly currentInitials = computed(() => this.initials(this.currentUser()?.fullName ?? 'You'));
  readonly currentTone = computed(() => this.avatarTone(this.currentUserId()));

  /** Campus members that can be mentioned, excluding the author. */
  readonly tagPeople = computed<TagPerson[]>(() => {
    const me = this.currentUserId();
    return this.users
      .users()
      .filter((user) => user.id !== me)
      .map((user) => ({ id: user.id, name: user.fullName }));
  });

  readonly counts = computed<Record<StatusFilter, number>>(() => {
    const counts: Record<StatusFilter, number> = {
      all: 0,
      LOST: 0,
      FOUND: 0,
      CLAIMED: 0,
    };

    for (const post of this.posts()) {
      counts.all += 1;
      counts[post.status] += 1;
    }

    return counts;
  });

  readonly openCount = computed(
    () => this.posts().filter((post) => post.status !== 'CLAIMED').length,
  );

  readonly commentCount = computed(() =>
    this.posts().reduce((total, post) => total + post.comments.length, 0),
  );

  readonly metrics = computed(() => [
    { label: 'Open posts', value: this.openCount(), hint: 'Still looking' },
    { label: 'Lost', value: this.counts().LOST, hint: 'Reported missing' },
    { label: 'Found', value: this.counts().FOUND, hint: 'Handed in' },
    { label: 'Comments', value: this.commentCount(), hint: 'Community replies' },
  ]);

  readonly filtered = computed(() => {
    const status = this.statusFilter();
    const term = this.search().trim().toLowerCase();

    return this.posts()
      .filter((post) => {
        if (status !== 'all' && post.status !== status) {
          return false;
        }
        if (!term) {
          return true;
        }

        const haystack = [
          post.title,
          post.category,
          post.location,
          post.description,
          this.authorName(post.reporterId),
          ...post.taggedUserIds.map((id) => this.authorName(id)),
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(term);
      })
      .sort(
        (a, b) =>
          Number(a.status === 'CLAIMED') - Number(b.status === 'CLAIMED') ||
          b.reportedAt.getTime() - a.reportedAt.getTime() ||
          b.id.localeCompare(a.id),
      );
  });

  readonly hasFilters = computed(() => this.statusFilter() !== 'all' || !!this.search().trim());

  /** PB-28 — the feed renders one page at a time so the composer stays close. */
  private readonly pager = createPager(this.filtered, 6);
  readonly pagedPosts = this.pager.items;
  readonly pagedVisible = this.pager.visible;

  setStatus(status: StatusFilter): void {
    this.statusFilter.set(status);
    this.pager.reset();
  }

  setSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
    this.pager.reset();
  }

  resetFilters(): void {
    this.statusFilter.set('all');
    this.search.set('');
    this.pager.reset();
  }

  loadMorePosts(): void {
    this.pager.loadMore();
  }

  addReport(input: LostFoundReportInput): void {
    const post = this.lostFoundService.create(input, this.currentUserId());
    this.resetFilters();
    this.toast.success('Post published', `"${post.title}" is now live in the community feed.`);
  }

  submitComment(post: LostFoundItem, message: string, taggedUserId: string): void {
    const text = message.trim();
    if (!text) {
      return;
    }

    const comment = this.lostFoundService.addComment(post.id, this.currentUserId(), {
      message: text,
      taggedUserIds: taggedUserId ? [taggedUserId] : [],
    });
    if (comment) {
      this.toast.success('Comment added', `Your reply to "${post.title}" is visible.`);
    }
  }

  toggleReaction(post: LostFoundItem): void {
    this.lostFoundService.toggleReaction(post.id, this.currentUserId());
  }

  hasReacted(post: LostFoundItem): boolean {
    return post.reactionUserIds.includes(this.currentUserId());
  }

  claimReport(post: LostFoundItem): void {
    const claimed = this.lostFoundService.claim(post.id);
    if (claimed) {
      this.toast.success('Marked as claimed', `"${claimed.title}" is now closed.`);
    }
  }

  authorName(id: string): string {
    return this.users.findById(id)?.fullName ?? 'Campus member';
  }

  initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) {
      return '?';
    }
    const first = parts[0].charAt(0);
    const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
    return (first + last).toUpperCase();
  }

  /** Deterministic avatar colour so the same person keeps the same tone. */
  avatarTone(id: string): number {
    let hash = 0;
    for (const char of id) {
      hash = (hash * 31 + char.charCodeAt(0)) | 0;
    }
    return (Math.abs(hash) % 6) + 1;
  }

  relativeTime(date: Date): string {
    const diffMs = date.getTime() - Date.now();
    const past = diffMs <= 0;
    const mins = Math.floor(Math.abs(diffMs) / 60000);

    if (mins < 1) {
      return 'just now';
    }
    if (mins < 60) {
      return `${mins}m ${past ? 'ago' : 'from now'}`;
    }

    const hours = Math.floor(mins / 60);
    if (hours < 24) {
      return `${hours}h ${past ? 'ago' : 'from now'}`;
    }

    const days = Math.floor(hours / 24);
    if (days < 7) {
      return `${days}d ${past ? 'ago' : 'from now'}`;
    }

    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

  fullDate(date: Date): string {
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  statusLabel(status: LostFoundStatus): string {
    return LOST_FOUND_STATUS_LABELS[status];
  }

  statusVariant(status: LostFoundStatus): BadgeVariant {
    if (status === 'LOST') {
      return 'warning';
    }
    if (status === 'FOUND') {
      return 'success';
    }
    return 'neutral';
  }
}
