import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';

/** Milliseconds before the splash hands over to the app on its own (0 disables). */
const AUTO_ENTER_MS = 8000;
const FADE_MS = 500;

const NS = 'http://www.w3.org/2000/svg';
const SCL = 98;
const PARTICLE_COLORS = ['#0d7c78', '#14b8a6', '#2dd4bf', '#38bdf8', '#111c3a'];

type Vec3 = [number, number, number];

interface Face {
  readonly vi0: number;
  readonly vi1: number;
  readonly vi2: number;
  readonly baseLum: number;
}

interface Projected {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/** Stretched octahedron vertices: equatorial r = 1, half-height = 1.85. */
const V: readonly Vec3[] = [
  [0, -1.85, 0],
  [0, 1.85, 0],
  [1, 0, 0],
  [0, 0, 1],
  [-1, 0, 0],
  [0, 0, -1],
];

const FACES: readonly Face[] = [
  { vi0: 0, vi1: 2, vi2: 3, baseLum: 0.68 },
  { vi0: 0, vi1: 3, vi2: 4, baseLum: 0.9 },
  { vi0: 0, vi1: 4, vi2: 5, baseLum: 0.28 },
  { vi0: 0, vi1: 5, vi2: 2, baseLum: 0.14 },
  { vi0: 1, vi1: 3, vi2: 2, baseLum: 0.82 },
  { vi0: 1, vi1: 4, vi2: 3, baseLum: 0.34 },
  { vi0: 1, vi1: 5, vi2: 4, baseLum: 0.16 },
  { vi0: 1, vi1: 2, vi2: 5, baseLum: 0.1 },
];

const clamp = (value: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, value));

const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

const norm = (v: Vec3): Vec3 => {
  const length = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / length, v[1] / length, v[2] / length];
};

const rotY = (v: Vec3, c: number, s: number): Vec3 => [
  v[0] * c + v[2] * s,
  v[1],
  -v[0] * s + v[2] * c,
];

const project = (v: Vec3, c: number, s: number): Projected => {
  const [rx, ry, rz] = rotY(v, c, s);
  const fov = 7 / (7 - rz);
  return { x: rx * SCL * fov, y: ry * SCL * fov, z: rz };
};

/** Upper-left-front key light. */
const LIGHT: Vec3 = norm([-0.3, -0.55, 1.0]);

interface DrawnFace {
  readonly i: number;
  readonly facing: boolean;
  readonly points: string;
  readonly fill: string;
  readonly strokeAlpha: string;
  readonly z: number;
}

@Component({
  selector: 'app-splash',
  templateUrl: './splash.html',
  styleUrl: './splash.scss',
})
export class Splash implements AfterViewInit, OnDestroy {
  private readonly router = inject(Router);

  private readonly hostRef = viewChild.required<ElementRef<HTMLDivElement>>('host');
  private readonly cursorRef = viewChild.required<ElementRef<SVGSVGElement>>('cur');
  private readonly gemRef = viewChild.required<ElementRef<SVGSVGElement>>('plumbob');
  private readonly partsRef = viewChild.required<ElementRef<HTMLDivElement>>('parts');

  protected readonly leaving = signal(false);

  private polys: SVGElement[] = [];
  private halos: HTMLElement[] = [];
  private host: HTMLDivElement | null = null;
  private parts: HTMLDivElement | null = null;
  private cursor: SVGSVGElement | null = null;
  private gem: SVGSVGElement | null = null;

  private raf = 0;
  private ambient = 0;
  private readonly timers: number[] = [];
  private glowHue = 110;
  private entered = false;
  private reducedMotion = false;

  ngAfterViewInit(): void {
    if (typeof window === 'undefined') {
      return;
    }

    this.host = this.hostRef().nativeElement;
    this.cursor = this.cursorRef().nativeElement;
    this.gem = this.gemRef().nativeElement;
    this.parts = this.partsRef().nativeElement;

    this.polys = FACES.map(() => {
      const poly = document.createElementNS(NS, 'polygon');
      poly.setAttribute('stroke-linejoin', 'round');
      this.gem?.appendChild(poly);
      return poly;
    });
    this.halos = Array.from(this.host.querySelectorAll<HTMLElement>('.halo'));

    window.addEventListener('mousemove', this.trackCursor);
    window.addEventListener('keydown', this.onKeyDown);
    this.host.addEventListener('click', this.burst);

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (this.reducedMotion) {
      this.draw(0);
    } else {
      this.raf = requestAnimationFrame(this.tick);
      this.ambient = window.setInterval(() => this.spawnAmbient(), 420);
    }

    if (AUTO_ENTER_MS > 0) {
      this.timers.push(window.setTimeout(() => this.enter(), AUTO_ENTER_MS));
    }
  }

  ngOnDestroy(): void {
    if (this.raf) {
      cancelAnimationFrame(this.raf);
    }
    if (this.ambient) {
      window.clearInterval(this.ambient);
    }
    this.timers.forEach((id) => window.clearTimeout(id));

    window.removeEventListener('mousemove', this.trackCursor);
    window.removeEventListener('keydown', this.onKeyDown);
    this.host?.removeEventListener('click', this.burst);
  }

