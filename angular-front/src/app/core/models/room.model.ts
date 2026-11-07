/**
 * Room model, aligned with `SmartCampus_ClassDiagram_V0`.
 *
 * `buildingId` carries the `Building "1" o-- "0..*" Room` association while
 * `building` keeps the display name that the search panel filters on.
 */

export type RoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';

export const ROOM_STATUSES: readonly RoomStatus[] = [
  'AVAILABLE',
  'OCCUPIED',
  'RESERVED',
  'MAINTENANCE',
];

export const ROOM_STATUS_LABELS: Record<RoomStatus, string> = {
  AVAILABLE: 'Available',
  OCCUPIED: 'Occupied',
  RESERVED: 'Reserved',
  MAINTENANCE: 'Maintenance',
};

export interface Room {
  id: string;
  name: string;
  buildingId: string;
  building: string;
  capacity: number;
  facilities: string[];
  status: RoomStatus;
}

/** Everything the admin room form submits. */
export type RoomInput = Omit<Room, 'id'>;
