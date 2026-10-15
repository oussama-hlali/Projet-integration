/**
 * Minimal user model for the Sprint 1 foundation.
 * Teammate 3 owns and extends this file — do NOT delete it.
 */

export type UserRole = 'student' | 'administrator';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}
