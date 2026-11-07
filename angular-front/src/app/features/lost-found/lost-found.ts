import { Component, computed, signal } from '@angular/core';
import { ReportItem, ReportItemPayload, ReportType } from '../../core/models/report-item.model';
import {
  BadgeVariant,
  EmptyStateComponent,
  PageHeaderComponent,
  ReportItemComponent,
  StatCardComponent,
  StatusBadgeComponent,
} from '../../shared/components';

type TypeFilter = 'all' | ReportType;

/** Demo reports in French, matching the rest of the app's sample data. */
const DEMO_REPORTS: readonly ReportItem[] = [
  {
    id: 1,
    type: 'found',
    title: 'Clés de voiture',
    category: 'Clés',
    description: 'Trousseau avec un porte-clés bleu et une télécommande.',
    location: 'Parking du Bloc B',
    date: '2026-11-06',
    contactPhone: '12345678',
    resolved: false,
  },
  {
    id: 2,
    type: 'lost',
    title: 'Carte étudiante',
    category: 'Documents',
    description: 'Carte au nom de Yasmine B., perdue entre la bibliothèque et le Bloc A.',
    location: 'Bibliothèque',
    date: '2026-11-05',
    contactPhone: '23456789',
    resolved: false,
  },
  {
    id: 3,
    type: 'found',
    title: 'Écouteurs sans fil',
    category: 'Électronique',
    description: 'Boîtier blanc trouvé sur une table près de la cafétéria.',
    location: 'Cafétéria',
    date: '2026-11-04',
    resolved: false,
  },
  {
    id: 4,
    type: 'lost',
    title: 'Veste noire',
    category: 'Vêtements',
    description: 'Veste noire avec capuche, oubliée après le cours de 14h.',
    location: 'Amphi A',
    date: '2026-11-03',
    contactPhone: '34567890',
    resolved: false,
  },
  {
    id: 5,
    type: 'found',
    title: 'Calculatrice scientifique',
    category: 'Électronique',
    description: 'Calculatrice modèle graphique, gravée au nom de "M. K.".',
    location: 'Salle 12',
    date: '2026-11-02',
    resolved: true,
  },
  {
    id: 6,
    type: 'lost',
    title: 'Clés de maison',
    category: 'Clés',
    description: 'Petit trousseau avec deux clés et un badge vert.',
    location: 'Bloc C',
    date: '2026-10-31',
    contactPhone: '45678901',
    resolved: true,
  },
];

/**
 * PB-17 — Lost & Found.
 *
 * Students browse reports and submit a new one. The list lives in the page so
 * new reports appear immediately; a backend can replace the signal later.
 */
@Component({
  selector: 'app-lost-found',
  imports: [
    EmptyStateComponent,
    PageHeaderComponent,
    ReportItemComponent,
    StatCardComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './lost-found.html',
  styleUrl: './lost-found.scss',
})
export class LostFound {
  readonly reports = signal<ReportItem[]>([...DEMO_REPORTS]);

  readonly typeFilter = signal<TypeFilter>('all');
  readonly search = signal('');
  readonly feedback = signal<string | null>(null);

  readonly counts = computed<Record<TypeFilter, number>>(() => {
    const counts: Record<TypeFilter, number> = { all: 0, lost: 0, found: 0 };

    for (const report of this.reports()) {
      counts.all += 1;
      counts[report.type] += 1;
    }

    return counts;
  });

  readonly resolvedCount = computed(
    () => this.reports().filter((report) => report.resolved).length,
  );

  readonly openCount = computed(
    () => this.reports().filter((report) => !report.resolved).length,
  );

  readonly metrics = computed(() => [
    {
      label: 'Open reports',
      value: this.openCount(),
      hint: 'Still looking',
    },
    {
      label: 'Lost',
      value: this.counts().lost,
      hint: 'Reported missing',
    },
    {
      label: 'Found',
      value: this.counts().found,
      hint: 'Handed in',
    },
    {
      label: 'Reunited',
      value: this.resolvedCount(),
      hint: 'Closed reports',
    },
  ]);

  readonly filtered = computed(() => {
    const type = this.typeFilter();
    const term = this.search().trim().toLowerCase();

    return this.reports()
      .filter(
        (report) =>
          (type === 'all' || report.type === type) &&
          (!term ||
            `${report.title} ${report.category} ${report.location} ${report.description}`
              .toLowerCase()
              .includes(term)),
      )
      .sort(
        (a, b) =>
          Number(a.resolved) - Number(b.resolved) ||
          b.date.localeCompare(a.date) ||
          b.id - a.id,
      );
  });

  readonly hasFilters = computed(
    () => this.typeFilter() !== 'all' || !!this.search().trim(),
  );

  setType(type: TypeFilter): void {
    this.typeFilter.set(type);
  }

  setSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  resetFilters(): void {
    this.typeFilter.set('all');
    this.search.set('');
  }

  addReport(payload: ReportItemPayload): void {
    const nextId = Math.max(0, ...this.reports().map((report) => report.id)) + 1;

    this.reports.update((reports) => [{ ...payload, id: nextId, resolved: false }, ...reports]);
    this.resetFilters();
    this.feedback.set(`"${payload.title}" was added to the list.`);
  }

  toggleResolved(id: number): void {
    this.reports.update((reports) =>
      reports.map((report) =>
        report.id === id ? { ...report, resolved: !report.resolved } : report,
      ),
    );
  }

  dismissFeedback(): void {
    this.feedback.set(null);
  }

  typeLabel(type: ReportType): string {
    return type === 'lost' ? 'Lost' : 'Found';
  }

  typeVariant(type: ReportType): BadgeVariant {
    return type === 'lost' ? 'warning' : 'success';
  }

  dateLabel(isoDate: string): string {
    const [year, month, day] = isoDate.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
}
