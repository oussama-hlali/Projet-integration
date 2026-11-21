import { AfterViewInit, Component, OnDestroy, inject, signal } from '@angular/core';
import { ThemeService } from '../../core/services/theme.service';

interface IntroLetter {
  readonly display: string;
  readonly space: boolean;
}

interface IntroParticle {
  readonly x: number;
  readonly y: number;
  readonly duration: string;
  readonly delay: string;
}

const TEXT = 'SMART CAMPUS';
const CHAR_DELAY = 75;

/**
 * Cinematic brand intro for the authentication visual pane.
 *
 * The original stand-alone demo drove every step with direct DOM writes and a
 * raw `<script>` tag. Here the same choreography is expressed with signals and
 * timed state changes. The logo variant follows the app's ThemeService, so the
 * existing global theme toggle stays the single source of truth.
 */
@Component({
  selector: 'app-cinematic-intro',
  standalone: true,
  template: `
    <div class="grid-bg" aria-hidden="true"></div>
    <div class="particles" aria-hidden="true">
      @for (particle of particles; track $index) {
        <span
          class="particle"
          [style.left.%]="particle.x"
          [style.top.%]="particle.y"
          [style.--dur]="particle.duration"
          [style.--delay]="particle.delay"
        ></span>
      }
    </div>

    <div class="stage">
      <div class="logo-arena" aria-hidden="true">
        <div class="ambient-halo" [class.active]="haloActive()"></div>
        <div class="shockwave ring-1" [class.active]="ringsActive()"></div>
        <div class="shockwave ring-2" [class.active]="ringsActive()"></div>

        <div class="logo-wrapper" [class.revealed]="revealed()">
          <svg
            class="brand-svg brand-svg--dark"
            [class.hidden-logo]="!isDark()"
            viewBox="0 0 200 200"
            xmlns="http://www.w3.org/2000/svg"
            focusable="false"
          >
            <defs>
              <linearGradient id="scIntroDarkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#0f766e" />
                <stop offset="55%" stop-color="#0e7490" />
                <stop offset="100%" stop-color="#0369a1" />
              </linearGradient>
              <clipPath id="scIntroBadgeClipDark">
                <rect x="6" y="6" width="188" height="188" rx="46" />
              </clipPath>
            </defs>

            <g clip-path="url(#scIntroBadgeClipDark)">
              <rect
                class="svg-badge"
                x="6"
                y="6"
                width="188"
                height="188"
                rx="46"
                fill="url(#scIntroDarkGrad)"
              />

              <!-- Wi-Fi signal -->
              <circle class="wifi-dot" cx="100" cy="43" r="10" fill="#99f6e4" />
              <path
                class="wifi-arc-1"
                d="M74 33 A36 36 0 0 1 126 33"
                fill="none"
                stroke="#99f6e4"
                stroke-width="11"
                stroke-linecap="round"
              />
              <path
                class="wifi-arc-2"
                d="M56 19 A60 60 0 0 1 144 19"
                fill="none"
                stroke="#99f6e4"
                stroke-width="11"
                stroke-linecap="round"
              />

              <!-- Campus architecture -->
              <polygon class="svg-roof" points="100,58 38,96 162,96" fill="#ffffff" />
              <rect class="svg-beam" x="42" y="103" width="116" height="12" rx="5" fill="#ffffff" />
              <rect
                class="svg-pillar pillar-1"
                x="52"
                y="122"
                width="16"
                height="40"
                rx="4"
                fill="#ffffff"
              />
              <rect
                class="svg-pillar pillar-2"
                x="78"
                y="122"
                width="16"
                height="40"
                rx="4"
                fill="#ffffff"
              />
              <rect
                class="svg-pillar pillar-3"
                x="106"
                y="122"
                width="16"
                height="40"
                rx="4"
                fill="#ffffff"
              />
              <rect
                class="svg-pillar pillar-4"
                x="132"
                y="122"
                width="16"
                height="40"
                rx="4"
                fill="#ffffff"
              />
              <rect class="svg-beam" x="42" y="169" width="116" height="12" rx="5" fill="#ffffff" />

              <!-- Specular sweep -->
              <rect
                class="shine-bar"
                x="0"
                y="0"
                width="55"
                height="220"
                fill="rgba(255,255,255,0.45)"
              />
            </g>
          </svg>

          <svg
            class="brand-svg brand-svg--light"
            [class.hidden-logo]="isDark()"
            viewBox="0 0 200 200"
            xmlns="http://www.w3.org/2000/svg"
            focusable="false"
          >
            <defs>
              <linearGradient id="scIntroLightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#a5f3fc" />
                <stop offset="55%" stop-color="#99f6e4" />
                <stop offset="100%" stop-color="#5eead4" />
              </linearGradient>
              <clipPath id="scIntroBadgeClipLight">
                <rect x="6" y="6" width="188" height="188" rx="46" />
              </clipPath>
            </defs>

            <g clip-path="url(#scIntroBadgeClipLight)">
              <rect
                class="svg-badge"
                x="6"
                y="6"
                width="188"
                height="188"
                rx="46"
                fill="url(#scIntroLightGrad)"
              />

              <circle class="wifi-dot" cx="100" cy="43" r="10" fill="#155e75" />
              <path
                class="wifi-arc-1"
                d="M74 33 A36 36 0 0 1 126 33"
                fill="none"
                stroke="#155e75"
                stroke-width="11"
                stroke-linecap="round"
              />
              <path
                class="wifi-arc-2"
                d="M56 19 A60 60 0 0 1 144 19"
                fill="none"
                stroke="#155e75"
                stroke-width="11"
                stroke-linecap="round"
              />

              <polygon class="svg-roof" points="100,58 38,96 162,96" fill="#09111a" />
              <rect class="svg-beam" x="42" y="103" width="116" height="12" rx="5" fill="#09111a" />
              <rect
                class="svg-pillar pillar-1"
                x="52"
                y="122"
                width="16"
                height="40"
                rx="4"
                fill="#09111a"
              />
              <rect
                class="svg-pillar pillar-2"
                x="78"
                y="122"
                width="16"
                height="40"
                rx="4"
                fill="#09111a"
              />
              <rect
                class="svg-pillar pillar-3"
                x="106"
                y="122"
                width="16"
                height="40"
                rx="4"
                fill="#09111a"
              />
              <rect
                class="svg-pillar pillar-4"
                x="132"
                y="122"
                width="16"
                height="40"
                rx="4"
                fill="#09111a"
              />
              <rect class="svg-beam" x="42" y="169" width="116" height="12" rx="5" fill="#09111a" />

              <rect
                class="shine-bar"
                x="0"
                y="0"
                width="55"
                height="220"
                fill="rgba(255,255,255,0.65)"
              />
            </g>
          </svg>
        </div>
      </div>

      <div class="title-row" [class.glowing]="glowing()">
        <span class="typed">
          @for (letter of letters; track $index) {
            @if ($index < visibleChars()) {
              <span class="char" [class.space]="letter.space">{{ letter.display }}</span>
            }
          }
        </span>
        <span class="cursor" [class.fade-out]="cursorFaded()" aria-hidden="true"></span>
      </div>

      <div class="subtitle" [class.visible]="subtitleVisible()">Digital Campus Ecosystem</div>
    </div>
  `,
  styles: [
    `
      :host {
        --intro-grid-line: rgba(56, 189, 248, 0.08);
        --intro-accent: #5eead4;
        --intro-accent-secondary: #38bdf8;
        --intro-glow: rgba(94, 234, 212, 0.42);
        --intro-text-primary: #f0fdfa;
        --intro-text-muted: #7dd3fc;

        position: relative;
        display: block;
        width: 100%;
        height: 100%;
        overflow: hidden;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      :host-context([data-theme='light']) {
        --intro-grid-line: rgba(13, 148, 136, 0.1);
        --intro-accent: #0f766e;
        --intro-accent-secondary: #0284c7;
        --intro-glow: rgba(13, 148, 136, 0.24);
        --intro-text-primary: #0f172a;
        --intro-text-muted: #0e7490;
      }

      *,
      *::before,
      *::after {
        box-sizing: border-box;
      }

      /* Subtle architectural grid overlay */
      .grid-bg {
        position: absolute;
        inset: 0;
        background-image:
          linear-gradient(var(--intro-grid-line) 1px, transparent 1px),
          linear-gradient(90deg, var(--intro-grid-line) 1px, transparent 1px);
        background-size: 44px 44px;
        mask-image: radial-gradient(circle at 50% 50%, black 30%, transparent 80%);
        -webkit-mask-image: radial-gradient(circle at 50% 50%, black 30%, transparent 80%);
        pointer-events: none;
      }

      /* Ambient floating particles */
      .particles {
        position: absolute;
        inset: 0;
        pointer-events: none;
        overflow: hidden;
      }

      .particle {
        position: absolute;
        width: 3px;
        height: 3px;
        border-radius: 50%;
        background: var(--intro-accent);
        opacity: 0;
        animation: float-particle var(--dur) ease-in-out infinite;
        animation-delay: var(--delay);
      }

      @keyframes float-particle {
        0%,
        100% {
          transform: translateY(0) scale(0.6);
          opacity: 0;
        }
        50% {
          transform: translateY(-45px) scale(1.2);
          opacity: 0.45;
        }
      }

      /* Main stage */
      .stage {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        max-width: 680px;
        margin: 0 auto;
        padding: 1rem;
        z-index: 5;
      }

      /* Logo arena */
      .logo-arena {
        position: relative;
        width: 148px;
        height: 148px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 22px;
      }

      .shockwave {
        position: absolute;
        inset: 0;
        border-radius: 50%;
        border: 1.5px solid var(--intro-accent);
        opacity: 0;
        transform: scale(0.4);
        pointer-events: none;
      }

      .shockwave.ring-1.active {
        animation: shockwave-expand 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }

      .shockwave.ring-2.active {
        animation: shockwave-expand 1.4s cubic-bezier(0.16, 1, 0.3, 1) 0.14s forwards;
      }

      @keyframes shockwave-expand {
        0% {
          opacity: 0.85;
          transform: scale(0.45);
        }
        100% {
          opacity: 0;
          transform: scale(2.15);
        }
      }

      .ambient-halo {
        position: absolute;
        inset: -18px;
        border-radius: 50%;
        background: radial-gradient(circle, var(--intro-glow) 0%, transparent 68%);
        opacity: 0;
        transform: scale(0.7);
        transition:
          opacity 0.9s ease,
          transform 0.9s cubic-bezier(0.16, 1, 0.3, 1);
        pointer-events: none;
      }

      .ambient-halo.active {
        opacity: 0.8;
        transform: scale(1.15);
      }

      /* Logo wrapper and idle levitation */
      .logo-wrapper {
        position: relative;
        width: 134px;
        height: 134px;
        opacity: 0;
        transform: scale(0.72) translateY(16px);
        transition:
          opacity 0.65s cubic-bezier(0.22, 1, 0.36, 1),
          transform 0.75s cubic-bezier(0.34, 1.56, 0.64, 1),
          filter 0.75s ease;
      }

      .logo-wrapper.revealed {
        opacity: 1;
        transform: scale(1) translateY(0);
        filter: drop-shadow(0 14px 28px var(--intro-glow));
        animation: gentle-float 4.5s ease-in-out 1.1s infinite;
      }

      @keyframes gentle-float {
        0%,
        100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-7px);
        }
      }

      .brand-svg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        display: block;
        overflow: visible;
      }

      .hidden-logo {
        display: none !important;
      }

      /* Choreographed SVG internals */
      .svg-badge {
        transform-origin: 100px 100px;
        transform: scale(0.85);
        opacity: 0;
        transition:
          transform 0.65s cubic-bezier(0.34, 1.56, 0.64, 1),
          opacity 0.45s ease;
      }

      .logo-wrapper.revealed .svg-badge {
        transform: scale(1);
        opacity: 1;
      }

      .svg-roof {
        transform: translateY(-16px);
        opacity: 0;
        transition:
          transform 0.55s cubic-bezier(0.22, 1, 0.36, 1) 0.18s,
          opacity 0.4s ease 0.18s;
      }

      .logo-wrapper.revealed .svg-roof {
        transform: translateY(0);
        opacity: 1;
      }

      .svg-beam {
        transform-origin: 100px 110px;
        transform: scaleX(0.3);
        opacity: 0;
        transition:
          transform 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.24s,
          opacity 0.35s ease 0.24s;
      }

      .logo-wrapper.revealed .svg-beam {
        transform: scaleX(1);
        opacity: 1;
      }

      .svg-pillar {
        transform-origin: bottom;
        transform: scaleY(0);
        opacity: 0;
        transition:
          transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1),
          opacity 0.3s ease;
      }

      .logo-wrapper.revealed .pillar-1 {
        transform: scaleY(1);
        opacity: 1;
        transition-delay: 0.32s;
      }
      .logo-wrapper.revealed .pillar-2 {
        transform: scaleY(1);
        opacity: 1;
        transition-delay: 0.39s;
      }
      .logo-wrapper.revealed .pillar-3 {
        transform: scaleY(1);
        opacity: 1;
        transition-delay: 0.46s;
      }
      .logo-wrapper.revealed .pillar-4 {
        transform: scaleY(1);
        opacity: 1;
        transition-delay: 0.53s;
      }

      .wifi-dot {
        transform-origin: 100px 43px;
        transform: scale(0);
        opacity: 0;
        transition:
          transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.62s,
          opacity 0.3s ease 0.62s;
      }

      .wifi-arc-1 {
        opacity: 0;
        transform: translateY(5px);
        transition:
          transform 0.45s cubic-bezier(0.22, 1, 0.36, 1) 0.74s,
          opacity 0.35s ease 0.74s;
      }

      .wifi-arc-2 {
        opacity: 0;
        transform: translateY(7px);
        transition:
          transform 0.45s cubic-bezier(0.22, 1, 0.36, 1) 0.86s,
          opacity 0.35s ease 0.86s;
      }

      .logo-wrapper.revealed .wifi-dot {
        transform: scale(1);
        opacity: 1;
      }
      .logo-wrapper.revealed .wifi-arc-1,
      .logo-wrapper.revealed .wifi-arc-2 {
        transform: translateY(0);
        opacity: 1;
      }

      .shine-bar {
        transform: translateX(-220px) skewX(-24deg);
        opacity: 0;
      }

      .logo-wrapper.revealed .shine-bar {
        animation: glass-sweep 1.1s cubic-bezier(0.22, 1, 0.36, 1) 0.95s forwards;
      }

      @keyframes glass-sweep {
        0% {
          transform: translateX(-220px) skewX(-24deg);
          opacity: 0;
        }
        25% {
          opacity: 0.55;
        }
        100% {
          transform: translateX(260px) skewX(-24deg);
          opacity: 0;
        }
      }

      /* Typewriter title */
      .title-row {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 2.8rem;
        font-size: clamp(1.3rem, 2.8vw, 2rem);
        font-weight: 700;
        letter-spacing: 0.22em;
        color: var(--intro-text-primary);
        text-transform: uppercase;
        white-space: nowrap;
        transition:
          text-shadow 0.7s ease,
          transform 0.6s ease;
      }

      .title-row.glowing {
        text-shadow:
          0 0 18px var(--intro-glow),
          0 0 36px var(--intro-glow);
      }

      .char {
        display: inline-block;
        animation: char-pop 0.32s cubic-bezier(0.22, 1, 0.36, 1) forwards;
      }

      .char.space {
        width: 0.55em;
      }

      @keyframes char-pop {
        0% {
          opacity: 0;
          transform: translateY(10px) scale(0.85);
          filter: blur(4px);
        }
        100% {
          opacity: 1;
          transform: translateY(0) scale(1);
          filter: blur(0);
        }
      }

      .cursor {
        display: inline-block;
        width: 3px;
        height: 1.9rem;
        margin-left: 6px;
        border-radius: 2px;
        background: linear-gradient(180deg, var(--intro-accent), var(--intro-accent-secondary));
        box-shadow:
          0 0 12px var(--intro-accent),
          0 0 24px var(--intro-accent-secondary);
        animation: cursor-blink 0.65s ease-in-out infinite;
        transition:
          opacity 0.3s ease,
          transform 0.3s ease;
      }

      .cursor.fade-out {
        opacity: 0;
        transform: scaleY(0);
        animation: none;
      }

      @keyframes cursor-blink {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.15;
        }
      }

      .subtitle {
        margin-top: 10px;
        font-size: 0.72rem;
        font-weight: 500;
        letter-spacing: 0.34em;
        text-transform: uppercase;
        color: var(--intro-text-muted);
        opacity: 0;
        transform: translateY(10px);
        transition:
          opacity 0.8s ease,
          transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
      }

      .subtitle.visible {
        opacity: 0.9;
        transform: translateY(0);
      }

      @media (max-height: 700px) {
        .logo-arena {
          width: 116px;
          height: 116px;
          margin-bottom: 12px;
        }

        .logo-wrapper {
          width: 106px;
          height: 106px;
        }

        .title-row {
          min-height: 2.2rem;
          font-size: 1.15rem;
        }

        .cursor {
          height: 1.5rem;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .particle,
        .shockwave.active,
        .logo-wrapper.revealed,
        .logo-wrapper.revealed .shine-bar,
        .char,
        .cursor {
          animation: none !important;
        }

        .logo-wrapper.revealed {
          transform: none;
        }
      }
    `,
  ],
})
export class CinematicIntroComponent implements AfterViewInit, OnDestroy {
  private readonly theme = inject(ThemeService);

