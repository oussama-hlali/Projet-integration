import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { ThemeToggleComponent } from '../../../shared/components/theme-toggle.component';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, ThemeToggleComponent],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  constructor() {
    // Already signed in: skip the login screen and honour the role split.
    if (this.auth.isAuthenticated()) {
      void this.router.navigateByUrl(this.auth.homeRoute());
    }
  }

  isInvalid(controlName: 'email' | 'password'): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  async submit(): Promise<void> {
    this.error.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const { email, password } = this.form.getRawValue();
    const result = await this.auth.login(email, password);
    this.loading.set(false);

    if (!result.ok) {
      if (result.reason === 'setup-required') {
        await this.router.navigateByUrl('/setup-2fa');
        return;
      }
      if (result.reason === 'otp-required') {
        await this.router.navigateByUrl('/verify-otp');
        return;
      }
      this.error.set('Invalid email or password.');
      return;
    }

    await this.router.navigateByUrl(
      this.destinationFor(this.route.snapshot.queryParamMap.get('returnUrl')),
    );
  }

  /**
   * A student must never be sent to `/admin`, and an administrator stays in
   * the admin area even when a stale return URL points at a student page.
   */
  private destinationFor(returnUrl: string | null): string {
    const home = this.auth.homeRoute();
    if (
      !returnUrl ||
      returnUrl === '/login' ||
      returnUrl.startsWith('/verify-otp') ||
      returnUrl.startsWith('/setup-2fa')
    ) {
      return home;
    }

    const wantsAdmin = returnUrl.startsWith('/admin');
    return wantsAdmin === this.auth.isAdmin()
      ? returnUrl
      : home;
  }
}
