import { Injectable, computed, signal } from '@angular/core';
import {
  TransportDeparture,
  TransportRoute,
  TransportRouteView,
  TransportStop,
} from '../models/transport.model';

/** Campus shuttle timetable, grouped by route then by ordered stop. */
@Injectable({ providedIn: 'root' })
export class TransportService {
  private readonly routeState = signal<TransportRoute[]>([
    { id: 't1', name: 'Ligne Centre-ville', color: '#0c6f6b' },
    { id: 't2', name: 'Ligne Résidence', color: '#1c4fa8' },
    { id: 't3', name: 'Navette Campus', color: '#8a5200' },
  ]);

  private readonly stopState = signal<TransportStop[]>([
    { id: 'st-1', routeId: 't1', name: 'Gare Centrale', order: 1 },
    { id: 'st-2', routeId: 't1', name: 'Avenue Habib', order: 2 },
    { id: 'st-3', routeId: 't1', name: 'Campus Nord', order: 3 },
    { id: 'st-4', routeId: 't1', name: 'Campus Principal', order: 4 },
    { id: 'st-5', routeId: 't2', name: 'Résidence Universitaire', order: 1 },
    { id: 'st-6', routeId: 't2', name: 'Marché central', order: 2 },
    { id: 'st-7', routeId: 't2', name: 'Campus Principal', order: 3 },
    { id: 'st-8', routeId: 't3', name: 'Bloc A', order: 1 },
    { id: 'st-9', routeId: 't3', name: 'Bloc C', order: 2 },
    { id: 'st-10', routeId: 't3', name: 'Cafétéria', order: 3 },
    { id: 'st-11', routeId: 't3', name: 'Bibliothèque', order: 4 },
  ]);

  private readonly departureState = signal<TransportDeparture[]>([
    { id: 'd-1', stopId: 'st-1', time: '07:30', days: 'Mon-Fri' },
    { id: 'd-2', stopId: 'st-1', time: '08:00', days: 'Mon-Fri' },
    { id: 'd-3', stopId: 'st-1', time: '12:15', days: 'Mon-Fri' },
    { id: 'd-4', stopId: 'st-1', time: '17:30', days: 'Mon-Fri' },
    { id: 'd-5', stopId: 'st-1', time: '09:00', days: 'Sat' },
    { id: 'd-6', stopId: 'st-2', time: '07:38', days: 'Mon-Fri' },
    { id: 'd-7', stopId: 'st-2', time: '08:08', days: 'Mon-Fri' },
    { id: 'd-8', stopId: 'st-2', time: '12:23', days: 'Mon-Fri' },
    { id: 'd-9', stopId: 'st-2', time: '17:38', days: 'Mon-Fri' },
    { id: 'd-10', stopId: 'st-3', time: '07:50', days: 'Mon-Fri' },
    { id: 'd-11', stopId: 'st-3', time: '08:20', days: 'Mon-Fri' },
    { id: 'd-12', stopId: 'st-3', time: '12:35', days: 'Mon-Fri' },
    { id: 'd-13', stopId: 'st-3', time: '17:50', days: 'Mon-Fri' },
    { id: 'd-14', stopId: 'st-4', time: '08:00', days: 'Mon-Fri' },
    { id: 'd-15', stopId: 'st-4', time: '08:30', days: 'Mon-Fri' },
    { id: 'd-16', stopId: 'st-4', time: '12:45', days: 'Mon-Fri' },
    { id: 'd-17', stopId: 'st-4', time: '18:00', days: 'Mon-Fri' },
    { id: 'd-18', stopId: 'st-4', time: '09:30', days: 'Sat' },
    { id: 'd-19', stopId: 'st-5', time: '07:20', days: 'Mon-Fri' },
    { id: 'd-20', stopId: 'st-5', time: '07:50', days: 'Mon-Fri' },
    { id: 'd-21', stopId: 'st-5', time: '13:00', days: 'Mon-Fri' },
    { id: 'd-22', stopId: 'st-5', time: '17:15', days: 'Mon-Fri' },
    { id: 'd-23', stopId: 'st-6', time: '07:32', days: 'Mon-Fri' },
    { id: 'd-24', stopId: 'st-6', time: '08:02', days: 'Mon-Fri' },
    { id: 'd-25', stopId: 'st-6', time: '13:12', days: 'Mon-Fri' },
    { id: 'd-26', stopId: 'st-6', time: '17:27', days: 'Mon-Fri' },
    { id: 'd-27', stopId: 'st-7', time: '07:45', days: 'Mon-Fri' },
    { id: 'd-28', stopId: 'st-7', time: '08:15', days: 'Mon-Fri' },
    { id: 'd-29', stopId: 'st-7', time: '13:25', days: 'Mon-Fri' },
    { id: 'd-30', stopId: 'st-7', time: '17:40', days: 'Mon-Fri' },
    { id: 'd-31', stopId: 'st-8', time: '08:05', days: 'Mon-Fri' },
    { id: 'd-32', stopId: 'st-8', time: '11:05', days: 'Mon-Fri' },
    { id: 'd-33', stopId: 'st-8', time: '15:05', days: 'Mon-Fri' },
    { id: 'd-34', stopId: 'st-9', time: '08:10', days: 'Mon-Fri' },
    { id: 'd-35', stopId: 'st-9', time: '11:10', days: 'Mon-Fri' },
    { id: 'd-36', stopId: 'st-9', time: '15:10', days: 'Mon-Fri' },
    { id: 'd-37', stopId: 'st-10', time: '08:16', days: 'Mon-Fri' },
    { id: 'd-38', stopId: 'st-10', time: '11:16', days: 'Mon-Fri' },
    { id: 'd-39', stopId: 'st-10', time: '15:16', days: 'Mon-Fri' },
    { id: 'd-40', stopId: 'st-11', time: '08:22', days: 'Mon-Fri' },
    { id: 'd-41', stopId: 'st-11', time: '11:22', days: 'Mon-Fri' },
    { id: 'd-42', stopId: 'st-11', time: '15:22', days: 'Mon-Fri' },
  ]);

  readonly routes = this.routeState.asReadonly();

  readonly routeViews = computed<TransportRouteView[]>(() =>
    this.routeState().map((route) => ({
      ...route,
      stops: this.stopState()
        .filter((stop) => stop.routeId === route.id)
        .sort((a, b) => a.order - b.order)
        .map((stop) => ({
          ...stop,
          departures: this.departureState()
            .filter((departure) => departure.stopId === stop.id)
            .sort((a, b) => a.time.localeCompare(b.time)),
        })),
    })),
  );

  /** The departure that matches the current weekday, or the first one. */
  nextDeparture(stop: TransportRouteView['stops'][number]): TransportDeparture | undefined {
    const day = new Date().getDay();
    const pattern = day === 0 || day === 6 ? 'Sat' : 'Mon-Fri';
    return stop.departures.find((departure) => departure.days === pattern) ?? stop.departures[0];
  }
}
