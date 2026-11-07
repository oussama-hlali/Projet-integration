/**
 * Cafeteria models, aligned with `SmartCampus_ClassDiagram_V0`.
 *
 * A menu is served on one date in one building and offers at least one item
 * (composition). Items carry dietary labels and allergens.
 */

export interface MenuItem {
  id: string;
  name: string;
  dietaryLabels: string[];
  allergens: string[];
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
