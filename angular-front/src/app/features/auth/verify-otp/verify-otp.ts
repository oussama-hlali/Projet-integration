import { Component, inject, signal, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { ThemeToggleComponent } from '../../../shared/components/theme-toggle.component';

@Component({
  selector: 'app-verify-otp',
  imports: [ReactiveFormsModule, ThemeToggleComponent],
  templateUrl: './verify-otp.html',
  styleUrl: '../login/login.scss',
})
export class VerifyOtp implements OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly pendingEmail = signal(this.auth.pendingUser()?.email ?? '');

  readonly form = this.formBuilder.nonNullable.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  async submit(): Promise<void> {
    this.error.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const result = await this.auth.verifyOtp(this.form.getRawValue().code);
    this.loading.set(false);

    if (!result.ok) {
      this.error.set('Invalid or expired code. Try again.');
      return;
    }

    await this.router.navigateByUrl(this.auth.isAdmin() ? '/admin' : '/dashboard');
  }

  cancel(): void {
    this.auth.cancelPending();
    void this.router.navigateByUrl('/login');
  }

  ngOnDestroy(): void {}
}
