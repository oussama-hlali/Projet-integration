import { Injectable, computed, signal } from '@angular/core';
import { CafeteriaMenu, MenuItem } from '../models/cafeteria.model';

/** Weekly cafeteria menus; each menu offers several labelled items. */
@Injectable({ providedIn: 'root' })
export class CafeteriaService {
  private readonly state = signal<CafeteriaMenu[]>(this.seed());

  readonly menus = this.state.asReadonly();

  readonly todayMenu = computed(() => {
    const today = new Date();
    return (
      this.state().find((menu) => this.sameDay(menu.date, today)) ??
      this.state()[0]
    );
  });

  menuFor(date: Date): CafeteriaMenu | undefined {
    return this.state().find((menu) => this.sameDay(menu.date, date));
  }

  private sameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  private seed(): CafeteriaMenu[] {
    const monday = this.startOfWeek(new Date());

    return [
      {
        id: 'menu-1',
        buildingId: 'b-caf',
        building: 'Cafétéria',
        date: this.addDays(monday, 0),
        meal: 'Poulet rôti & légumes',
        openingHours: '11:30 – 14:30',
        items: [
          {
            id: 'mi-1',
            name: 'Poulet rôti aux herbes',
            dietaryLabels: ['Sans gluten'],
            allergens: [],
          },
          {
            id: 'mi-2',
            name: 'Gratin de courgettes',
            dietaryLabels: ['Végétarien'],
            allergens: ['Lait'],
          },
          {
            id: 'mi-3',
            name: 'Salade de fruits frais',
            dietaryLabels: ['Vegan', 'Sans gluten'],
            allergens: [],
          },
        ],
      },
      {
        id: 'menu-2',
        buildingId: 'b-caf',
        building: 'Cafétéria',
        date: this.addDays(monday, 1),
        meal: 'Couscous végétarien',
        openingHours: '11:30 – 14:30',
        items: [
          {
            id: 'mi-4',
            name: 'Couscous aux sept légumes',
            dietaryLabels: ['Vegan'],
            allergens: ['Gluten'],
          },
          {
            id: 'mi-5',
            name: 'Merguez de bœuf',
            dietaryLabels: [],
            allergens: ['Gluten'],
          },
          {
            id: 'mi-6',
            name: 'Yaourt nature',
            dietaryLabels: ['Végétarien'],
            allergens: ['Lait'],
          },
        ],
      },
      {
        id: 'menu-3',
        buildingId: 'b-caf',
        building: 'Cafétéria',
        date: this.addDays(monday, 2),
        meal: 'Pâtes fraîches au pesto',
        openingHours: '11:30 – 14:30',
        items: [
          {
            id: 'mi-7',
            name: 'Tagliatelles au pesto',
            dietaryLabels: ['Végétarien'],
            allergens: ['Gluten', 'Lait', 'Fruits à coque'],
          },
          {
            id: 'mi-8',
            name: 'Filet de poisson',
            dietaryLabels: ['Sans gluten'],
            allergens: ['Poisson'],
          },
          {
            id: 'mi-9',
            name: 'Tiramisu',
            dietaryLabels: ['Végétarien'],
            allergens: ['Gluten', 'Lait', 'Œuf'],
          },
        ],
      },
      {
        id: 'menu-4',
        buildingId: 'b-caf',
        building: 'Cafétéria',
        date: this.addDays(monday, 3),
        meal: 'Bowl végétal & falafels',
        openingHours: '11:30 – 14:30',
        items: [
          {
            id: 'mi-10',
            name: 'Bowl de quinoa et falafels',
            dietaryLabels: ['Vegan', 'Sans gluten'],
            allergens: ['Sésame'],
          },
          {
            id: 'mi-11',
            name: 'Soupe de lentilles',
            dietaryLabels: ['Vegan'],
            allergens: [],
          },
          {
            id: 'mi-12',
            name: 'Mousse au chocolat',
            dietaryLabels: ['Végétarien'],
            allergens: ['Lait', 'Œuf'],
          },
        ],
      },
      {
        id: 'menu-5',
        buildingId: 'b-caf',
        building: 'Cafétéria',
        date: this.addDays(monday, 4),
        meal: 'Tajine de poisson',
        openingHours: '11:30 – 14:30',
        items: [
          {
            id: 'mi-13',
            name: 'Tajine de poisson au citron',
            dietaryLabels: ['Sans gluten'],
            allergens: ['Poisson'],
          },
          {
            id: 'mi-14',
            name: 'Riz aux amandes',
            dietaryLabels: ['Vegan'],
            allergens: ['Fruits à coque'],
          },
          {
            id: 'mi-15',
            name: 'Orange fraîche',
            dietaryLabels: ['Vegan', 'Sans gluten'],
            allergens: [],
          },
        ],
      },
    ];
  }

  private startOfWeek(date: Date): Date {
    const start = new Date(date);
    const day = start.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diff);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  private addDays(date: Date, days: number): Date {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }
}

/** Re-export for templates that type an item value. */
export type { MenuItem };
