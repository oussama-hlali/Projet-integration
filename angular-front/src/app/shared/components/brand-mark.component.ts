import { Component, input } from '@angular/core';

export type BrandMarkSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Animated Smart Campus brand tile.
 *
 * A compact inline SVG version of the app icon: the campus tower and signal
 * drawn on a teal-to-blue tile with an orbiting rim, a light sweep and a soft
 * bob. The mark adapts to any context through the `size` input and disables
 * all motion when the visitor prefers reduced motion.
 */
@Component({
  selector: 'app-brand-mark',
  standalone: true,
  template: `
    <span
      class="mark"
      [attr.data-size]="size()"
      [class.mark--animated]="animated()"
      aria-hidden="true"
    >
      <span class="mark__ring"></span>
      <span class="mark__tile">
        <svg class="mark__glyph" viewBox="0 0 64 64" focusable="false">
          <g class="mark__signal">
            <circle class="mark__dot" cx="32" cy="13" r="2.4" />
            <path class="mark__wave mark__wave--1" d="M25 10Q32 4 39 10" />
            <path class="mark__wave mark__wave--2" d="M18 7Q32 -3 46 7" />
          </g>
          <g class="mark__building">
            <path class="mark__roof" d="M32 20 12 33h40Z" />
            <rect class="mark__beam" x="14" y="36" width="36" height="3.4" rx="1.7" />
            <rect class="mark__column mark__column--1" x="17" y="42" width="5" height="12" rx="1.2" />
            <rect class="mark__column mark__column--2" x="26" y="42" width="5" height="12" rx="1.2" />
            <rect class="mark__column mark__column--3" x="35" y="42" width="5" height="12" rx="1.2" />
            <rect class="mark__column mark__column--4" x="44" y="42" width="5" height="12" rx="1.2" />
            <rect class="mark__base" x="14" y="56" width="36" height="3.4" rx="1.7" />
          </g>
        </svg>
        <span class="mark__sheen"></span>
      </span>
    </span>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        line-height: 0;
      }

      .mark {
        --mark-size: 36px;

        position: relative;
        display: inline-grid;
        flex: none;
        place-items: center;
        width: var(--mark-size);
        height: var(--mark-size);
      }

      .mark[data-size='xs'] {
        --mark-size: 22px;
      }

      .mark[data-size='sm'] {
        --mark-size: 28px;
      }

      .mark[data-size='md'] {
        --mark-size: 36px;
      }

      .mark[data-size='lg'] {
        --mark-size: 52px;
      }

      .mark[data-size='xl'] {
        --mark-size: 76px;
      }

      .mark__tile {
        position: relative;
        display: grid;
        place-items: center;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: linear-gradient(145deg, #14b8a6 0%, #0d9488 45%, #0e6ba8 100%);
        border-radius: calc(var(--mark-size) * 0.3);
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.36),
          inset 0 -2px 6px rgba(3, 20, 32, 0.22),
          0 12px 26px -14px rgba(13, 148, 136, 0.85);
        transition:
          transform var(--transition-base),
          box-shadow var(--transition-base);
      }

      .mark__glyph {
        position: relative;
        z-index: 1;
        width: 74%;
        height: 74%;
        overflow: visible;
      }

      .mark__roof,
      .mark__beam,
      .mark__column,
      .mark__base {
        fill: #ffffff;
      }

      .mark__dot {
        fill: #d7fffb;
      }

      .mark__wave {
        fill: none;
        stroke: #d7fffb;
        stroke-linecap: round;
        stroke-width: 3.4;
        opacity: 0.9;
      }

      .mark__wave--2 {
        opacity: 0.55;
      }

      .mark__sheen {
        position: absolute;
        z-index: 2;
        top: -20%;
        left: -70%;
        width: 55%;
        height: 140%;
        background: linear-gradient(
          90deg,
          transparent 0%,
          rgba(255, 255, 255, 0.5) 50%,
          transparent 100%
        );
        pointer-events: none;
        transform: skewX(-18deg);
      }

      .mark__ring {
        position: absolute;
        inset: -9%;
        padding: 1.5px;
        background: conic-gradient(
          from 0deg,
          transparent 0 18%,
          rgba(45, 212, 191, 0.9) 32%,
          transparent 52%,
          rgba(56, 189, 248, 0.7) 72%,
          transparent 88%
        );
        border-radius: calc(var(--mark-size) * 0.36);
        opacity: 0;
        pointer-events: none;
        -webkit-mask:
          linear-gradient(#000 0 0) content-box,
          linear-gradient(#000 0 0);
        -webkit-mask-composite: xor;
        mask:
          linear-gradient(#000 0 0) content-box exclude,
          linear-gradient(#000 0 0);
        mask-composite: exclude;
      }

      .mark[data-size='lg'] .mark__ring,
      .mark[data-size='xl'] .mark__ring {
        opacity: 0.75;
      }

      .mark--animated {
        animation: mark-bob 6s ease-in-out infinite;
      }

      .mark--animated .mark__sheen {
        animation: mark-sweep 6s ease-in-out 1.2s infinite;
      }

      .mark--animated .mark__ring {
        animation: mark-spin 10s linear infinite;
      }

      .mark--animated .mark__dot,
      .mark--animated .mark__wave {
        transform-box: fill-box;
        transform-origin: 50% 100%;
        animation: mark-ping 3.2s ease-in-out infinite;
      }

      .mark--animated .mark__dot {
        transform-origin: 50% 50%;
      }

      .mark--animated .mark__wave--1 {
        animation-delay: 0.15s;
      }

      .mark--animated .mark__wave--2 {
        animation-delay: 0.4s;
      }

      .mark--animated .mark__roof {
        transform-box: fill-box;
        transform-origin: 50% 100%;
        animation: mark-roof-in 700ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
      }

      .mark--animated .mark__beam,
      .mark--animated .mark__base {
        animation: mark-fade-in 600ms ease-out 180ms both;
      }

      .mark--animated .mark__column {
        transform-box: fill-box;
        transform-origin: 50% 100%;
        animation: mark-rise 850ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
      }

      .mark--animated .mark__column--1 {
        animation-delay: 230ms;
      }

      .mark--animated .mark__column--2 {
        animation-delay: 310ms;
      }

      .mark--animated .mark__column--3 {
        animation-delay: 390ms;
      }

      .mark--animated .mark__column--4 {
        animation-delay: 470ms;
      }

      .mark:hover .mark__tile {
        transform: rotate(-4deg) scale(1.06);
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.4),
          inset 0 -2px 6px rgba(3, 20, 32, 0.22),
          0 16px 32px -14px rgba(13, 148, 136, 0.95);
      }

      @keyframes mark-bob {
        0%,
        100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-4%);
        }
      }

      @keyframes mark-spin {
        to {
          transform: rotate(360deg);
        }
      }

      @keyframes mark-sweep {
        0%,
        45% {
          transform: translateX(0) skewX(-18deg);
        }
        75%,
        100% {
          transform: translateX(320%) skewX(-18deg);
        }
      }

      @keyframes mark-ping {
        0%,
        100% {
          transform: scale(0.94);
          opacity: 0.45;
        }
        50% {
          transform: scale(1.06);
          opacity: 1;
        }
      }

      @keyframes mark-roof-in {
        from {
          transform: translateY(-4px) scaleX(0.9);
          opacity: 0;
        }
        to {
          transform: none;
          opacity: 1;
        }
      }

      @keyframes mark-fade-in {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @keyframes mark-rise {
        from {
          transform: scaleY(0.15);
          opacity: 0;
        }
        to {
          transform: scaleY(1);
          opacity: 1;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .mark--animated,
        .mark--animated .mark__sheen,
        .mark--animated .mark__ring,
        .mark--animated .mark__dot,
        .mark--animated .mark__wave,
        .mark--animated .mark__roof,
        .mark--animated .mark__beam,
        .mark--animated .mark__base,
        .mark--animated .mark__column {
          animation: none;
        }

        .mark__tile,
        .mark:hover .mark__tile {
          transition: none;
          transform: none;
        }

        .mark__ring {
          display: none;
        }
      }
    `,
  ],
})
export class BrandMarkComponent {
  readonly size = input<BrandMarkSize>('md');
  readonly animated = input(true);
}
