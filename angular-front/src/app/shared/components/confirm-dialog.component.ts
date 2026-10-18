import { Component, input, model, output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    @if (open()) {
      <div class="backdrop" (click)="cancel()">
        <div class="dialog" role="alertdialog" aria-modal="true" (click)="$event.stopPropagation()">
          <h3>{{ title() }}</h3>
          <p>{{ message() }}</p>
          <div class="actions">
            <button type="button" (click)="cancel()">{{ cancelLabel() }}</button>
            <button type="button" [class.danger]="danger()" (click)="confirm()">{{ confirmLabel() }}</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .backdrop { position:fixed; inset:0; background:rgba(0,0,0,.4);
                display:grid; place-items:center; z-index:1000; }
    .dialog { background:#fff; border-radius:.75rem; padding:1.5rem; width:min(420px,90vw); }
    h3 { margin:0 0 .5rem; }
    .actions { display:flex; justify-content:flex-end; gap:.5rem; margin-top:1.25rem; }
    button { padding:.5rem 1rem; border-radius:.5rem; border:1px solid #d1d5db; background:#fff; cursor:pointer; }
    button.danger { background:#dc2626; border-color:#dc2626; color:#fff; }
  `],
})
export class ConfirmDialogComponent {
  open = model(false);
  title = input('Confirmation');
  message = input.required<string>();
  confirmLabel = input('Confirmer');
  cancelLabel = input('Annuler');
  danger = input(false);

  confirmed = output<void>();
  cancelled = output<void>();

  confirm() { this.open.set(false); this.confirmed.emit(); }
  cancel() { this.open.set(false); this.cancelled.emit(); }
}