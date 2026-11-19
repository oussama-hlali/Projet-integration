import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AiService, ChatMessage } from '../../core/services/ai.service';

@Component({
  selector: 'app-assistant',
  imports: [FormsModule],
  templateUrl: './assistant.html',
  styleUrl: './assistant.scss',
})
export class Assistant {
  private readonly ai = inject(AiService);

  readonly messages = this.ai.messages;
  readonly busy = this.ai.busy;

  draft = '';

  send(): void {
    const text = this.draft.trim();
    if (!text || this.busy()) return;
    this.draft = '';
    this.ai.send(text).subscribe();
  }

  clear(): void { this.ai.clear(); }
}
