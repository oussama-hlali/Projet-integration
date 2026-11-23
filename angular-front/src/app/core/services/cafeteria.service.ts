import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RuntimeConfigService } from '../config/runtime-config.service';
import {
  CafeteriaMenu,
  CafeteriaOrder,
  CafeteriaOrderInput,
  MenuItem,
} from '../models/cafeteria.model';
import { mapCafeteriaMenu, mapCafeteriaOrder } from './live-mappers';

const DEMO_USER_ID = 'u1';

/**
 * Weekly cafeteria menus plus the dish reservations made against them.
 *
 * Production reads and writes the cafeteria service through the gateway;
 * mock mode keeps the deterministic weekly menu and receipts for local demos.
 */
@Injectable({ providedIn: 'root' })
export class CafeteriaService {
  private readonly http = inject(HttpClient, { optional: true });
  private readonly cfg = inject(RuntimeConfigService, { optional: true });
  private readonly menusState = signal<CafeteriaMenu[]>(
    environment.useMocks ? this.seedMenus() : [],
  );
  private readonly ordersState = signal<CafeteriaOrder[]>(
    environment.useMocks ? this.loadOrders(this.menusState()) : [],
  );

  constructor() {
    if (!environment.useMocks) {
      this.http!.get<any[]>(`${this.apiBase()}/menus`).subscribe({
        next: (rows) => {
          if (!rows.length) {
            this.menusState.set([]);
            return;
          }
          // The menu endpoint owns the header; items live in a separate table.
          forkJoin(rows.map((row) => this.http!.get<any[]>(`${this.apiBase()}/menus/${row.id}/items`)))
            .subscribe({
              next: (itemLists) =>
                this.menusState.set(
                  rows.map((row, index) => mapCafeteriaMenu({ ...row, items: itemLists[index] })),
                ),
              error: () => this.menusState.set(rows.map(mapCafeteriaMenu)),
            });
        },
        error: () => {},
      });
      this.http!.get<any[]>(`${this.apiBase()}/orders?userId=${DEMO_USER_ID}`).subscribe({
        next: (rows) => this.ordersState.set(rows.map(mapCafeteriaOrder)),
        error: () => {},
      });
    }
  }

  private apiBase(): string {
    return this.cfg!.apiBaseUrl();
  }

  readonly menus = this.menusState.asReadonly();
  readonly orders = this.ordersState.asReadonly();

  readonly todayMenu = computed(() => {
    const today = new Date();
    return (
      this.menusState().find((menu) => this.sameDay(menu.date, today)) ?? this.menusState()[0]
    );
  });

  menuFor(date: Date): CafeteriaMenu | undefined {
    return this.menusState().find((menu) => this.sameDay(menu.date, date));
  }

  findMenu(menuId: string): CafeteriaMenu | undefined {
    return this.menusState().find((menu) => menu.id === menuId);
  }

  findOrder(orderId: string): CafeteriaOrder | undefined {
    return this.ordersState().find((order) => order.id === orderId);
  }