  enter(): void {
    if (this.entered) {
      return;
    }
    this.entered = true;
    this.leaving.set(true);
    this.timers.push(
      window.setTimeout(() => void this.router.navigateByUrl('/dashboard'), FADE_MS),
    );
  }

  private readonly tick = (ts: number): void => {
    this.draw(ts);
    this.raf = requestAnimationFrame(this.tick);
  };

  private readonly trackCursor = (event: MouseEvent): void => {
    if (!this.cursor) {
      return;
    }
    this.cursor.style.left = `${event.clientX}px`;
    this.cursor.style.top = `${event.clientY}px`;
    if (this.cursor.style.opacity !== '1') {
      this.cursor.style.opacity = '1';
    }
  };

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter') {
      this.enter();
    }
  };

  private readonly burst = (event: MouseEvent): void => {
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const radius = 20 + Math.random() * 50;
      this.spawn(
        event.clientX + Math.cos(angle) * radius,
        event.clientY + Math.sin(angle) * radius,
        0.5 + Math.random() * 0.7,
      );
    }
  };

  private spawnAmbient(): void {
    this.spawn(
      window.innerWidth * (0.1 + Math.random() * 0.8),
      window.innerHeight * (0.4 + Math.random() * 0.45),
      0.6 + Math.random() * 0.5,
    );
  }

  private spawn(x: number, y: number, size: number): void {
    if (!this.parts) {
      return;
    }
    const el = document.createElement('div');
    el.className = 'pt';
    el.textContent = Math.random() < 0.7 ? '§' : '✦';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];
    el.style.fontSize = `${size}rem`;

    const duration = 0.8 + Math.random() * 1.2;
    el.style.setProperty('--d', `${duration}s`);
    this.parts.appendChild(el);
    window.setTimeout(() => el.remove(), (duration + 0.2) * 1000);
  }

  /** Y-axis rotation, painter's algorithm, hand-lit faces. */
  private draw(ts: number): void {
    const gem = this.gem;
    if (!gem) {
      return;
    }

    const t = ts * 0.001;
    const spin = t * 0.5;
    const c = Math.cos(spin);
    const s = Math.sin(spin);

    this.glowHue = 178 + Math.sin(t * 0.14) * 10;
    const glowLight = 46 + Math.sin(t * 2.7) * 8;
    const glowRadius = 15 + Math.sin(t * 2.7) * 6;
    gem.style.filter =
      `drop-shadow(0 0 ${glowRadius}px hsl(${this.glowHue},75%,${glowLight}%)) ` +
      `drop-shadow(0 0 ${(glowRadius * 2.8).toFixed(0)}px hsla(${this.glowHue},75%,${glowLight - 12}%,.38))`;

    const projected = V.map((v) => project(v, c, s));
    const drawn: DrawnFace[] = FACES.map((face, i) => {
      const v0 = rotY(V[face.vi0], c, s);
      const v1 = rotY(V[face.vi1], c, s);
      const v2 = rotY(V[face.vi2], c, s);

      const e1: Vec3 = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]];
      const e2: Vec3 = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]];
      const normal = norm(cross(e1, e2));

      const diffuse = clamp(dot(normal, LIGHT), 0, 1);
      const lit = face.baseLum * 0.65 + diffuse * 0.25 + 0.1;
      const lightness = clamp(lit * 82, 10, 91);
      const hue = this.glowHue + (face.vi0 === 1 ? -9 : 0);

      const p0 = projected[face.vi0];
      const p1 = projected[face.vi1];
      const p2 = projected[face.vi2];

      return {
        i,
        facing: normal[2] > 0.005,
        z: (p0.z + p1.z + p2.z) / 3,
        points: `${p0.x.toFixed(1)},${p0.y.toFixed(1)} ${p1.x.toFixed(1)},${p1.y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`,
        fill: `hsl(${hue.toFixed(1)},65%,${lightness.toFixed(1)}%)`,
        strokeAlpha: (0.08 + (1 - lightness / 91) * 0.14).toFixed(2),
      };
    });

    for (const face of drawn) {
      const poly = this.polys[face.i];
      if (!poly) {
        continue;
      }
      if (face.facing) {
        continue;
      }
      poly.setAttribute('fill', 'none');
      poly.setAttribute('stroke', 'none');
      gem.insertBefore(poly, gem.firstChild);
    }

    drawn
      .filter((face) => face.facing)
      .sort((a, b) => b.z - a.z)
      .forEach((face) => {
        const poly = this.polys[face.i];
        if (!poly) {
          return;
        }
        poly.setAttribute('points', face.points);
        poly.setAttribute('fill', face.fill);
        poly.setAttribute('stroke', `hsla(0,0%,0%,${face.strokeAlpha})`);
        poly.setAttribute('stroke-width', '1.2');
        gem.appendChild(poly);
      });

    for (let i = 0; i < this.halos.length; i++) {
      const halo = this.halos[i];
      const alpha = i === 0 ? 0.26 : 0.1;
      const width = i === 0 ? 1.5 : 1;
      halo.style.border = `${width}px solid hsla(${this.glowHue},70%,44%,${alpha})`;
    }
  }
}
