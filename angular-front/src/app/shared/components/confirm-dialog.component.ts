import {
  Component,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  Injector,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';

let nextDialogId = 0;

/** Elements inside the dialog that can hold keyboard focus. */
const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])';

/**
 * PB-25 — modal confirmation.
 *
 * Keyboard behaviour (SCRUM-33):
 * - focus moves into the dialog when it opens and returns to the trigger on close;
 * - Escape cancels;
 * - Tab / Shift+Tab cycle inside the dialog instead of escaping to the page.
 *
 * Destructive actions can require an exact typed phrase. When `confirmPhrase`
 * is set, Confirm stays disabled until the user types `delete <item>`.
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    @if (open()) {
      <div class="backdrop" (click)="cancel()">
        <div
          #dialog
          class="dialog"
          role="alertdialog"
          aria-modal="true"
          tabindex="-1"
          [attr.aria-labelledby]="titleId"
          [attr.aria-describedby]="messageId"
          (keydown.escape)="cancel()"
          (keydown.tab)="trapFocus($event)"
          (click)="$event.stopPropagation()"
        >
          <h3 [id]="titleId">{{ title() }}</h3>
          <p [id]="messageId">{{ message() }}</p>

          @if (confirmPhrase()) {
            <div class="phrase">
              <label class="phrase__label" [attr.for]="phraseInputId">
                Type <code>{{ confirmPhrase() }}</code> to confirm
              </label>
              <input
                #phraseInput
                [id]="phraseInputId"
                class="phrase__input"
                type="text"
                autocomplete="off"
                autocapitalize="off"
                spellcheck="false"
                [attr.aria-describedby]="phraseHintId"
                [value]="typedPhrase()"
                (input)="onPhraseInput($event)"
              />
              <p class="phrase__hint" [id]="phraseHintId">
                Confirmation is disabled until the phrase matches exactly.
              </p>
            </div>
          }

          <div class="actions">
            <button #cancelButton type="button" (click)="cancel()">{{ cancelLabel() }}</button>
            <button
              type="button"
              [class.danger]="danger()"
              [disabled]="!canConfirm()"
              (click)="confirm()"
            >
              {{ confirmLabel() }}
            </button>
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
        padding: var(--space-3);
        background: var(--color-overlay);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
      }

      .dialog {
        width: min(460px, 90vw);
        max-height: calc(100vh - var(--space-6));
        overflow-y: auto;
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

      .dialog:focus {
        outline: none;
      }

      h3 {
        margin: 0 0 var(--space-2);
        color: var(--color-text-strong);
      }

      p {
        margin: 0;
        color: var(--color-text-muted);
      }

      .phrase {
        margin-top: var(--space-4);
        padding: var(--space-3);
        background: color-mix(in srgb, var(--color-danger) 8%, transparent);
        border: 1px solid color-mix(in srgb, var(--color-danger) 28%, transparent);
        border-radius: var(--radius-md);
      }

      .phrase__label {
        display: block;
        margin-bottom: var(--space-2);
        color: var(--color-text);
        font-size: 0.9rem;
      }

      code {
        color: var(--color-text-strong);
        font-weight: 700;
        user-select: all;
      }

      .phrase__input {
        width: 100%;
        min-height: 44px;
        padding: var(--space-2) var(--space-3);
        color: var(--color-text-strong);
        background: var(--color-surface);
        border: 1px solid var(--color-border-strong);
        border-radius: var(--radius-md);
        font: inherit;
      }

      .phrase__input:focus-visible {
        outline: 2px solid var(--color-accent);
        outline-offset: 2px;
      }

      .phrase__hint {
        margin-top: var(--space-2);
        font-size: 0.78rem;
      }

      .actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--space-2);
        margin-top: var(--space-5);
      }

      button {
        min-height: 44px;
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

      button:hover:not(:disabled) {
        background: color-mix(in srgb, var(--color-text-strong) 8%, transparent);
      }

      button.danger {
        color: #fff;
        background: var(--color-danger);
        border-color: var(--color-danger);
      }

      button.danger:hover:not(:disabled) {
        background: color-mix(in srgb, var(--color-danger) 84%, black);
      }

      button:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }

      @media (max-width: 420px) {
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
export class ConfirmDialogComponent {
  open = model(false);
  title = input('Confirmation');
  message = input.required<string>();
  confirmLabel = input('Confirmer');
  cancelLabel = input('Annuler');
  danger = input(false);

  /** When set, the user must type this exact phrase before Confirm is enabled. */
  confirmPhrase = input<string | null>(null);

  confirmed = output<void>();
  cancelled = output<void>();

  protected readonly typedPhrase = signal('');
  protected readonly canConfirm = computed(() => {
    const phrase = this.confirmPhrase();
    return !phrase || this.typedPhrase().trim() === phrase.trim();
  });

  private readonly dialogId = ++nextDialogId;
  readonly titleId = `confirm-title-${this.dialogId}`;
  readonly messageId = `confirm-message-${this.dialogId}`;
  protected readonly phraseInputId = `confirm-phrase-${this.dialogId}`;
  protected readonly phraseHintId = `confirm-phrase-hint-${this.dialogId}`;

  private readonly dialog = viewChild<ElementRef<HTMLElement>>('dialog');
  private readonly cancelButton = viewChild<ElementRef<HTMLElement>>('cancelButton');
  private readonly phraseInput = viewChild<ElementRef<HTMLInputElement>>('phraseInput');
  private readonly injector = inject(Injector);
  private previouslyFocused: HTMLElement | null = null;

  constructor() {
    effect(() => {
      const isOpen = this.open();
      // Re-read the phrase so a target change resets the typed value too.
      this.confirmPhrase();

      if (isOpen) {
        this.typedPhrase.set('');
        this.previouslyFocused = document.activeElement as HTMLElement | null;
        afterNextRender(() => this.focusFirstControl(), { injector: this.injector });
      } else {
        this.restoreFocus();
      }
    });
  }

  confirm(): void {
    if (!this.canConfirm()) {
      return;
    }

    this.open.set(false);
    this.confirmed.emit();
  }

  cancel(): void {
    this.open.set(false);
    this.cancelled.emit();
  }

  protected onPhraseInput(event: Event): void {
    this.typedPhrase.set((event.target as HTMLInputElement).value);
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
    const target =
      this.phraseInput()?.nativeElement ??
      this.cancelButton()?.nativeElement ??
      this.dialog()?.nativeElement;
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