  /** Newest active reservation first, scoped to one diner. Cancelled receipts stay in the DB but are hidden. */
  ordersFor(userId: string = DEMO_USER_ID): CafeteriaOrder[] {
    return this.ordersState()
      .filter((order) => order.userId === userId && order.status !== 'CANCELLED')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /** The dish the diner most recently reserved, if any. */
  latestOrderFor(userId: string = DEMO_USER_ID): CafeteriaOrder | undefined {
    return this.ordersFor(userId)[0];
  }

  hasReserved(menuId: string, itemId: string, userId: string = DEMO_USER_ID): boolean {
    return this.ordersState().some(
      (order) =>
        order.status !== 'CANCELLED' &&
        order.menuId === menuId &&
        order.itemId === itemId &&
        order.userId === userId,
    );
  }

  /**
   * Reserve one dish from a menu. Reserving the same dish twice returns the
   * existing receipt instead of creating a duplicate.
   */
  reserve(input: CafeteriaOrderInput): CafeteriaOrder | undefined {
    const menu = this.findMenu(input.menuId);
    const item = menu?.items.find((candidate) => candidate.id === input.itemId);
    if (!menu || !item) {
      return undefined;
    }

    const userId = input.userId ?? DEMO_USER_ID;
    const existing = this.ordersState().find(
      (order) =>
        order.status !== 'CANCELLED' &&
        order.menuId === menu.id &&
        order.itemId === item.id &&
        order.userId === userId,
    );
    if (existing) {
      return existing;
    }

    const reference = this.createReference(menu.date);
    const order: CafeteriaOrder = {
      id: `caf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      reference,
      userId,
      menuId: menu.id,
      itemId: item.id,
      itemName: item.name,
      menuLabel: menu.meal,
      building: menu.building,
      date: menu.date,
      pickupTime: menu.openingHours,
      price: item.price,
      createdAt: new Date(),
      qrPayload: `SMARTCAMPUS|CAFETERIA|${reference}|${userId}|${item.id}`,
      status: 'CONFIRMED',
    };

    this.commitOrders([order, ...this.ordersState()]);
    if (!environment.useMocks) {
      // A fresh key per attempt keeps a retry idempotent without resurrecting
      // a cancelled receipt from an earlier reservation of the same dish.
      const idempotencyKey = `caf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      const headers = new HttpHeaders({ 'Idempotency-Key': idempotencyKey });
      this.http!.post<any>(`${this.apiBase()}/orders`, {
        menuId: menu.id,
        itemId: item.id,
        userId,
        idempotencyKey,
      }, { headers }).subscribe({
        next: (row) => this.replaceOrder(order.id, mapCafeteriaOrder(row)),
        error: () => {
          this.commitOrders(this.ordersState().filter((candidate) => candidate.id !== order.id));
          // A 409 means another tab already owns the active receipt; reconcile
          // from Supabase so the UI shows the backend row instead of the temp one.
          this.refreshOrders(userId);
        },
      });
    }
    return order;
  }

  /** Cancel one reservation. Only the diner who booked it can cancel. */
  cancel(orderId: string, userId: string = DEMO_USER_ID): boolean {
    const order = this.findOrder(orderId);
    if (!order || order.userId !== userId || order.status === 'CANCELLED') {
      return false;
    }

    const cancelled: CafeteriaOrder = { ...order, status: 'CANCELLED' };
    this.replaceOrder(orderId, cancelled);
    if (!environment.useMocks) {
      this.http!.post<{ cancelled: boolean }>(
        `${this.apiBase()}/orders/${orderId}/cancel`,
        {},
        { params: { userId } },
      ).subscribe({
        next: (result) => {
          if (!result?.cancelled) this.replaceOrder(orderId, order);
        },
        error: () => this.replaceOrder(orderId, order),
      });
    }
    return true;
  }

  private replaceOrder(id: string, order: CafeteriaOrder): void {
    this.commitOrders(
      this.ordersState().map((candidate) => (candidate.id === id ? order : candidate)),
    );
  }

  private refreshOrders(userId: string): void {
    this.http!.get<any[]>(`${this.apiBase()}/orders?userId=${userId}`).subscribe({
      next: (rows) => this.ordersState.set(rows.map(mapCafeteriaOrder)),
      error: () => {},
    });
  }

  private commitOrders(orders: CafeteriaOrder[]): void {
    this.ordersState.set(orders);
  }

  private loadOrders(menus: CafeteriaMenu[]): CafeteriaOrder[] {
    return this.seedOrders(menus);
  }

  private seedOrders(menus: CafeteriaMenu[]): CafeteriaOrder[] {
    const menu = menus[0];
    const item = menu?.items[0];
    if (!menu || !item) {
      return [];
    }

    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - 1);

    return [
      {
        id: 'caf-seed-1',
        reference: 'CAF-SEED-001',
        userId: DEMO_USER_ID,
        menuId: menu.id,
        itemId: item.id,
        itemName: item.name,
        menuLabel: menu.meal,
        building: menu.building,
        date: menu.date,
        pickupTime: menu.openingHours,
        price: item.price,
        createdAt,
        qrPayload: `SMARTCAMPUS|CAFETERIA|CAF-SEED-001|${DEMO_USER_ID}|${item.id}`,
      },
    ];
  }

