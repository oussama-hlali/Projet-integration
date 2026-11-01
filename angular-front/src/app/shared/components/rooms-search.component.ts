import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Room, RoomStatus } from '../../core/models/room.model';
import { StatusBadgeComponent, EmptyStateComponent, BadgeVariant } from './index';

@Component({
  selector: 'app-rooms-search',
  standalone: true,
  imports: [FormsModule, StatusBadgeComponent, EmptyStateComponent],
  template: `
    <div class="filters">
      <select [ngModel]="building()" (ngModelChange)="building.set($event)">
        <option value="">Tous les bâtiments</option>
        @for (b of buildings(); track b) { <option [value]="b">{{ b }}</option> }
      </select>

      <input type="number" min="0" placeholder="Capacité min."
             [ngModel]="minCapacity()" (ngModelChange)="minCapacity.set($event)" />

      <select [ngModel]="status()" (ngModelChange)="status.set($event)">
        <option value="">Tous les statuts</option>
        <option value="available">Disponible</option>
        <option value="occupied">Occupée</option>
        <option value="maintenance">Maintenance</option>
      </select>

      <div class="facilities">
        @for (f of allFacilities(); track f) {
          <label>
            <input type="checkbox" [checked]="facilities().includes(f)" (change)="toggleFacility(f)" />
            {{ f }}
          </label>
        }
      </div>

      <button type="button" (click)="reset()">Réinitialiser</button>
    </div>

    <p>{{ filtered().length }} salle(s)</p>

    @if (filtered().length) {
      <div class="grid">
        @for (r of filtered(); track r.id) {
          <article class="room">
            <h3>{{ r.name }}</h3>
            <p>{{ r.building }} · {{ r.capacity }} places</p>
            <p>{{ r.facilities.join(', ') }}</p>
            <app-status-badge [label]="statusLabel[r.status]" [variant]="statusVariant[r.status]" />
          </article>
        }
      </div>
    } @else {
      <app-empty-state title="Aucune salle trouvée" message="Modifiez ou réinitialisez les filtres.">
        <button type="button" (click)="reset()">Réinitialiser</button>
      </app-empty-state>
    }
  `,
  styles: [`
    .filters { display:flex; flex-wrap:wrap; gap:.75rem; align-items:center; margin-bottom:1rem; }
    .facilities { display:flex; gap:.75rem; flex-wrap:wrap; }
    .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:1rem; }
    .room { border:1px solid #e5e7eb; border-radius:.75rem; padding:1rem; }
    .room h3 { margin:0 0 .25rem; }
  `],
})
export class RoomsSearchComponent {
  rooms = signal<Room[]>([]);

  building = signal('');
  minCapacity = signal<number | null>(null);
  status = signal<RoomStatus | ''>('');
  facilities = signal<string[]>([]);

  buildings = computed(() => [...new Set(this.rooms().map(r => r.building))].sort());
  allFacilities = computed(() => [...new Set(this.rooms().flatMap(r => r.facilities))].sort());

  filtered = computed(() => {
    const b = this.building();
    const cap = this.minCapacity();
    const s = this.status();
    const fs = this.facilities();

    return this.rooms().filter(r =>
      (!b || r.building === b) &&
      (cap == null || r.capacity >= cap) &&
      (!s || r.status === s) &&
      fs.every(f => r.facilities.includes(f))
    );
  });

  statusLabel: Record<RoomStatus, string> = {
    available: 'Disponible', occupied: 'Occupée', maintenance: 'Maintenance',
  };
  statusVariant: Record<RoomStatus, BadgeVariant> = {
    available: 'success', occupied: 'warning', maintenance: 'danger',
  };

  toggleFacility(f: string) {
    this.facilities.update(list =>
      list.includes(f) ? list.filter(x => x !== f) : [...list, f]
    );
  }

  reset() {
    this.building.set('');
    this.minCapacity.set(null);
    this.status.set('');
    this.facilities.set([]);
  }
}