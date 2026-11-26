import { afterNextRender, Component, ElementRef, HostListener, inject, Injector, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AiService } from '../../../core/services/ai.service';
import { NavIconComponent } from '../../../shared/components';

/** Quick prompts are live questions: they call the gateway, not canned replies. */
const QUICK_PROMPTS = [
  'Quelles salles sont disponibles ?',
  'Quels événements arrivent ?',
  'Quel est le menu du jour ?',
] as const;

/**
 * Small bottom-right IA launcher, in the spirit of the Faivra floating button.
 *
 * It is a compact view over the same `AiService` conversation as the full
 * `/assistant` page, so both surfaces stay in sync. Only the presentation
 * (flyout, triangle, fade-in) comes from the reference HTML — no third-party
 * script, tracker or simulated answer is copied.
 */
@Component({
  selector: 'app-assistant-launcher',
  imports: [FormsModule, NavIconComponent],
  templateUrl: './assistant-launcher.html',
  styleUrl: './assistant-launcher.scss',
})
export class AssistantLauncher {
  private readonly ai = inject(AiService);
  private readonly injector = inject(Injector);
  private readonly body = viewChild<ElementRef<HTMLElement>>('body');

  readonly open = signal(false);
  readonly messages = this.ai.messages;
  readonly busy = this.ai.busy;
  readonly quickPrompts = QUICK_PROMPTS;

  draft = '';

  toggle(): void {
    this.open.update((value) => !value);
  }

  close(): void {
    this.open.set(false);
  }

  send(): void {
    const message = this.draft.trim();
    if (!message || this.busy()) return;
    this.draft = '';
    this.post(message);
  }

  ask(prompt: string): void {
    if (this.busy()) return;
    this.post(prompt);
  }

  clear(): void {
    this.ai.clear();
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.open()) {
      event.preventDefault();
      this.close();
    }
  }

  private post(message: string): void {
    this.ai.send(message).subscribe();
    afterNextRender(
      () => {
        const element = this.body()?.nativeElement;
        if (element) element.scrollTop = element.scrollHeight;
      },
      { injector: this.injector },
    );
  }
}