  private createReference(date: Date): string {
    const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(
      date.getDate(),
    ).padStart(2, '0')}`;
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `CAF-${stamp}-${suffix}`;
  }

  private sameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  private seedMenus(): CafeteriaMenu[] {
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
            description: 'Cuisse de poulet rôtie, pommes de terre fondantes et sauce au thym.',
            dietaryLabels: ['Sans gluten'],
            allergens: [],
            price: 9.5,
          },
          {
            id: 'mi-2',
            name: 'Gratin de courgettes',
            description: 'Courgettes du marché, béchamel maison et fromage gratiné.',
            dietaryLabels: ['Végétarien'],
            allergens: ['Lait'],
            price: 7,
          },
          {
            id: 'mi-3',
            name: 'Salade de fruits frais',
            description: 'Fruits de saison coupés minute, sans sucre ajouté.',
            dietaryLabels: ['Vegan', 'Sans gluten'],
            allergens: [],
            price: 4.5,
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
            description: 'Semoule fine, carottes, courgettes, pois chiches et bouillon parfumé.',
            dietaryLabels: ['Vegan'],
            allergens: ['Gluten'],
            price: 8.5,
          },
          {
            id: 'mi-5',
            name: 'Merguez de bœuf',
            description: 'Merguez grillées, harissa douce et salade de tomates.',
            dietaryLabels: [],
            allergens: ['Gluten'],
            price: 9,
          },
          {
            id: 'mi-6',
            name: 'Yaourt nature',
            description: 'Yaourt fermier servi nature ou avec un filet de miel.',
            dietaryLabels: ['Végétarien'],
            allergens: ['Lait'],
            price: 3.5,
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
            description: 'Pâtes fraîches, pesto de basilic et copeaux de parmesan.',
            dietaryLabels: ['Végétarien'],
            allergens: ['Gluten', 'Lait', 'Fruits à coque'],
            price: 9,
          },
          {
            id: 'mi-8',
            name: 'Filet de poisson',
            description: 'Filet de poisson grillé, riz citronné et légumes verts.',
            dietaryLabels: ['Sans gluten'],
            allergens: ['Poisson'],
            price: 10.5,
          },
          {
            id: 'mi-9',
            name: 'Tiramisu',
            description: 'Tiramisu classique au café, préparé sur place.',
            dietaryLabels: ['Végétarien'],
            allergens: ['Gluten', 'Lait', 'Œuf'],
            price: 5,
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
            description: 'Quinoa, falafels croustillants, avocat et sauce tahini.',
            dietaryLabels: ['Vegan', 'Sans gluten'],
            allergens: ['Sésame'],
            price: 9.5,
          },
          {
            id: 'mi-11',
            name: 'Soupe de lentilles',
            description: 'Lentilles corail, cumin et citron, servie avec du pain.',
            dietaryLabels: ['Vegan'],
            allergens: [],
            price: 6.5,
          },
          {
            id: 'mi-12',
            name: 'Mousse au chocolat',
            description: 'Mousse légère au chocolat noir 70 %.',
            dietaryLabels: ['Végétarien'],
            allergens: ['Lait', 'Œuf'],
            price: 4.5,
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
            description: 'Poisson confit, citron beldi, olives et coriandre fraîche.',
            dietaryLabels: ['Sans gluten'],
            allergens: ['Poisson'],
            price: 11,
          },
          {
            id: 'mi-14',
            name: 'Riz aux amandes',
            description: 'Riz safrané, amandes grillées et raisins secs.',
            dietaryLabels: ['Vegan'],
            allergens: ['Fruits à coque'],
            price: 6,
          },
          {
            id: 'mi-15',
            name: 'Orange fraîche',
            description: 'Orange pressée du jour, sans sucre ajouté.',
            dietaryLabels: ['Vegan', 'Sans gluten'],
            allergens: [],
            price: 3.5,
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
