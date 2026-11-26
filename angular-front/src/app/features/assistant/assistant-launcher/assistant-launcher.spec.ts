import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AiService } from '../../../core/services/ai.service';
import { AssistantLauncher } from './assistant-launcher';

describe('AssistantLauncher', () => {
  let sendSpy: jasmine.Spy;

  beforeEach(async () => {
    sendSpy = jasmine.createSpy('send').and.returnValue(of('Réponse du service'));
    await TestBed.configureTestingModule({
      imports: [AssistantLauncher],
      providers: [
        {
          provide: AiService,
          useValue: {
            messages: signal([]),
            busy: signal(false),
            send: sendSpy,
            clear: jasmine.createSpy('clear'),
          },
        },
      ],
    }).compileComponents();
  });

  function create(): AssistantLauncher {
    const fixture = TestBed.createComponent(AssistantLauncher);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('opens and closes the flyout', () => {
    const launcher = create();
    expect(launcher.open()).toBeFalse();

    launcher.toggle();
    expect(launcher.open()).toBeTrue();

    launcher.close();
    expect(launcher.open()).toBeFalse();
  });

  it('sends quick prompts through the live AI service', () => {
    const launcher = create();
    launcher.ask('Quelles salles sont disponibles ?');

    expect(sendSpy).toHaveBeenCalledOnceWith('Quelles salles sont disponibles ?');
  });

  it('ignores empty drafts', () => {
    const launcher = create();
    launcher.send();

    expect(sendSpy).not.toHaveBeenCalled();
  });
});
