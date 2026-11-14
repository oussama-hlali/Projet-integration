/**
 * Cafeteria models, aligned with `SmartCampus_ClassDiagram_V0`.
 *
 * A menu is served on one date in one building and offers at least one item
 * (composition). Items carry dietary labels, allergens and a price; a student
 * reserves a dish and receives a receipt with a QR code to show at the counter.
 */

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  dietaryLabels: string[];
  allergens: string[];
  /** Price in Tunisian dinars. */
  price: number;
}

export interface CafeteriaMenu {
  id: string;
  buildingId: string;
  building: string;
  date: Date;
  meal: string;
  openingHours: string;
  items: MenuItem[];
}

export interface CafeteriaOrderInput {
  menuId: string;
  itemId: string;
  userId?: string;
}

/** A confirmed dish reservation; `qrPayload` is what the receipt encodes. */
export interface CafeteriaOrder {
  id: string;
  reference: string;
  userId: string;
  menuId: string;
  itemId: string;
  itemName: string;
  menuLabel: string;
  building: string;
  date: Date;
  pickupTime: string;
  price: number;
  createdAt: Date;
  qrPayload: string;
}
