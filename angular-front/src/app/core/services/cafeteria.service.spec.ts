import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { CafeteriaService } from './cafeteria.service';

const ORDERS_KEY = 'smart-campus.cafeteria-orders';

describe('CafeteriaService', () => {
  let service: CafeteriaService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
    service = TestBed.inject(CafeteriaService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('seeds one priced menu per weekday', () => {
    const menus = service.menus();

    expect(menus.length).toBe(5);
    expect(menus.every((menu) => menu.items.length >= 1)).toBeTrue();
    expect(menus.every((menu) => menu.items.every((item) => item.price > 0))).toBeTrue();
    expect(service.todayMenu().items.length).toBeGreaterThan(0);
  });

  it('reserves a dish and persists a receipt with a QR payload', () => {
    const menu = service.menus()[1];
    const dish = menu.items[0];

    const order = service.reserve({ menuId: menu.id, itemId: dish.id, userId: 'u2' });

    expect(order).toBeDefined();
    expect(order?.reference.startsWith('CAF-')).toBeTrue();
    expect(order?.itemName).toBe(dish.name);
    expect(order?.price).toBe(dish.price);
    expect(order?.qrPayload).toContain('u2');
    expect(order?.qrPayload).toContain(dish.id);
    expect(service.ordersFor('u2').length).toBe(1);

    const stored = JSON.parse(localStorage.getItem(ORDERS_KEY) ?? '[]') as Array<{
      id: string;
      qrPayload: string;
    }>;
    expect(stored.some((entry) => entry.id === order?.id)).toBeTrue();
    expect(stored[0].qrPayload).toContain(order?.reference ?? '');
  });

  it('returns the existing receipt when the same dish is reserved twice', () => {
    const menu = service.menus()[2];
    const dish = menu.items[1];

    const first = service.reserve({ menuId: menu.id, itemId: dish.id, userId: 'u2' });
    const second = service.reserve({ menuId: menu.id, itemId: dish.id, userId: 'u2' });

    expect(second?.id).toBe(first?.id);
    expect(service.ordersFor('u2').length).toBe(1);
    expect(service.hasReserved(menu.id, dish.id, 'u2')).toBeTrue();
    expect(service.hasReserved(menu.id, dish.id, 'u3')).toBeFalse();
  });

  it('rejects unknown menus and dishes', () => {
    expect(service.reserve({ menuId: 'missing', itemId: 'mi-1' })).toBeUndefined();
    expect(service.reserve({ menuId: 'menu-1', itemId: 'missing' })).toBeUndefined();
  });

  it('cancels only the diner own reservation', () => {
    const menu = service.menus()[3];
    const order = service.reserve({
      menuId: menu.id,
      itemId: menu.items[0].id,
      userId: 'u2',
    });

    expect(order).toBeDefined();
    expect(service.cancel(order!.id, 'u3')).toBeFalse();
    expect(service.findOrder(order!.id)).toBeDefined();

    expect(service.cancel(order!.id, 'u2')).toBeTrue();
    expect(service.findOrder(order!.id)).toBeUndefined();
    expect(service.ordersFor('u2').length).toBe(0);
  });

  it('reloads saved receipts as dates after a fresh start', () => {
    localStorage.setItem(
      ORDERS_KEY,
      JSON.stringify([
        {
          id: 'stored-1',
          reference: 'CAF-20261111-TEST',
          userId: 'u2',
          menuId: 'menu-1',
          itemId: 'mi-1',
          itemName: 'Poulet rôti aux herbes',
          menuLabel: 'Poulet rôti & légumes',
          building: 'Cafétéria',
          date: '2026-11-09T00:00:00.000Z',
          pickupTime: '11:30 – 14:30',
          price: 9.5,
          createdAt: '2026-11-11T10:15:00.000Z',
          qrPayload: 'SMARTCAMPUS|CAFETERIA|CAF-20261111-TEST|u2|mi-1',
        },
      ]),
    );

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
    const reloaded = TestBed.inject(CafeteriaService);
    const order = reloaded.findOrder('stored-1');

    expect(order?.reference).toBe('CAF-20261111-TEST');
    expect(order?.date instanceof Date).toBeTrue();
    expect(order?.createdAt instanceof Date).toBeTrue();
    expect(reloaded.ordersFor('u2').length).toBe(1);
  });
});
