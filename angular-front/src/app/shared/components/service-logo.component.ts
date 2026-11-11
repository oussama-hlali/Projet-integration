import { Component, input } from '@angular/core';

export type ServiceLogoName =
  | 'rooms'
  | 'reservations'
  | 'events'
  | 'announcements'
  | 'transport'
  | 'cafeteria'
  | 'lost-found';

/**
 * Small animated emblem for a campus service.
 *
 * Each service gets its own gradient tile and glyph, and the tiles bob gently
 * with staggered delays so a grid of them feels alive without being noisy.
 */
@Component({
  selector: 'app-service-logo',
  standalone: true,
  template: `
    <span class="logo" [attr.data-logo]="name()" aria-hidden="true">
      <svg
        class="logo__glyph"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        focusable="false"
      >
        @switch (name()) {
          @case ('rooms') {
            <rect x="4" y="3.5" width="16" height="17" rx="2.5" />
            <path d="M9 3.5v17M15 3.5v17M4 9h16M4 15h16" />
          }
          @case ('reservations') {
            <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
            <path d="M3.5 10h17M8 3v4M16 3v4M8 14h2m2.5 0h2" />
          }
          @case ('events') {
            <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
            <path d="M3.5 10h17M8 3v4M16 3v4M12 12.5l1 2.2 2.4.3-1.8 1.6.5 2.4-2.1-1.2-2.1 1.2.5-2.4-1.8-1.6 2.4-.3 1-2.2Z" />
          }
          @case ('announcements') {
            <path d="M4 10v4l12 4.5v-13L4 10Z" />
            <path d="M16 8.5a4 4 0 0 1 0 7M6.5 14l1.2 5.5h3.8L10.3 15" />
          }
          @case ('transport') {
            <rect x="4" y="4.5" width="16" height="13" rx="3" />
            <path d="M4 11h16M8 17.5V20m8-2.5V20M8.5 8h.01M15.5 8h.01M9 14.5h6" />
          }
          @case ('cafeteria') {
            <path d="M5 8.5h11v6.5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8.5Z" />
            <path d="M16 10h1.8a2.7 2.7 0 0 1 0 5.4H16M7.5 3v2.5M11 3v2.5" />
          }
          @case ('lost-found') {
            <circle cx="8.5" cy="9" r="3.6" />
            <path d="m11.1 11.6 8.4 8.4m-2.9-2.9 2-2m-5 0 2-2" />
          }
        }
      </svg>
      <span class="logo__sheen"></span>
    </span>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        line-height: 0;
      }

      .logo {
        --logo-a: #14b8a6;
        --logo-b: #0e6ba8;
        --logo-size: 46px;

        position: relative;
        display: grid;
        flex: none;
        place-items: center;
        width: var(--logo-size);
        height: var(--logo-size);
        overflow: hidden;
        color: #ffffff;
        background: linear-gradient(145deg, var(--logo-a), var(--logo-b));
        border-radius: calc(var(--logo-size) * 0.31);
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.34),
          inset 0 -2px 6px rgba(3, 20, 32, 0.2),
          0 12px 24px -14px var(--logo-a);
        animation: logo-bob 5.5s ease-in-out infinite;
        transition:
          transform var(--transition-base),
          box-shadow var(--transition-base);
      }

      .logo__glyph {
        position: relative;
        z-index: 1;
        width: 58%;
        height: 58%;
      }

      .logo__sheen {
        position: absolute;
        top: -20%;
        left: -70%;
        width: 55%;
        height: 140%;
        background: linear-gradient(
          90deg,
          transparent 0%,
          rgba(255, 255, 255, 0.42) 50%,
          transparent 100%
        );
        pointer-events: none;
        transform: skewX(-18deg);
        animation: logo-sweep 6.5s ease-in-out 2s infinite;
      }

      .logo[data-logo='rooms'] {
        --logo-a: #3b82f6;
        --logo-b: #1e3fa0;
        animation-delay: -0.4s;
      }

      .logo[data-logo='reservations'] {
        --logo-a: #d98316;
        --logo-b: #a8580a;
        animation-delay: -1.5s;
      }

      .logo[data-logo='events'] {
        --logo-a: #e0458d;
        --logo-b: #8f1c56;
        animation-delay: -2.3s;
      }

      .logo[data-logo='announcements'] {
        --logo-a: #8b5cf6;
        --logo-b: #532ba6;
        animation-delay: -3.1s;
      }

      .logo[data-logo='transport'] {
        --logo-a: #06b6d4;
        --logo-b: #076a86;
        animation-delay: -0.9s;
      }

      .logo[data-logo='cafeteria'] {
        --logo-a: #10b981;
        --logo-b: #0b6f66;
        animation-delay: -1.9s;
      }

      .logo[data-logo='lost-found'] {
        --logo-a: #f59e0b;
        --logo-b: #b45309;
        animation-delay: -2.7s;
      }

      @keyframes logo-bob {
        0%,
        100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-3px);
        }
      }

      @keyframes logo-sweep {
        0%,
        55% {
          transform: translateX(0) skewX(-18deg);
        }
        85%,
        100% {
          transform: translateX(330%) skewX(-18deg);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .logo,
        .logo__sheen {
          animation: none;
        }
      }
    `,
  ],
})
export class ServiceLogoComponent {
  readonly name = input.required<ServiceLogoName>();
}