  protected readonly isDark = this.theme.isDark;
  protected readonly letters: readonly IntroLetter[] = TEXT.split('').map((char) => ({
    display: char === ' ' ? '\u00a0' : char,
    space: char === ' ',
  }));

  protected readonly visibleChars = signal(0);
  protected readonly glowing = signal(false);
  protected readonly cursorFaded = signal(false);
  protected readonly subtitleVisible = signal(false);
  protected readonly revealed = signal(false);
  protected readonly ringsActive = signal(false);
  protected readonly haloActive = signal(false);

  protected readonly particles: readonly IntroParticle[] = Array.from({ length: 22 }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: `${(4 + Math.random() * 5).toFixed(2)}s`,
    delay: `${(Math.random() * 4).toFixed(2)}s`,
  }));

  private timers: ReturnType<typeof setTimeout>[] = [];

  ngAfterViewInit(): void {
    this.startSequence();
  }

  ngOnDestroy(): void {
    this.clearTimers();
  }

  private startSequence(): void {
    this.letters.forEach((_letter, index) => {
      this.timers.push(
        setTimeout(() => {
          this.visibleChars.update((count) => count + 1);
          if (index === this.letters.length - 1) {
            this.triggerLogoReveal();
          }
        }, 350 + index * CHAR_DELAY),
      );
    });
  }

  private triggerLogoReveal(): void {
    this.timers.push(
      setTimeout(() => {
        this.glowing.set(true);
        this.cursorFaded.set(true);
      }, 220),
      setTimeout(() => {
        this.ringsActive.set(true);
        this.haloActive.set(true);
        this.revealed.set(true);
      }, 380),
      setTimeout(() => this.subtitleVisible.set(true), 1050),
    );
  }

  private clearTimers(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers = [];
  }
}
