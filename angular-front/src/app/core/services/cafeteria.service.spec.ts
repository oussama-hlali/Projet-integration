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

  it('reserves a dish with a QR payload', () => {
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

});
