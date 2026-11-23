import {
  Component,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  Injector,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';

let nextFormDialogId = 0;

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])';

/**
 * Accessible modal shell for create and edit forms.
 *
 * The projected form lives in the parent template; the footer submit button
 * points at it with the native `form` attribute so validation and `ngSubmit`
 * stay with the feature component.
 */
@Component({
  selector: 'app-form-dialog',
  standalone: true,
  template: `
    @if (open()) {
      <div class="backdrop" (click)="cancel()">
        <div
          #dialog
          class="dialog"
          [class.dialog--wide]="wide()"
          role="dialog"
          aria-modal="true"
          tabindex="-1"
          [attr.aria-labelledby]="titleId"
          [attr.aria-describedby]="subtitle() ? subtitleId : null"
          (keydown.escape)="cancel()"
          (keydown.tab)="trapFocus($event)"
          (click)="$event.stopPropagation()"
        >
          <header class="head">
            <div>
              <h3 [id]="titleId">{{ title() }}</h3>
              @if (subtitle()) {
                <p [id]="subtitleId">{{ subtitle() }}</p>
              }
            </div>
            <button
              type="button"
              class="close"
              aria-label="Close dialog"
              (click)="cancel()"
            >
              &times;
            </button>
          </header>

          <div #body class="body">
            <ng-content></ng-content>
          </div>

          <footer class="actions">
            <button #cancelButton type="button" (click)="cancel()">
              {{ cancelLabel() }}
            </button>
            <button
              type="submit"
              class="submit"
              [attr.form]="formId()"
              [disabled]="saving()"
              (click)="submitted.emit()"
            >
              {{ saving() ? savingLabel() : submitLabel() }}
            </button>
          </footer>
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
        padding: var(--space-3);
        background: var(--color-overlay);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
      }

      .dialog {
        width: min(560px, 94vw);
        max-height: calc(100vh - var(--space-6));
        display: flex;
        flex-direction: column;
        overflow: hidden;
        color: var(--color-text);
        background-color: var(--glass-bg-strong);
        background-image: linear-gradient(180deg, var(--glass-highlight), transparent 36%);
        border: 1px solid var(--glass-border);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-lg);
        backdrop-filter: blur(var(--glass-blur)) saturate(140%);
        -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(140%);
      }

      .dialog--wide {
        width: min(760px, 94vw);
      }

      .dialog:focus {
        outline: none;
      }

      .head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: var(--space-3);
        padding: var(--space-5) var(--space-5) var(--space-3);
        border-bottom: 1px solid var(--glass-border);
      }

      h3 {
        margin: 0;
        color: var(--color-text-strong);
      }

      .head p {
        margin: var(--space-1) 0 0;
        color: var(--color-text-muted);
        font-size: 0.88rem;
      }

      .close {
        flex: 0 0 auto;
        width: 36px;
        height: 36px;
        padding: 0;
        color: var(--color-text-muted);
        background: transparent;
        border: 1px solid transparent;
        border-radius: var(--radius-md);
        cursor: pointer;
        font-size: 1.4rem;
        line-height: 1;
      }

      .close:hover {
        color: var(--color-text-strong);
        background: color-mix(in srgb, var(--color-text-strong) 8%, transparent);
        border-color: var(--color-border);
      }

      .body {
        padding: var(--space-5);
        overflow-y: auto;
      }

      .actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--space-2);
        padding: var(--space-3) var(--space-5) var(--space-5);
        border-top: 1px solid var(--glass-border);
      }

      button {
        min-height: 44px;
        padding: var(--space-2) var(--space-4);
        color: var(--color-text);
        background: transparent;
        border: 1px solid var(--color-border-strong);
        border-radius: var(--radius-md);
        cursor: pointer;
        font: inherit;
        transition:
          background-color var(--transition-fast),
          border-color var(--transition-fast);
      }

      button:hover:not(:disabled) {
        background: color-mix(in srgb, var(--color-text-strong) 8%, transparent);
      }

      button.submit {
        color: #fff;
        background: var(--color-accent);
        border-color: var(--color-accent);
      }

      button.submit:hover:not(:disabled) {
        background: color-mix(in srgb, var(--color-accent) 84%, black);
      }

      button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      :host ::ng-deep .admin-form {
        display: grid;
        gap: var(--space-3);
      }

      @media (max-width: 480px) {
        .head,
        .body,
        .actions {
          padding-left: var(--space-4);
          padding-right: var(--space-4);
        }

        .actions {
          flex-direction: column-reverse;
        }

        .actions button {
          width: 100%;
        }
      }
    `,
  ],
})
export class FormDialogComponent {
  open = model(false);
  title = input.required<string>();
  subtitle = input('');
  formId = input.required<string>();
  submitLabel = input('Save');
  savingLabel = input('Saving…');
  cancelLabel = input('Cancel');
  saving = input(false);
  wide = input(false);

  cancelled = output<void>();
  submitted = output<void>();

  private readonly dialogId = ++nextFormDialogId;
  readonly titleId = `form-dialog-title-${this.dialogId}`;
  readonly subtitleId = `form-dialog-subtitle-${this.dialogId}`;

  private readonly dialog = viewChild<ElementRef<HTMLElement>>('dialog');
  private readonly body = viewChild<ElementRef<HTMLElement>>('body');
  private readonly cancelButton = viewChild<ElementRef<HTMLElement>>('cancelButton');
  private readonly injector = inject(Injector);
  private previouslyFocused: HTMLElement | null = null;

  constructor() {
    effect(() => {
      if (this.open()) {
        this.previouslyFocused = document.activeElement as HTMLElement | null;
        afterNextRender(() => this.focusFirstControl(), { injector: this.injector });
      } else {
        this.restoreFocus();
      }
    });
  }

  cancel(): void {
    this.open.set(false);
    this.cancelled.emit();
  }

  /** Keeps Tab and Shift+Tab inside the dialog while it is open. */
  trapFocus(event: Event): void {
    const keyEvent = event as KeyboardEvent;
    const dialog = this.dialog()?.nativeElement;
    if (!dialog) {
      return;
    }

    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (!focusable.length) {
      keyEvent.preventDefault();
      dialog.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (keyEvent.shiftKey && (active === first || active === dialog)) {
      keyEvent.preventDefault();
      last.focus();
    } else if (!keyEvent.shiftKey && active === last) {
      keyEvent.preventDefault();
      first.focus();
    }
  }

  private focusFirstControl(): void {
    const body = this.body()?.nativeElement;
    const preferred = body?.querySelector<HTMLElement>('[autofocus]');
    const firstControl = body?.querySelector<HTMLElement>(FOCUSABLE);
    const target = preferred ?? firstControl ?? this.cancelButton()?.nativeElement ?? this.dialog()?.nativeElement;
    target?.focus();
  }

  private restoreFocus(): void {
    const previous = this.previouslyFocused;
    this.previouslyFocused = null;

    if (previous && document.contains(previous)) {
      previous.focus();
    }
  }
}
