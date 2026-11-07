/**
 * Transport models, aligned with `SmartCampus_ClassDiagram_V0`.
 *
 * A route serves 2..* ordered stops (composition) and each stop has zero or
 * more departures (composition).
 */

export interface TransportRoute {
  id: string;
  name: string;
  color: string;
}

export interface TransportStop {
  id: string;
  routeId: string;
  name: string;
  order: number;
}

export interface TransportDeparture {
  id: string;
  stopId: string;
  /** 24h clock, `HH:mm`. */
  time: string;
  /** Free-form day pattern, e.g. `Mon-Fri` or `Sat`. */
  days: string;
}

export interface TransportRouteView extends TransportRoute {
  stops: Array<TransportStop & { departures: TransportDeparture[] }>;
}
