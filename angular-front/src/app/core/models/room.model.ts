
export type RoomStatus = 'available' | 'occupied' | 'maintenance';

export interface Room {
  id: number;
  name: string;
  building: string;
  capacity: number;
  facilities: string[];
  status: RoomStatus;
}
