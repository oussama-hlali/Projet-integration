import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EventItem } from '../models/event.model';

@Injectable({ providedIn: 'root' })
export class RegistrationService {
  private http = inject(HttpClient);

  register(eventId: number) {
    return this.http.post<EventItem>(`/api/events/${eventId}/registration`, {});
  }

  unregister(eventId: number) {
    return this.http.delete<void>(`/api/events/${eventId}/registration`);
  }
}