import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private users: User[] = [
    {
      id: 'u1',
      fullName: 'Ahmed Wardi',
      email: 'ahmed.wardi@campus.tn',
      role: 'student',
      avatarUrl: 'assets/avatars/u1.png',
      preferences: { language: 'fr', notificationsEnabled: true, theme: 'dark' }
    },
    {
      id: 'u2',
      fullName: 'Oussama Hlali',
      email: 'oussama.hlali@campus.tn',
      role: 'student',
      avatarUrl: 'assets/avatars/u2.png',
      preferences: { language: 'fr', notificationsEnabled: false, theme: 'light' }
    },
    {
      id: 'u3',
      fullName: 'Sami Ben Ali',
      email: 'sami.benali@campus.tn',
      role: 'administrator',
      avatarUrl: 'assets/avatars/u3.png',
      preferences: { language: 'fr', notificationsEnabled: true, theme: 'light' }
    }
  ];

  getUsers(): Observable<User[]> {
    return of(this.users);
  }

  getUserById(id: string): Observable<User | undefined> {
    return of(this.users.find(u => u.id === id));
  }
}