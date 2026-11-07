import { Component, computed, inject, signal } from '@angular/core';
import { TransportDeparture, TransportRouteView } from '../../core/models/transport.model';
import { TransportService } from '../../core/services/transport.service';
import {
  EmptyStateComponent,
  PageHeaderComponent,
  StatusBadgeComponent,
} from '../../shared/components';

type StopView = TransportRouteView['stops'][number];

interface DayGroup {
  days: string;
  times: string[];
}

@Component({
  selector: 'app-transport',
  imports: [EmptyStateComponent, PageHeaderComponent, StatusBadgeComponent],
  template: `
    <section class="page">
      <app-page-header title="Transport" subtitle="Shuttle routes, stops and timetable">
        <app-status-badge label="Demo data" variant="warning" />
      </app-page-header>

      <div class="tabs" role="tablist">
        @for (route of routes(); track route.id) {
          <button
            type="button"
            role="tab"
            class="tab"
            [class.tab--active]="route.id === selected()?.id"
            [attr.aria-selected]="route.id === selected()?.id"
            (click)="selectedId.set(route.id)"
          >
            <span class="dot" [style.background]="route.color"></span>
            {{ route.name }}
          </button>
        }
      </div>

      @if (selected(); as route) {
        <ol class="stops">
          @for (stop of route.stops; track stop.id) {
            <li class="stop">
              <span class="stop__marker" [style.border-color]="route.color">{{ stop.order }}</span>
              <div class="stop__body">
                <div class="stop__head">
                  <h2>{{ stop.name }}</h2>
                  @if (next(stop); as nextDeparture) {
                    <app-status-badge [label]="'Next ' + nextDeparture.time" variant="success" />
                  } @else {
                    <app-status-badge label="No more today" variant="neutral" />
                  }
                </div>
                @for (group of groups(stop); track group.days) {
                  <div class="times">
                    <strong class="times__days">{{ group.days }}</strong>
                    @for (time of group.times; track time) {
                      <span class="time" [class.time--next]="isNext(stop, group.days, time)">
                        {{ time }}
                      </span>
                    }
                  </div>
                }
              </div>
            </li>
          }
        </ol>
      } @else {
        <app-empty-state title="No routes available" />
      }
    </section>
  `,
  styles: `
    .tabs {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
      margin-bottom: var(--space-5);
    }
    .tab {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-4);
      color: var(--color-text);
      background: var(--color-surface);
      border: 1px solid var(--color-border-strong);
      border-radius: var(--radius-full);
      cursor: pointer;
    }
    .tab--active {
      color: var(--color-accent-contrast);
      background: var(--color-accent);
      border-color: var(--color-accent);
    }
    .dot {
      width: 10px;
      height: 10px;
      border-radius: var(--radius-full);
    }
    .stops {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .stop {
      display: flex;
      gap: var(--space-4);
      padding: var(--space-4) var(--space-5);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-xs);
    }
    .stop__marker {
      display: grid;
      flex: none;
      place-items: center;
      width: 32px;
      height: 32px;
      color: var(--color-text-strong);
      font-weight: var(--font-weight-semibold);
      border: 3px solid var(--color-border-strong);
      border-radius: var(--radius-full);
    }
    .stop__body {
      display: flex;
      flex: 1;
      flex-direction: column;
      gap: var(--space-3);
    }
    .stop__head {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-2) var(--space-3);
    }
    h2 {
      margin: 0;
      font-size: var(--font-size-lg);
      color: var(--color-text-strong);
    }
    .times {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-2);
    }
    .times__days {
      min-width: 70px;
      color: var(--color-text-muted);
      font-size: var(--font-size-sm);
    }
    .time {
      padding: var(--space-1) var(--space-3);
      color: var(--color-text);
      font-size: var(--font-size-sm);
      background: var(--color-surface-muted);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
    }
    .time--next {
      color: var(--color-accent-contrast);
      background: var(--color-accent);
      border-color: var(--color-accent);
    }
  `,
})
export class Transport {
  private readonly service = inject(TransportService);

  readonly routes = this.service.routeViews;
  readonly selectedId = signal<string | null>(null);

  readonly selected = computed(() => {
    const routes = this.routes();
    return routes.find((route) => route.id === this.selectedId()) ?? routes[0] ?? null;
  });

  groups(stop: StopView): DayGroup[] {
    const groups: DayGroup[] = [];
    for (const departure of stop.departures) {
      const group = groups.find((entry) => entry.days === departure.days);
      if (group) {
        group.times.push(departure.time);
      } else {
        groups.push({ days: departure.days, times: [departure.time] });
      }
    }
    return groups;
  }

  next(stop: StopView): TransportDeparture | undefined {
    const pattern = this.todayPattern();
    const now = new Date().toTimeString().slice(0, 5);
    return stop.departures.find(
      (departure) => departure.days === pattern && departure.time >= now,
    );
  }

  isNext(stop: StopView, days: string, time: string): boolean {
    const nextDeparture = this.next(stop);
    return nextDeparture?.days === days && nextDeparture.time === time;
  }

  private todayPattern(): string {
    const day = new Date().getDay();
    return day === 0 || day === 6 ? 'Sat' : 'Mon-Fri';
  }
}