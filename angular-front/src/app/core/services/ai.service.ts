import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RuntimeConfigService } from '../config/runtime-config.service';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  at: Date;
}

@Injectable({ providedIn: 'root' })
export class AiService {
  private readonly http = inject(HttpClient);
  private readonly cfg = inject(RuntimeConfigService);

  readonly messages = signal<ChatMessage[]>([]);
  readonly busy = signal(false);

  private base(): string { return this.cfg.apiBaseUrl(); }

  send(message: string, userId = 'u1'): Observable<string> {
    this.messages.update((list) => [...list, { role: 'user', content: message, at: new Date() }]);
    this.busy.set(true);

    if (environment.useMocks) {
      const reply = `I'm the Smart Campus assistant (mock mode). You said: "${message}"`;
      this.messages.update((list) => [...list, { role: 'assistant', content: reply, at: new Date() }]);
      this.busy.set(false);
      return of(reply);
    }

    return new Observable<string>((subscriber) => {
      this.http.post<{ reply: string }>(`${this.base()}/ai/assistant/messages`, { userId, message }).subscribe({
        next: (res) => {
          const reply = res?.reply ?? 'No reply.';
          this.messages.update((list) => [...list, { role: 'assistant', content: reply, at: new Date() }]);
          this.busy.set(false);
          subscriber.next(reply);
          subscriber.complete();
        },
        error: () => {
          const reply = 'Sorry, I could not reach the assistant.';
          this.messages.update((list) => [...list, { role: 'assistant', content: reply, at: new Date() }]);
          this.busy.set(false);
          subscriber.next(reply);
          subscriber.complete();
        },
      });
    });
  }

  clear(): void { this.messages.set([]); }
}
