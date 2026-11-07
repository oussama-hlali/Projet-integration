import { Component, inject, output, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import type { LostFoundReportInput } from '../../core/models/lost-found.model';

/**
 * Report form for Lost & Found.
 *
 * The component validates and emits the report; the page owns the store so a
 * submitted report appears in the list immediately.
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
        <label for="report-description">Description <span aria-hidden="true">*</span></label>
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

      <div class="actions">
        <button type="button" class="button button--quiet" (click)="clear()">Clear</button>
        <button type="submit" class="button button--primary">Submit report</button>
      </div>

      @if (success()) {
        <p class="success" role="status">Report submitted. It now appears in the list.</p>
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

  readonly reported = output<LostFoundReportInput>();
  readonly success = signal(false);

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

  clear(): void {
    this.success.set(false);
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
    });
    this.success.set(true);
    this.form.reset({ status: 'LOST' });
  }

  private notInFuture(control: AbstractControl): ValidationErrors | null {
    return control.value && new Date(control.value) > new Date() ? { futureDate: true } : null;
  }
}
