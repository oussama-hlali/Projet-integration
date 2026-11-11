import { Component, computed, inject, input, output, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import type { LostFoundReportInput } from '../../core/models/lost-found.model';

/** A campus member that can be mentioned in a post. */
export interface TagPerson {
  id: string;
  name: string;
}

/**
 * Community composer for Lost & Found.
 *
 * The component validates the post, lets the author tag the people involved
 * (for example the student who lost their keys) and emits the result; the page
 * owns the store so a submitted post appears in the feed immediately.
 */
@Component({
  selector: 'app-report-item',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" novalidate class="form">
      <div class="form-row">
        <div class="form-field">
          <label for="report-status">Status <span aria-hidden="true">*</span></label>
          <select id="report-status" class="control" formControlName="status">
            <option value="LOST">I lost something</option>
            <option value="FOUND">I found something</option>
          </select>
        </div>

        <div class="form-field">
          <label for="report-category">Category <span aria-hidden="true">*</span></label>
          <select
            id="report-category"
            class="control"
            formControlName="category"
            [class.control--invalid]="invalid('category')"
            [attr.aria-invalid]="invalid('category')"
          >
            <option value="" disabled>Select a category</option>
            @for (category of categories; track category) {
              <option [value]="category">{{ category }}</option>
            }
          </select>
          @if (invalid('category')) {
            <p class="field-error">Choose a category.</p>
          }
        </div>
      </div>

      <div class="form-field">
        <label for="report-title">Title <span aria-hidden="true">*</span></label>
        <input
          id="report-title"
          class="control"
          formControlName="title"
          placeholder="e.g. Carte étudiante"
          [class.control--invalid]="invalid('title')"
          [attr.aria-invalid]="invalid('title')"
        />
        @if (invalid('title')) {
          <p class="field-error">
            @if (form.controls.title.hasError('required')) {
              The title is required.
            } @else if (form.controls.title.hasError('minlength')) {
              Use at least 3 characters.
            } @else {
              Use at most 80 characters.
            }
          </p>
        }
      </div>

      <div class="form-field">
        <label for="report-description">What happened? <span aria-hidden="true">*</span></label>
        <textarea
          id="report-description"
          class="control"
          rows="3"
          formControlName="description"
          placeholder="Colour, brand, distinguishing details…"
          [class.control--invalid]="invalid('description')"
          [attr.aria-invalid]="invalid('description')"
        ></textarea>
        @if (invalid('description')) {
          <p class="field-error">
            @if (form.controls.description.hasError('required')) {
              The description is required.
            } @else {
              Use at least 10 characters.
            }
          </p>
        }
      </div>

      <div class="form-row">
        <div class="form-field">
          <label for="report-location">Location <span aria-hidden="true">*</span></label>
          <input
            id="report-location"
            class="control"
            formControlName="location"
            placeholder="e.g. Bibliothèque"
            [class.control--invalid]="invalid('location')"
            [attr.aria-invalid]="invalid('location')"
          />
          @if (invalid('location')) {
            <p class="field-error">The location is required.</p>
          }
        </div>

        <div class="form-field">
          <label for="report-date">Date <span aria-hidden="true">*</span></label>
          <input
            id="report-date"
            class="control"
            type="date"
            formControlName="reportedAt"
            [max]="today"
            [class.control--invalid]="invalid('reportedAt')"
            [attr.aria-invalid]="invalid('reportedAt')"
          />
          @if (invalid('reportedAt')) {
            <p class="field-error">
              @if (form.controls.reportedAt.hasError('required')) {
                The date is required.
              } @else {
                The date cannot be in the future.
              }
            </p>
          }
        </div>
      </div>

      <div class="form-field">
        <label for="report-phone">Phone (optional)</label>
        <input
          id="report-phone"
          class="control"
          formControlName="contactPhone"
          inputmode="numeric"
          placeholder="12345678"
          [class.control--invalid]="invalid('contactPhone')"
          [attr.aria-invalid]="invalid('contactPhone')"
        />
        @if (invalid('contactPhone')) {
          <p class="field-error">Use 8 digits.</p>
        }
      </div>

      <div class="tag-field">
        <div class="tag-field__head">
          <span class="tag-field__label">Tag people (optional)</span>
          <button
            type="button"
            class="tag-toggle"
            [attr.aria-expanded]="tagging()"
            (click)="toggleTagging()"
          >
            {{ tagging() ? 'Done' : 'Tag people' }}
          </button>
        </div>

        @if (taggedPeople().length) {
          <ul class="tag-chips" aria-label="Tagged people">
            @for (person of taggedPeople(); track person.id) {
              <li class="tag-chip">
                <span>&#64;{{ person.name }}</span>
                <button
                  type="button"
                  class="tag-chip__remove"
                  [attr.aria-label]="'Remove ' + person.name"
                  (click)="removeTag(person.id)"
                >
                  &times;
                </button>
              </li>
            }
          </ul>
        }

        @if (tagging()) {
          <ul class="tag-people">
            @for (person of people(); track person.id) {
              <li>
                <label class="tag-person">
                  <input
                    type="checkbox"
                    [checked]="tagged().includes(person.id)"
                    (change)="toggleTag(person.id)"
                  />
                  <span class="tag-person__avatar" aria-hidden="true">{{ person.name.charAt(0) }}</span>
                  <span class="tag-person__name">{{ person.name }}</span>
                </label>
              </li>
            } @empty {
              <li class="tag-people__empty">No other campus members to tag yet.</li>
            }
          </ul>
        }
      </div>

      <div class="actions">
        <button type="button" class="button button--quiet" (click)="clear()">Clear</button>
        <button type="submit" class="button button--primary">Post to community</button>
      </div>

      @if (success()) {
        <p class="success" role="status">Posted. Your item is now in the community feed.</p>
      }
    </form>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .form {
        display: flex;
        flex-direction: column;
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-3);
      }

      .form-field {
        margin-bottom: var(--space-3);
      }

      label {
        display: block;
        margin-bottom: var(--space-2);
        color: var(--color-text-strong);
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-semibold);
      }

      label span {
        color: var(--color-danger);
      }

      .control {
        width: 100%;
        padding: 0.62rem 0.75rem;
        color: var(--color-text);
        background: color-mix(in srgb, var(--color-surface) 55%, transparent);
        border: 1px solid var(--color-border-strong);
        border-radius: var(--radius-md);
        font: inherit;
        font-size: var(--font-size-sm);
        transition:
          border-color var(--transition-fast),
          box-shadow var(--transition-fast),
          background-color var(--transition-fast);
      }

      .control:hover {
        border-color: color-mix(in srgb, var(--color-accent) 40%, var(--color-border-strong));
      }

      .control:focus {
        background: var(--color-surface);
        border-color: var(--color-accent);
        box-shadow: 0 0 0 3px var(--color-accent-soft);
        outline: none;
      }

      textarea.control {
        resize: vertical;
      }

      .control--invalid {
        border-color: var(--color-danger);
      }

      .field-error {
        margin: var(--space-1) 0 0;
        color: var(--color-danger);
        font-size: var(--font-size-xs);
      }

      .tag-field {
        margin-bottom: var(--space-3);
        padding: var(--space-3);
        background: var(--well);
        border: 1px dashed var(--color-border-strong);
        border-radius: var(--radius-md);
      }

      .tag-field__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-2);
      }

      .tag-field__label {
        color: var(--color-text-muted);
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-semibold);
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }

      .tag-toggle {
        padding: 0.3rem 0.7rem;
        color: var(--color-accent-text);
        background: var(--color-accent-soft);
        border: 1px solid color-mix(in srgb, var(--color-accent) 24%, transparent);
        border-radius: var(--radius-full);
        cursor: pointer;
        font: inherit;
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-semibold);
      }

      .tag-toggle:hover {
        background: color-mix(in srgb, var(--color-accent-soft) 70%, var(--color-accent));
      }

      .tag-chips {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-2);
        margin: var(--space-3) 0 0;
        padding: 0;
        list-style: none;
      }

      .tag-chip {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.22rem 0.55rem;
        color: var(--color-accent-text);
        background: var(--color-accent-soft);
        border-radius: var(--radius-full);
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-medium);
      }

      .tag-chip__remove {
        display: inline-grid;
        place-items: center;
        width: 16px;
        height: 16px;
        color: inherit;
        background: transparent;
        border: 0;
        border-radius: 50%;
        cursor: pointer;
        font-size: 0.85rem;
        line-height: 1;
      }

      .tag-chip__remove:hover {
        background: color-mix(in srgb, var(--color-accent) 20%, transparent);
      }

      .tag-people {
        display: grid;
        gap: 2px;
        max-height: 190px;
        margin: var(--space-3) 0 0;
        padding: 0;
        overflow-y: auto;
        list-style: none;
      }

      .tag-person {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        margin: 0;
        padding: 0.4rem 0.5rem;
        border-radius: var(--radius-sm);
        cursor: pointer;
        font-weight: var(--font-weight-medium);
      }

      .tag-person:hover {
        background: color-mix(in srgb, var(--color-surface) 40%, transparent);
      }

      .tag-person input {
        accent-color: var(--color-accent);
      }

      .tag-person__avatar {
        display: inline-grid;
        place-items: center;
        width: 24px;
        height: 24px;
        color: var(--color-accent-contrast);
        background: var(--color-accent);
        border-radius: 50%;
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-bold);
      }

      .tag-person__name {
        color: var(--color-text);
        font-size: var(--font-size-sm);
      }

      .tag-people__empty {
        padding: var(--space-2);
        color: var(--color-text-muted);
        font-size: var(--font-size-sm);
      }

      .actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--space-2);
        margin-top: var(--space-2);
      }

      .success {
        margin: var(--space-3) 0 0;
        padding: var(--space-3);
        color: var(--color-success);
        background: var(--color-success-soft);
        border: 1px solid color-mix(in srgb, var(--color-success) 30%, transparent);
        border-radius: var(--radius-md);
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-medium);
      }

      .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.55rem 0.95rem;
        border: 1px solid transparent;
        border-radius: var(--radius-full);
        cursor: pointer;
        font: inherit;
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-semibold);
        white-space: nowrap;
        transition:
          background-color var(--transition-fast),
          border-color var(--transition-fast),
          color var(--transition-fast),
          transform var(--transition-fast);
      }

      .button:active {
        transform: scale(0.98);
      }

      .button--primary {
        color: var(--color-accent-contrast);
        background: var(--color-accent);
        box-shadow: 0 8px 20px -12px var(--color-accent);
      }

      .button--primary:hover {
        background: var(--color-accent-hover);
      }

      .button--quiet {
        color: var(--color-text);
        background: transparent;
        border-color: var(--color-border-strong);
      }

      .button--quiet:hover {
        background: var(--well);
      }

      @media (max-width: 560px) {
        .form-row {
          grid-template-columns: 1fr;
          gap: 0;
        }

        .actions {
          flex-direction: column-reverse;
        }

        .actions .button {
          width: 100%;
        }
      }
    `,
  ],
})
export class ReportItemComponent {
  private readonly formBuilder = inject(FormBuilder).nonNullable;

  /** Campus members the author can mention. */
  readonly people = input<readonly TagPerson[]>([]);

  readonly reported = output<LostFoundReportInput>();
  readonly success = signal(false);

  readonly tagged = signal<string[]>([]);
  readonly tagging = signal(false);
  readonly taggedPeople = computed(() => {
    const selected = this.tagged();
    return this.people().filter((person) => selected.includes(person.id));
  });

  readonly categories = ['Électronique', 'Documents', 'Vêtements', 'Clés', 'Autre'];
  readonly today = new Date().toISOString().split('T')[0];

  readonly form = this.formBuilder.group({
    status: ['LOST' as 'LOST' | 'FOUND', Validators.required],
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(80)]],
    category: ['', Validators.required],
    description: ['', [Validators.required, Validators.minLength(10)]],
    location: ['', Validators.required],
    reportedAt: ['', [Validators.required, this.notInFuture]],
    contactPhone: ['', Validators.pattern(/^\d{8}$/)],
  });

  invalid(name: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || control.dirty);
  }

  toggleTagging(): void {
    this.tagging.update((open) => !open);
  }

  toggleTag(id: string): void {
    const selected = this.tagged();
    this.tagged.set(
      selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id],
    );
  }

  removeTag(id: string): void {
    this.tagged.set(this.tagged().filter((value) => value !== id));
  }

  clear(): void {
    this.success.set(false);
    this.tagged.set([]);
    this.tagging.set(false);
    this.form.reset({ status: 'LOST' });
  }

  submit(): void {
    this.success.set(false);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.reported.emit({
      status: value.status,
      title: value.title,
      category: value.category,
      description: value.description,
      location: value.location,
      contactPhone: value.contactPhone || undefined,
      reportedAt: new Date(`${value.reportedAt}T12:00:00`),
      taggedUserIds: this.tagged(),
    });
    this.success.set(true);
    this.tagged.set([]);
    this.tagging.set(false);
    this.form.reset({ status: 'LOST' });
  }

  private notInFuture(control: AbstractControl): ValidationErrors | null {
    return control.value && new Date(control.value) > new Date() ? { futureDate: true } : null;
  }
}
