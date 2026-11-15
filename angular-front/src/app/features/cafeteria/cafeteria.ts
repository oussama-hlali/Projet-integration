import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { CafeteriaMenu, CafeteriaOrder, MenuItem } from '../../core/models/cafeteria.model';
import { AuthService } from '../../core/services/auth.service';
import { CafeteriaService } from '../../core/services/cafeteria.service';
import { ToastService } from '../../core/services/toast.service';
import { buildQrMatrix } from '../../core/utils/qr-code';
import {
  ConfirmDialogComponent,
  EmptyStateComponent,
  ServiceLogoComponent,
  StatusBadgeComponent,
} from '../../shared/components';

type DietaryFilter = 'all' | 'Vegan' | 'Végétarien' | 'Sans gluten';

interface DietaryOption {
  value: DietaryFilter;
  label: string;
}

/**
 * PB-09 — Cafeteria.
 *
 * Students browse the week's menus, filter dishes by dietary label and reserve
 * a plate. Every reservation produces a receipt with a QR code that can be
 * shown at the counter.
 */
@Component({
  selector: 'app-cafeteria',
  imports: [
    DatePipe,
    DecimalPipe,
    ConfirmDialogComponent,
    EmptyStateComponent,
    ServiceLogoComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './cafeteria.html',
  styleUrl: './cafeteria.scss',
})
export class Cafeteria {
  private readonly cafeteria = inject(CafeteriaService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly userId = computed(() => this.auth.currentUser()?.id ?? 'u1');

  readonly menus = this.cafeteria.menus;
  readonly selectedDay = signal(this.todayIndex());
  readonly dietaryFilter = signal<DietaryFilter>('all');

  readonly dietaryOptions: readonly DietaryOption[] = [
    { value: 'all', label: 'All dishes' },
    { value: 'Vegan', label: 'Vegan' },
    { value: 'Végétarien', label: 'Vegetarian' },
    { value: 'Sans gluten', label: 'Gluten-free' },
  ];

  readonly selectedOrderId = signal<string | null>(null);
  readonly dialogOpen = signal(false);

  readonly selectedMenu = computed<CafeteriaMenu>(
    () => this.menus()[this.selectedDay()] ?? this.menus()[0],
  );

  readonly items = computed<MenuItem[]>(() => {
    const menu = this.selectedMenu();
    const filter = this.dietaryFilter();
    return filter === 'all'
      ? menu.items
      : menu.items.filter((item) => item.dietaryLabels.includes(filter));
  });

  readonly reservations = computed(() => this.cafeteria.ordersFor(this.userId()));

  readonly latestOrder = computed<CafeteriaOrder | undefined>(() => {
    const id = this.selectedOrderId();
    return (id ? this.cafeteria.findOrder(id) : undefined) ?? this.reservations()[0];
  });

  readonly receiptQr = computed(() => buildQrMatrix(this.latestOrder()?.qrPayload ?? ''));

  readonly cancelMessage = computed(() => {
    const order = this.latestOrder();
    return order
      ? `Cancel your reservation for ${order.itemName}? The receipt and QR code will be removed.`
      : 'Cancel this reservation?';
  });

  readonly upcomingCount = computed(() => this.reservations().length);

  setDay(index: number): void {
    this.selectedDay.set(index);
  }

  setDietaryFilter(filter: DietaryFilter): void {
    this.dietaryFilter.set(filter);
  }

  isToday(menu: CafeteriaMenu): boolean {
    const today = new Date();
    return (
      menu.date.getFullYear() === today.getFullYear() &&
      menu.date.getMonth() === today.getMonth() &&
      menu.date.getDate() === today.getDate()
    );
  }

  countFor(filter: DietaryFilter): number {
    const items = this.selectedMenu().items;
    return filter === 'all'
      ? items.length
      : items.filter((item) => item.dietaryLabels.includes(filter)).length;
  }

  isReserved(item: MenuItem): boolean {
    return this.cafeteria.hasReserved(this.selectedMenu().id, item.id, this.userId());
  }

  reserve(item: MenuItem): void {
    const menu = this.selectedMenu();
    const order = this.cafeteria.reserve({
      menuId: menu.id,
      itemId: item.id,
      userId: this.userId(),
    });

    if (!order) {
      this.toast.warning('Dish unavailable', 'This dish is no longer available. Please pick another one.');
      return;
    }

    this.selectedOrderId.set(order.id);
    this.toast.success(
      'Reservation confirmed',
      `Receipt ${order.reference} is ready. Your QR code is on the right.`,
    );
  }

  requestCancel(): void {
    if (this.latestOrder()) {
      this.dialogOpen.set(true);
    }
  }

  confirmCancel(): void {
    const order = this.latestOrder();
    if (order && this.cafeteria.cancel(order.id, this.userId())) {
      this.selectedOrderId.set(null);
      this.toast.info('Reservation cancelled', 'You can reserve another dish.');
    }
  }

  private todayIndex(): number {
    const today = new Date();
    const index = this.menus().findIndex(
      (menu) =>
        menu.date.getFullYear() === today.getFullYear() &&
        menu.date.getMonth() === today.getMonth() &&
        menu.date.getDate() === today.getDate(),
    );
    return index >= 0 ? index : 0;
  }
}
