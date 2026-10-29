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
  styles: [
    `
      .backdrop {
        position: fixed;
        inset: 0;
        z-index: var(--z-modal);
        display: grid;
        place-items: center;
        background: var(--color-overlay);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
      }

      .dialog {
        width: min(420px, 90vw);
        padding: var(--space-5);
        color: var(--color-text);
        background-color: var(--glass-bg-strong);
        background-image: linear-gradient(180deg, var(--glass-highlight), transparent 36%);
        border: 1px solid var(--glass-border);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-lg);
        backdrop-filter: blur(var(--glass-blur)) saturate(140%);
        -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(140%);
      }

      h3 {
        margin: 0 0 var(--space-2);
        color: var(--color-text-strong);
      }

      p {
        margin: 0;
        color: var(--color-text-muted);
      }

      .actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--space-2);
        margin-top: var(--space-5);
      }

      button {
        padding: var(--space-2) var(--space-4);
        color: var(--color-text);
        background: transparent;
        border: 1px solid var(--color-border-strong);
        border-radius: var(--radius-md);
        cursor: pointer;
        transition:
          background-color var(--transition-fast),
          border-color var(--transition-fast);
      }

      button:hover {
        background: color-mix(in srgb, var(--color-text-strong) 8%, transparent);
      }

      button.danger {
        color: #fff;
        background: var(--color-danger);
        border-color: var(--color-danger);
      }

      button.danger:hover {
        background: color-mix(in srgb, var(--color-danger) 84%, black);
      }
    `,
  ],
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
