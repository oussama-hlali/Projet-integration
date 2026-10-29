import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UserRole } from '../../../core/models/user.model';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeToggleComponent } from '../../../shared/components';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, ThemeToggleComponent],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly form = new FormGroup({
    role: new FormControl<UserRole>('student', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  protected select(role: UserRole): void {
    this.form.controls.role.setValue(role);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.auth.login(this.form.controls.role.value);

    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/dashboard';
    void this.router.navigateByUrl(returnUrl);
  }
}
