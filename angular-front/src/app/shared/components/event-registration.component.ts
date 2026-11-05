import { Component, inject, input, signal } from '@angular/core';
import { EventItem } from '../../core/models/event.model';
import { RegistrationService } from '../../core/services/registration.service';
import { StatusBadgeComponent } from './status-badge.component';
import { ConfirmDialogComponent } from './confirm-dialog.component';

@Component({
  selector: 'app-event-registration',
  standalone: true,
  imports: [StatusBadgeComponent, ConfirmDialogComponent],
  template: `
    <article class="card">
      <h3>{{ event().title }}</h3>
      <p>{{ event().date }}</p>

      <app-status-badge
        [label]="registered() ? 'Inscrit' : 'Non inscrit'"
        [variant]="registered() ? 'success' : 'neutral'" />

      @if (registered()) {
        <div class="qr" aria-label="QR code placeholder">
          <span>QR</span>
          <small>{{ code() }}</small>
        </div>
        <button type="button" (click)="showConfirm.set(true)" [disabled]="loading()">
          Se désinscrire
        </button>
      } @else {
        <button type="button" (click)="register()" [disabled]="loading()">
          S'inscrire
        </button>
      }

      @if (error()) { <p class="error">{{ error() }}</p> }
    </article>

    <app-confirm-dialog
      [(open)]="showConfirm"
      message="Voulez-vous vraiment vous désinscrire ?"
      confirmLabel="Se désinscrire"
      [danger]="true"
      (confirmed)="unregister()" />
  `,
  styles: [`
    .card { display:flex; flex-direction:column; gap:.75rem; max-width:320px;
            border:1px solid #e5e7eb; border-radius:.75rem; padding:1rem; }
    h3, p { margin:0; }
    .qr { width:160px; height:160px; display:flex; flex-direction:column;
          align-items:center; justify-content:center; gap:.25rem;
          border:2px dashed #9ca3af; border-radius:.5rem; color:#6b7280; }
    .qr span { font-size:2rem; font-weight:700; }
    .error { color:#dc2626; }
  `],
})
export class EventRegistrationComponent {
  private service = inject(RegistrationService);

  event = input.required<EventItem>();

  registered = signal(false);
  code = signal('');
  loading = signal(false);
  error = signal('');
  showConfirm = signal(false);

  ngOnInit() {
    this.registered.set(this.event().registered);
    this.code.set(this.event().registrationCode ?? '');
  }

  register() {
    this.loading.set(true);
    this.error.set('');
    this.service.register(this.event().id).subscribe({
      next: res => {
        this.registered.set(true);
        this.code.set(res.registrationCode ?? `REG-${this.event().id}`);
        this.loading.set(false);
      },
      error: () => { this.error.set("Échec de l'inscription."); this.loading.set(false); },
    });
  }

  unregister() {
    this.loading.set(true);
    this.error.set('');
    this.service.unregister(this.event().id).subscribe({
      next: () => { this.registered.set(false); this.code.set(''); this.loading.set(false); },
      error: () => { this.error.set('Échec de la désinscription.'); this.loading.set(false); },
    });
  }
}