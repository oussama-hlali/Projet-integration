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
  selector: 'app-setup-2fa',
  imports: [ReactiveFormsModule, ThemeToggleComponent],
  templateUrl: './setup-2fa.html',
  styleUrl: '../login/login.scss',
})
export class Setup2fa implements OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);

  private timer: ReturnType<typeof setInterval> | null = null;

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly demoCode = signal<string>('------');

  readonly user = this.auth.pendingUser();
  readonly secret = this.user?.totpSecret ?? '';
  readonly otpAuthUri = this.user ? this.auth.otpAuthUri(this.user) : '';
  readonly qrUrl = this.otpAuthUri
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(this.otpAuthUri)}`
    : '';

  readonly form = this.formBuilder.nonNullable.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  constructor() {
    void this.refreshDemoCode();
    this.timer = setInterval(() => void this.refreshDemoCode(), 1000);
  }

  async refreshDemoCode(): Promise<void> {
    if (!this.secret) {
      return;
    }
    this.demoCode.set(await this.auth.currentTotpCode(this.secret));
  }

  async submit(): Promise<void> {
    this.error.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const result = await this.auth.setupTotp(this.form.getRawValue().code);
    this.loading.set(false);

    if (!result.ok) {
      this.error.set('Invalid or expired code. Try again.');
      return;
    }

    await this.router.navigateByUrl('/dashboard');
  }

  cancel(): void {
    this.auth.cancelPending();
    void this.router.navigateByUrl('/login');
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
