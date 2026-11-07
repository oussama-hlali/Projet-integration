import { Component, computed, input, signal } from '@angular/core';
import {
  ROOM_STATUSES,
  ROOM_STATUS_LABELS,
  Room,
  RoomStatus,
} from '../../core/models/room.model';
import { EmptyStateComponent } from './empty-state.component';
import { BadgeVariant, StatusBadgeComponent } from './status-badge.component';

/**
 * Search and filter panel for the Rooms page.
 *
 * The page owns the room catalogue and passes it in, so the same component can
 * later serve the admin screen without a second data source.
 */
@Component({
  selector: 'app-rooms-search',
  standalone: true,
  imports: [StatusBadgeComponent, EmptyStateComponent],
  template: `
    <div class="filters">
      <label class="field">
        <span class="field__label">Building</span>
        <select class="control" [value]="building()" (change)="setBuilding($event)">
          <option value="">All buildings</option>
          @for (b of buildings(); track b) {
            <option [value]="b">{{ b }}</option>
          }
        </select>
      </label>

      <label class="field field--capacity">
        <span class="field__label">Min. capacity</span>
        <input
          class="control"
          type="number"
          min="0"
          inputmode="numeric"
          placeholder="Any"
          [value]="minCapacity() ?? ''"
          (input)="setMinCapacity($event)"
        />
      </label>

      <label class="field">
        <span class="field__label">Status</span>
        <select class="control" [value]="status()" (change)="setStatus($event)">
          <option value="">All statuses</option>
          @for (option of roomStatuses; track option) {
            <option [value]="option">{{ statusLabel[option] }}</option>
          }
        </select>
      </label>

      <div class="field field--facilities">
        <span class="field__label">Facilities</span>
        <div class="chips" role="group" aria-label="Filter by facility">
          @for (f of allFacilities(); track f) {
            <button
              type="button"
              class="chip"
              [class.chip--active]="facilities().includes(f)"
              [attr.aria-pressed]="facilities().includes(f)"
              (click)="toggleFacility(f)"
            >
              {{ f }}
            </button>
          }
        </div>
      </div>

      @if (hasFilters()) {
        <button type="button" class="button button--quiet" (click)="reset()">
          Reset filters
        </button>
      }
    </div>

    <p class="results" role="status">
      Showing {{ filtered().length }} of {{ rooms().length }} rooms
    </p>

    @if (filtered().length) {
      <div class="grid">
        @for (r of filtered(); track r.id) {
          <article class="room-card">
            <div class="room-card__head">
              <h3>{{ r.name }}</h3>
              <app-status-badge [label]="statusLabel[r.status]" [variant]="statusVariant[r.status]" />
            </div>

            <p class="room-card__meta">
              <span>{{ r.building }}</span>
              <span aria-hidden="true">·</span>
              <span>{{ r.capacity }} seats</span>
            </p>

            <ul class="room-card__facilities" aria-label="Facilities">
              @for (f of r.facilities; track f) {
                <li>{{ f }}</li>
              }
            </ul>
          </article>
        }
      </div>
    } @else {
      <app-empty-state
        title="No rooms match these filters"
        message="Try another building, capacity, status or facility."
      >
        @if (hasFilters()) {
          <button type="button" class="button button--quiet" (click)="reset()">
            Reset filters
          </button>
        }
      </app-empty-state>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .filters {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-end;
        gap: var(--space-3);
      }

      .field {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
        min-width: 150px;
      }

      .field--capacity {
        max-width: 130px;
      }

      .field--facilities {
        flex: 1 1 260px;
      }

      .field__label {
        color: var(--color-text-muted);
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-semibold);
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }

      .control {
        width: 100%;
        padding: 0.5rem 0.7rem;
        color: var(--color-text);
        background: color-mix(in srgb, var(--color-surface) 55%, transparent);
        border: 1px solid var(--color-border-strong);
        border-radius: var(--radius-md);
        font: inherit;
        font-size: var(--font-size-sm);
        transition:
          border-color var(--transition-fast),
          box-shadow var(--transition-fast),
          background-color var(--transition-fast);
      }

      .control:hover {
        border-color: color-mix(in srgb, var(--color-accent) 40%, var(--color-border-strong));
      }

      .control:focus {
        background: var(--color-surface);
        border-color: var(--color-accent);
        box-shadow: 0 0 0 3px var(--color-accent-soft);
        outline: none;
      }

      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-2);
      }

      .chip {
        padding: 0.4rem 0.75rem;
        color: var(--color-text-muted);
        background: color-mix(in srgb, var(--color-surface) 30%, transparent);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-full);
        cursor: pointer;
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-medium);
        transition:
          color var(--transition-fast),
          background-color var(--transition-fast),
          border-color var(--transition-fast),
          box-shadow var(--transition-fast);
      }

      .chip:hover {
        color: var(--color-text-strong);
        border-color: var(--color-border-strong);
      }

      .chip--active {
        color: var(--color-accent-text);
        background: var(--lens);
        border-color: transparent;
        box-shadow: var(--lens-shadow);
      }

      .results {
        margin: var(--space-4) 0 var(--space-3);
        color: var(--color-text-muted);
        font-size: var(--font-size-sm);
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: var(--space-3);
      }

      .room-card {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        padding: var(--space-3) var(--space-4);
        background: color-mix(in srgb, var(--color-surface) 34%, transparent);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-tile);
        transition:
          background-color var(--transition-base),
          transform var(--transition-base);
      }

      .room-card:hover {
        background: color-mix(in srgb, var(--color-surface) 52%, transparent);
        transform: translateY(-2px);
      }

      .room-card__head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: var(--space-2);
      }

      .room-card h3 {
        margin: 0;
        color: var(--color-text-strong);
        font-size: var(--font-size-base);
        font-weight: var(--font-weight-semibold);
        letter-spacing: -0.01em;
      }

      .room-card__meta {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-1);
        margin: 0;
        color: var(--color-text-muted);
        font-size: var(--font-size-sm);
      }

      .room-card__facilities {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-1);
        margin: var(--space-1) 0 0;
        padding: 0;
        list-style: none;
      }

      .room-card__facilities li {
        padding: 0.12rem 0.5rem;
        color: var(--color-text-muted);
        background: var(--well);
        border-radius: var(--radius-full);
        font-size: var(--font-size-xs);
      }

      .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.5rem 0.9rem;
        border: 1px solid transparent;
        border-radius: var(--radius-full);
        cursor: pointer;
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-semibold);
        white-space: nowrap;
        transition:
          background-color var(--transition-fast),
          border-color var(--transition-fast),
          color var(--transition-fast);
      }

      .button--quiet {
        color: var(--color-text);
        background: transparent;
        border-color: var(--color-border-strong);
      }

      .button--quiet:hover {
        background: var(--well);
      }

      @media (max-width: 640px) {
        .field,
        .field--capacity {
          flex: 1 1 100%;
          max-width: none;
        }

        .field--facilities {
          flex-basis: 100%;
        }

        .grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class RoomsSearchComponent {
  readonly rooms = input.required<readonly Room[]>();

  readonly building = signal('');
  readonly minCapacity = signal<number | null>(null);
  readonly status = signal<RoomStatus | ''>('');
  readonly facilities = signal<string[]>([]);

  readonly buildings = computed(() =>
    [...new Set(this.rooms().map((room) => room.building))].sort((a, b) => a.localeCompare(b)),
  );

  readonly allFacilities = computed(() =>
    [...new Set(this.rooms().flatMap((room) => room.facilities))].sort((a, b) =>
      a.localeCompare(b),
    ),
  );

  readonly filtered = computed(() => {
    const building = this.building();
    const capacity = this.minCapacity();
    const status = this.status();
    const facilities = this.facilities();

    return this.rooms().filter(
      (room) =>
        (!building || room.building === building) &&
        (capacity === null || room.capacity >= capacity) &&
        (!status || room.status === status) &&
        facilities.every((facility) => room.facilities.includes(facility)),
    );
  });

  readonly hasFilters = computed(
    () =>
      !!this.building() ||
      this.minCapacity() !== null ||
      !!this.status() ||
      this.facilities().length > 0,
  );

  readonly statusLabel: Record<RoomStatus, string> = ROOM_STATUS_LABELS;

  readonly roomStatuses = ROOM_STATUSES;

  readonly statusVariant: Record<RoomStatus, BadgeVariant> = {
    AVAILABLE: 'success',
    OCCUPIED: 'warning',
    RESERVED: 'info',
    MAINTENANCE: 'danger',
  };

  setBuilding(event: Event): void {
    this.building.set((event.target as HTMLSelectElement).value);
  }

  setMinCapacity(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const capacity = Number(value);
    this.minCapacity.set(value === '' || !Number.isFinite(capacity) ? null : capacity);
  }

  setStatus(event: Event): void {
    this.status.set((event.target as HTMLSelectElement).value as RoomStatus | '');
  }

  toggleFacility(facility: string): void {
    this.facilities.update((list) =>
      list.includes(facility) ? list.filter((item) => item !== facility) : [...list, facility],
    );
  }

  reset(): void {
    this.building.set('');
    this.minCapacity.set(null);
    this.status.set('');
    this.facilities.set([]);
  }
}
