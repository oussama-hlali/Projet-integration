import { Component, ElementRef, OnDestroy, AfterViewInit, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';

interface Particle {
  x: number;
  y: number;
  tx: number;
  ty: number;
  seed: number;
}

const DISPLAY_MS = 2800;
const FADE_MS = 500;

@Component({
  selector: 'app-splash',
  templateUrl: './splash.html',
  styleUrl: './splash.scss',
})
export class Splash implements AfterViewInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('canvas');

  protected readonly leaving = signal(false);

  private particles: Particle[] = [];
  private ctx: CanvasRenderingContext2D | null = null;
  private raf = 0;
  private width = 0;
  private height = 0;
  private color = '#d3f1ef';
  private finished = false;
  private timers: number[] = [];

  ngAfterViewInit(): void {
    if (typeof window === 'undefined') {
      void this.router.navigateByUrl('/dashboard');
      return;
    }

    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) {
      void this.router.navigateByUrl('/dashboard');
      return;
    }

    this.setup(canvas);
    this.addSkipListeners();
    this.timers.push(window.setTimeout(() => this.finish(), DISPLAY_MS));
  }

  ngOnDestroy(): void {
    if (this.raf) {
      cancelAnimationFrame(this.raf);
    }
    this.timers.forEach((id) => window.clearTimeout(id));
    this.removeSkipListeners();
  }

  private setup(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      void this.router.navigateByUrl('/dashboard');
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = canvas.clientWidth;
    this.height = canvas.clientHeight;
    canvas.width = Math.round(this.width * dpr);
    canvas.height = Math.round(this.height * dpr);
    ctx.scale(dpr, dpr);
    this.ctx = ctx;

    const root = getComputedStyle(document.documentElement);
    this.color = root.getPropertyValue('--color-accent-soft').trim() || '#d3f1ef';
    const fontFamily = root.getPropertyValue('--font-family-base').trim() || 'sans-serif';

    this.particles = this.buildParticles(fontFamily);
    this.raf = requestAnimationFrame((t) => this.frame(t));
  }

  private buildParticles(fontFamily: string): Particle[] {
    const { width, height } = this;
    const off = document.createElement('canvas');
    off.width = width;
    off.height = height;
    const octx = off.getContext('2d');
    if (!octx) {
      return [];
    }

    const line1 = 'Smart Campus';
    const line2 = '2026';
    const maxWidth = width * 0.82;
    let size = Math.min(width * 0.16, height * 0.24, 150);

    octx.textAlign = 'center';
    octx.textBaseline = 'middle';
    octx.fillStyle = '#ffffff';

    const fit = (text: string): void => {
      octx.font = `700 ${size}px ${fontFamily}`;
      const measured = octx.measureText(text).width;
      if (measured > maxWidth) {
        size = (size * maxWidth) / measured;
      }
    };
    fit(line1);
    fit(line2);

    octx.font = `700 ${size}px ${fontFamily}`;
    octx.fillText(line1, width / 2, height / 2 - size * 0.62);
    octx.fillText(line2, width / 2, height / 2 + size * 0.62);

    const data = octx.getImageData(0, 0, width, height).data;
    const gap = width < 640 ? 3 : 4;
    const particles: Particle[] = [];

    for (let y = 0; y < height; y += gap) {
      for (let x = 0; x < width; x += gap) {
        const alpha = data[(y * width + x) * 4 + 3];
        if (alpha > 128) {
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            tx: x,
            ty: y,
            seed: Math.random() * Math.PI * 2,
          });
        }
      }
    }

    return particles;
  }

  private frame(t: number): void {
    const ctx = this.ctx;
    if (!ctx) {
      return;
    }

    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#0b1220';
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.globalAlpha = 1;

    ctx.fillStyle = this.color;
    const dot = 1.7;

    for (const p of this.particles) {
      p.x += (p.tx - p.x) * 0.06;
      p.y += (p.ty - p.y) * 0.06;

      const jx = Math.sin(t * 0.001 + p.seed) * 0.6;
      const jy = Math.cos(t * 0.0012 + p.seed) * 0.6;

      ctx.fillRect(p.x + jx - dot / 2, p.y + jy - dot / 2, dot, dot);
    }

    this.raf = requestAnimationFrame((next) => this.frame(next));
  }

  private finish(): void {
    if (this.finished) {
      return;
    }
    this.finished = true;
    this.leaving.set(true);
    this.timers.push(
      window.setTimeout(() => void this.router.navigateByUrl('/dashboard'), FADE_MS),
    );
  }

  private readonly skip = (): void => this.finish();

  private addSkipListeners(): void {
    window.addEventListener('pointerdown', this.skip);
    window.addEventListener('keydown', this.skip);
  }

  private removeSkipListeners(): void {
    window.removeEventListener('pointerdown', this.skip);
    window.removeEventListener('keydown', this.skip);
  }
}
