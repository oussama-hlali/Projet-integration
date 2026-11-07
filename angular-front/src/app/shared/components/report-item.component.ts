import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import type { ReportItemPayload } from '../../core/models/report-item.model';
import { PageHeaderComponent } from './page-header.component';

@Component({
  selector: 'app-report-item',
  standalone: true,
  imports: [ReactiveFormsModule, PageHeaderComponent],
  template: `
    <app-page-header title="Signaler un objet" subtitle="Objet perdu ou trouvé" />

    <form [formGroup]="form" (ngSubmit)="submit()" novalidate class="form">

      <label>Type
        <select formControlName="type">
          <option value="lost">Perdu</option>
          <option value="found">Trouvé</option>
        </select>
      </label>

      <label>Titre
        <input formControlName="title" />
        @if (invalid('title')) {
          <small class="error">
            @if (form.controls.title.hasError('required')) { Le titre est obligatoire. }
            @else if (form.controls.title.hasError('minlength')) { 3 caractères minimum. }
            @else if (form.controls.title.hasError('maxlength')) { 80 caractères maximum. }
          </small>
        }
      </label>

      <label>Catégorie
        <select formControlName="category">
          <option value="">-- Choisir --</option>
          @for (c of categories; track c) { <option [value]="c">{{ c }}</option> }
        </select>
        @if (invalid('category')) { <small class="error">Choisissez une catégorie.</small> }
      </label>

      <label>Description
        <textarea rows="4" formControlName="description"></textarea>
        @if (invalid('description')) {
          <small class="error">
            @if (form.controls.description.hasError('required')) { La description est obligatoire. }
            @else if (form.controls.description.hasError('minlength')) { 10 caractères minimum. }
          </small>
        }
      </label>

      <label>Lieu
        <input formControlName="location" />
        @if (invalid('location')) { <small class="error">Le lieu est obligatoire.</small> }
      </label>

      <label>Date
        <input type="date" formControlName="date" [max]="today" />
        @if (invalid('date')) {
          <small class="error">
            @if (form.controls.date.hasError('required')) { La date est obligatoire. }
            @else if (form.controls.date.hasError('futureDate')) { La date ne peut pas être dans le futur. }
          </small>
        }
      </label>

      <label>Téléphone (optionnel)
        <input formControlName="contactPhone" placeholder="12345678" />
        @if (invalid('contactPhone')) { <small class="error">8 chiffres attendus.</small> }
      </label>

      <div class="actions">
        <button type="button" (click)="form.reset({ type: 'lost' })">Effacer</button>
        <button type="submit" [disabled]="submitting()">Envoyer</button>
      </div>

      @if (success()) { <p class="success">Signalement envoyé.</p> }
    </form>
  `,
  styles: [`
    .form { display:flex; flex-direction:column; gap:1rem; max-width:480px; }
    label { display:flex; flex-direction:column; gap:.25rem; font-size:.9rem; }
    input, select, textarea { padding:.5rem; border:1px solid #d1d5db; border-radius:.5rem; font:inherit; }
    input.ng-invalid.ng-touched, select.ng-invalid.ng-touched, textarea.ng-invalid.ng-touched { border-color:#dc2626; }
    .error { color:#dc2626; }
    .success { color:#166534; }
    .actions { display:flex; justify-content:flex-end; gap:.5rem; }
  `],
})
export class ReportItemComponent {
  private fb = inject(FormBuilder).nonNullable;

  categories = ['Électronique', 'Documents', 'Vêtements', 'Clés', 'Autre'];
  today = new Date().toISOString().split('T')[0];

  submitting = signal(false);
  success = signal(false);

  form = this.fb.group({
    type: ['lost', Validators.required],
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(80)]],
    category: ['', Validators.required],
    description: ['', [Validators.required, Validators.minLength(10)]],
    location: ['', Validators.required],
    date: ['', [Validators.required, this.notInFuture]],
    contactPhone: ['', Validators.pattern(/^\d{8}$/)],
  });

  invalid(name: keyof typeof this.form.controls) {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  private notInFuture(control: { value: string }) {
    return control.value && new Date(control.value) > new Date() ? { futureDate: true } : null;
  }

  submit() {
    this.success.set(false);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    const payload = this.form.getRawValue() as ReportItemPayload;
    console.log(payload); // remplace par l'appel au service/API
    this.submitting.set(false);
    this.success.set(true);
    this.form.reset({ type: 'lost' });
  }
}