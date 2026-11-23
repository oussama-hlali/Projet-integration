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
import { CinematicIntroComponent } from '../../../shared/components/cinematic-intro.component';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, ThemeToggleComponent, CinematicIntroComponent],
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
      void this.router.navigateByUrl(
        this.auth.postAuthDestination(this.route.snapshot.queryParamMap.get('returnUrl')),
      );
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
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    const result = await this.auth.login(email, password);
    this.loading.set(false);

    if (!result.ok) {
      if (result.reason === 'setup-required' || result.reason === 'otp-required') {
        // Carry the original destination through MFA so the user lands back on
        // the page they asked for instead of the role home.
        await this.router.navigate(
          [result.reason === 'setup-required' ? '/setup-2fa' : '/verify-otp'],
          { queryParams: returnUrl ? { returnUrl } : {} },
        );
        return;
      }
      this.error.set('Invalid email or password.');
      return;
    }

    await this.router.navigateByUrl(this.auth.postAuthDestination(returnUrl));
  }
}
