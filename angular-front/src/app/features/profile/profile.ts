import { Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { UserService } from '../../core/services/user.service';
import { PageHeaderComponent } from '../../shared/components';

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule, RouterLink, PageHeaderComponent],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile {
  private readonly auth = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly themeService = inject(ThemeService);
  private readonly formBuilder = inject(FormBuilder);

  readonly user = this.auth.currentUser;

  readonly profileFeedback = signal<string | null>(null);
  readonly preferencesFeedback = signal<string | null>(null);
  readonly savingProfile = signal(false);
  readonly savingPreferences = signal(false);

  readonly profileForm = this.formBuilder.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email]],
    avatarUrl: [''],
  });

  readonly preferencesForm = this.formBuilder.nonNullable.group({
    language: ['fr', Validators.required],
    notificationsEnabled: [true],
    theme: ['light' as 'light' | 'dark', Validators.required],
  });

  constructor() {
    effect(() => {
      const current = this.user();
      if (!current) {
        return;
      }

      this.profileForm.reset({
        fullName: current.fullName,
        email: current.email,
        avatarUrl: current.avatarUrl,
      });
      this.preferencesForm.reset({
        language: current.preferences.language,
        notificationsEnabled: current.preferences.notificationsEnabled,
        theme: current.preferences.theme === 'dark' ? 'dark' : 'light',
      });
    });
  }

  isProfileInvalid(controlName: 'fullName' | 'email'): boolean {
    const control = this.profileForm.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  saveProfile(): void {
    const current = this.user();
    if (!current || this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.savingProfile.set(true);
    const values = this.profileForm.getRawValue();
    this.userService.updateProfile(current.id, {
      fullName: values.fullName.trim(),
      email: values.email.trim(),
      avatarUrl: values.avatarUrl.trim(),
    });
    this.savingProfile.set(false);
    this.profileFeedback.set('Profile updated.');
  }

  savePreferences(): void {
    const current = this.user();
    if (!current || this.preferencesForm.invalid) {
      this.preferencesForm.markAllAsTouched();
      return;
    }

    this.savingPreferences.set(true);
    const values = this.preferencesForm.getRawValue();
    this.userService.updatePreferences(current.id, {
      language: values.language,
      notificationsEnabled: values.notificationsEnabled,
      theme: values.theme,
    });

    if (values.theme !== this.themeService.theme()) {
      this.themeService.set(values.theme);
    }

    this.savingPreferences.set(false);
    this.preferencesFeedback.set('Preferences saved.');
  }

  dismissProfileFeedback(): void {
    this.profileFeedback.set(null);
  }

  dismissPreferencesFeedback(): void {
    this.preferencesFeedback.set(null);
  }
}
