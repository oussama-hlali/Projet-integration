/**
 * User model, aligned with `SmartCampus_ClassDiagram_V0`.
 *
 * A user owns exactly one `Preferences` object (composition in the diagram).
 * Profile and preference edits are exposed by `UserService`.
 */

export type UserRole = 'STUDENT' | 'ADMINISTRATOR';

export const USER_ROLES: readonly UserRole[] = ['STUDENT', 'ADMINISTRATOR'];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  STUDENT: 'Student',
  ADMINISTRATOR: 'Administrator',
};

export interface Preferences {
  language: string;
  notificationsEnabled: boolean;
  theme: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  preferences: Preferences;
}

/** Values collected by the profile form. */
export type UpdateProfileInput = Pick<User, 'fullName' | 'email' | 'avatarUrl'>;

export type UpdatePreferencesInput = Preferences;
