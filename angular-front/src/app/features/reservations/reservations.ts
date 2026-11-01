import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';

interface Reservation {
  id: number;
  room: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
}

function dateNotInPast(minDate: string) {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value || control.value >= minDate) {
      return null;
    }

    return { dateInPast: true };
  };
}

@Component({
  selector: 'app-reservations',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reservations.html',
  styleUrl: './reservations.scss',
})
export class Reservations {
  private static readonly storageKey = 'smart-campus-reservations';
  private readonly formBuilder = new FormBuilder();
  private readonly reservationList = signal<Reservation[]>(this.loadReservations());

  readonly reservations = this.reservationList.asReadonly();
  readonly today = this.toDateInputValue(new Date());
  readonly submitted = signal(false);
  readonly reservationCreated = signal(false);
  readonly hasReservations = computed(() => this.reservations().length > 0);
  readonly canCreateReservation = computed(() => !this.hasReservations());

  readonly reservationForm = this.formBuilder.nonNullable.group({
    room: ['', Validators.required],
    date: ['', [Validators.required, dateNotInPast(this.today)]],
    startTime: ['', Validators.required],
    endTime: ['', Validators.required],
    purpose: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(120)]],
  });

  isInvalid(controlName: keyof typeof this.reservationForm.controls): boolean {
    const control = this.reservationForm.controls[controlName];
    return control.invalid && (control.touched || this.submitted());
  }

  submitReservation(): void {
    this.submitted.set(true);

    if (!this.canCreateReservation() || this.reservationForm.invalid || !this.hasValidTimeRange()) {
      this.reservationForm.markAllAsTouched();
      return;
    }

    const value = this.reservationForm.getRawValue();
    this.reservationList.update((reservations) => [
      ...reservations,
      {
        id: Date.now(),
        room: value.room,
        date: value.date,
        startTime: value.startTime,
        endTime: value.endTime,
        purpose: value.purpose.trim(),
      },
    ]);
    this.saveReservations();

    this.reservationForm.reset();
    this.submitted.set(false);
    this.reservationCreated.set(true);
  }

  cancel(): void {
    this.reservationForm.reset();
    this.submitted.set(false);
  }

  removeReservation(id: number): void {
    this.reservationList.update((reservations) => reservations.filter((reservation) => reservation.id !== id));
    this.saveReservations();
    this.reservationCreated.set(false);
  }

  hasValidTimeRange(): boolean {
    const { startTime, endTime } = this.reservationForm.getRawValue();
    return !startTime || !endTime || startTime < endTime;
  }

  private toDateInputValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private loadReservations(): Reservation[] {
    const storedReservations = localStorage.getItem(Reservations.storageKey);

    if (!storedReservations) {
      return [];
    }

    const parsedReservations: unknown = JSON.parse(storedReservations);
    if (!Array.isArray(parsedReservations)) {
      return [];
    }

    const validReservations = parsedReservations.filter((reservation): reservation is Reservation => {
      if (!reservation || typeof reservation !== 'object') {
        return false;
      }

      const value = reservation as Record<string, unknown>;
      return (
        typeof value['id'] === 'number' &&
        typeof value['room'] === 'string' &&
        typeof value['date'] === 'string' &&
        typeof value['startTime'] === 'string' &&
        typeof value['endTime'] === 'string' &&
        typeof value['purpose'] === 'string'
      );
    });

    return validReservations.slice(0, 1);
  }

  private saveReservations(): void {
    localStorage.setItem(Reservations.storageKey, JSON.stringify(this.reservations()));
  }
}
