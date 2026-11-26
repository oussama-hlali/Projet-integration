import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Reservation } from '../../../core/models/reservation.model';
import { ReservationService } from '../../../core/services/reservation.service';
import { ToastService } from '../../../core/services/toast.service';
import { ReservationReviewPanel } from './reservation-review-panel';

describe('ReservationReviewPanel', () => {
  const reservation: Reservation = {
    id: 'r1',
    roomId: 'room-1',
    room: 'A101',
    startTime: new Date('2026-11-27T10:00:00'),
    endTime: new Date('2026-11-27T11:00:00'),
    purpose: 'Project meeting',
    status: 'PENDING',
    userId: 'u2',
  };

  let fixture: ComponentFixture<ReservationReviewPanel>;
  let approveSpy: jasmine.Spy;
  let denySpy: jasmine.Spy;

  beforeEach(async () => {
    approveSpy = jasmine.createSpy('approve').and.returnValue({ ...reservation, status: 'CONFIRMED' });
    denySpy = jasmine.createSpy('deny').and.returnValue({ ...reservation, status: 'CANCELLED' });

    await TestBed.configureTestingModule({
      imports: [ReservationReviewPanel],
      providers: [
        {
          provide: ReservationService,
          useValue: {
            pending: signal<readonly Reservation[]>([reservation]),
            approve: approveSpy,
            deny: denySpy,
          },
        },
        {
          provide: ToastService,
          useValue: {
            success: jasmine.createSpy('success'),
            info: jasmine.createSpy('info'),
            error: jasmine.createSpy('error'),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReservationReviewPanel);
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
  });

  it('renders the pending reservation while open', () => {
    expect(fixture.nativeElement.textContent).toContain('A101');
    expect(fixture.nativeElement.textContent).toContain('1 pending request');
  });

  it('approves and declines through the live reservation service', () => {
    const panel = fixture.componentInstance;

    panel['accept'](reservation);
    panel['deny'](reservation);

    expect(approveSpy).toHaveBeenCalledOnceWith('r1');
    expect(denySpy).toHaveBeenCalledOnceWith('r1');
  });

  it('emits closed when dismissed', () => {
    let closed = false;
    fixture.componentInstance.closed.subscribe(() => (closed = true));

    fixture.componentInstance['close']();

    expect(closed).toBeTrue();
  });
});
