import { Injectable, signal } from '@angular/core';
import { Building } from '../models/building.model';

/** Demo campus buildings. Shared by rooms, transport and the cafeteria. */
@Injectable({ providedIn: 'root' })
export class BuildingService {
  private readonly state = signal<Building[]>([
    { id: 'b-a', name: 'Bloc A', location: 'Campus sud' },
    { id: 'b-b', name: 'Bloc B', location: 'Campus sud' },
    { id: 'b-c', name: 'Bloc C', location: 'Campus nord' },
    { id: 'b-d', name: 'Bloc D', location: 'Campus est' },
    { id: 'b-lib', name: 'Bibliothèque', location: 'Campus centre' },
    { id: 'b-f', name: 'Bloc F', location: 'Campus ouest' },
    { id: 'b-caf', name: 'Cafétéria', location: 'Campus centre' },
  ]);

  readonly buildings = this.state.asReadonly();

  findById(id: string): Building | undefined {
    return this.state().find((building) => building.id === id);
  }

  nameOf(id: string): string {
    return this.findById(id)?.name ?? 'Campus';
  }
}
