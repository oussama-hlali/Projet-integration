import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth.service';
import { UserService } from './user.service';

describe('AuthService registration', () => {
  let auth: AuthService;
  let users: UserService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    auth = TestBed.inject(AuthService);
    users = TestBed.inject(UserService);
  });

  afterEach(() => localStorage.clear());

  it('always creates a student account that still needs 2FA setup', async () => {
    const result = await auth.register({
      fullName: 'New Student',
      email: 'new.student@campus.tn',
      password: 'student123',
    });

    expect(result).toEqual({ ok: false, reason: 'setup-required' });
    const user = users.findByEmail('new.student@campus.tn');
    expect(user).toBeDefined();
    expect(user?.role).toBe('STUDENT');
    expect(user?.totpEnabled).toBeFalse();
  });

  it('never inherits an existing admin session when a student signs up', async () => {
    const admin = users.findByEmail('sami.benali@campus.tn');
    expect(admin?.role).toBe('ADMINISTRATOR');

    await auth.login('sami.benali@campus.tn', 'admin123');
    const code = await auth.currentTotpCode(admin!.totpSecret!);
    expect((await auth.setupTotp(code)).ok).toBeTrue();
    expect(auth.isAdmin()).toBeTrue();

    const result = await auth.register({
      fullName: 'Second Student',
      email: 'second.student@campus.tn',
      password: 'student123',
    });

    expect(result).toEqual({ ok: false, reason: 'setup-required' });
    expect(auth.currentUser()).toBeNull();
    expect(auth.pendingUser()?.role).toBe('STUDENT');
  });
});
