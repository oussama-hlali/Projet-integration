import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  USER_ROLES,
  USER_ROLE_LABELS,
  User,
  UserRole,
} from '../../../core/models/user.model';
import { AdminFailure, AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import {
  BadgeVariant,
  ConfirmDialogComponent,
  EmptyStateComponent,
  PageHeaderComponent,
  StatCardComponent,
  StatusBadgeComponent,
} from '../../../shared/components';

type RoleFilter = 'all' | UserRole;

/**
 * Administrator user directory.
 *
 * New accounts are created with 2FA disabled, so their first sign-in walks
 * them through the authenticator setup. `AdminService` blocks deleting your
 * own account and deleting or demoting the last administrator.
 */
@Component({
  selector: 'app-admin-users',
  imports: [
    ReactiveFormsModule,
    ConfirmDialogComponent,
    EmptyStateComponent,
    PageHeaderComponent,
    StatCardComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.scss',
})
export class AdminUsers {
  private readonly admin = inject(AdminService);
  private readonly userService = inject(UserService);
  private readonly auth = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly users = this.userService.users;
  protected readonly roles = USER_ROLES;
  protected readonly roleLabels = USER_ROLE_LABELS;

  protected readonly editingId = signal<string | null>(null);
  protected readonly search = signal('');
  protected readonly roleFilter = signal<RoleFilter>('all');
  protected readonly feedback = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly passwordError = signal<string | null>(null);
  protected readonly submitted = signal(false);

  protected readonly deleteTarget = signal<User | null>(null);
  protected readonly dialogOpen = signal(false);

  protected readonly form = this.formBuilder.nonNullable.group({
    fullName: ['', [Validators.required, Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email]],
    role: ['STUDENT' as UserRole, Validators.required],
    password: [''],
  });

  protected readonly adminCount = computed(
    () => this.users().filter((user) => user.role === 'ADMINISTRATOR').length,
  );

  protected readonly metrics = computed(() => {
    const users = this.users();
    return [
      { label: 'Accounts', value: users.length, hint: 'In the directory' },
      {
        label: 'Students',
        value: users.filter((user) => user.role === 'STUDENT').length,
        hint: 'Student access',
      },
      {
        label: 'Administrators',
        value: this.adminCount(),
        hint: 'Admin access',
      },
      {
        label: '2FA enabled',
        value: users.filter((user) => user.totpEnabled).length,
        hint: 'Authenticator confirmed',
      },
    ];
  });

  protected readonly filtered = computed(() => {
    const role = this.roleFilter();
    const term = this.search().trim().toLowerCase();

    return this.users()
      .filter(
        (user) =>
          (role === 'all' || user.role === role) &&
          (!term || `${user.fullName} ${user.email}`.toLowerCase().includes(term)),
      )
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  });

  protected readonly hasFilters = computed(
    () => this.roleFilter() !== 'all' || !!this.search().trim(),
  );

  protected isInvalid(controlName: keyof typeof this.form.controls): boolean {
    if (controlName === 'password') {
      return false;
    }

    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || this.submitted());
  }

  protected setSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  protected setRole(event: Event): void {
    this.roleFilter.set((event.target as HTMLSelectElement).value as RoleFilter);
  }

  protected clearFilters(): void {
    this.roleFilter.set('all');
    this.search.set('');
  }

  protected startCreate(): void {
    this.resetForm();
    this.feedback.set(null);
    this.error.set(null);
  }

  protected startEdit(user: User): void {
    this.editingId.set(user.id);
    this.submitted.set(false);
    this.passwordError.set(null);
    this.feedback.set(null);
    this.error.set(null);
    this.form.reset({
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      password: '',
    });
  }

  protected async submit(): Promise<void> {
    this.submitted.set(true);
    this.feedback.set(null);
    this.error.set(null);
    this.passwordError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const password = value.password;
    const id = this.editingId();

    if (!id && !password) {
      this.passwordError.set('A password is required for a new account.');
      return;
    }

    if (password && password.length < 8) {
      this.passwordError.set('Passwords must be at least 8 characters.');
      return;
    }

    const fullName = value.fullName.trim();
    const email = value.email.trim();

    const result = id
      ? await this.admin.updateUser(id, {
          fullName,
          email,
          role: value.role,
          password: password || undefined,
        })
      : await this.admin.createUser({ fullName, email, role: value.role, password });

    if (!result.ok) {
      this.error.set(this.messageFor(result.reason));
      return;
    }

    this.feedback.set(
      id ? `${fullName}'s account was updated.` : `${fullName} was added to the directory.`,
    );
    this.resetForm();
  }

  protected requestDelete(user: User): void {
    this.deleteTarget.set(user);
    this.dialogOpen.set(true);
  }

  protected confirmDelete(): void {
    const target = this.deleteTarget();
    this.deleteTarget.set(null);
    if (!target) {
      return;
    }

    this.feedback.set(null);
    this.error.set(null);
    const result = this.admin.deleteUser(target.id);
    if (!result.ok) {
      this.error.set(this.messageFor(result.reason));
      return;
    }

    if (this.editingId() === target.id) {
      this.resetForm();
    }
    this.feedback.set(`${target.fullName} was removed from the directory.`);
  }

  protected dismissFeedback(): void {
    this.feedback.set(null);
  }

  protected dismissError(): void {
    this.error.set(null);
  }

  protected isSelf(user: User): boolean {
    return this.auth.currentUser()?.id === user.id;
  }

  protected isLastAdmin(user: User): boolean {
    return user.role === 'ADMINISTRATOR' && this.adminCount() <= 1;
  }

  protected cannotDelete(user: User): boolean {
    return this.isSelf(user) || this.isLastAdmin(user);
  }

  protected roleLabel(role: UserRole): string {
    return USER_ROLE_LABELS[role];
  }

  protected roleVariant(role: UserRole): BadgeVariant {
    return role === 'ADMINISTRATOR' ? 'info' : 'neutral';
  }

  protected initials(user: User): string {
    return user.fullName
      .split(' ')
      .filter((part) => part.length > 0)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  private messageFor(reason: AdminFailure): string {
    switch (reason) {
      case 'email-taken':
        return 'Another account already uses that email address.';
      case 'weak-password':
        return 'Passwords must be at least 8 characters.';
      case 'last-admin':
        return 'You cannot remove or demote the last administrator.';
      case 'self-delete':
        return 'You cannot delete the account you are signed in with.';
      case 'not-found':
        return 'That account no longer exists.';
      case 'room-in-use':
        return 'That room still has an active booking.';
    }
  }

  private resetForm(): void {
    this.editingId.set(null);
    this.submitted.set(false);
    this.passwordError.set(null);
    this.form.reset();
  }
}
