import { Injectable, computed, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

/** キャンバス（SVG）の描画色。SVG はクラスではなく属性で色を受けるため、
 *  テーマごとの具色をここで供給する。エクスポート時も同じ値を使うので
 *  出力画像がテーマと一致する。 */
export interface CanvasPalette {
  background: string;
  grid: string;
  nodeFill: string;
  nodeStroke: string;
  nodeText: string;
  nodeSubText: string;
  edge: string;
  edgeLabel: string;
  edgeSelected: string;
  selection: string;
  groupStroke: string;
  groupLabel: string;
  port: string;
  marquee: string;
}

const LIGHT: CanvasPalette = {
  background: '#f8fafc',
  grid: '#cbd5e1',
  nodeFill: '#ffffff',
  nodeStroke: '#94a3b8',
  nodeText: '#0f172a',
  nodeSubText: '#64748b',
  edge: '#64748b',
  edgeLabel: '#334155',
  edgeSelected: '#2563eb',
  selection: '#2563eb',
  groupStroke: '#7c8798',
  groupLabel: '#475569',
  port: '#ffffff',
  marquee: '#2563eb',
};

const DARK: CanvasPalette = {
  background: '#0f172a',
  grid: '#334155',
  nodeFill: '#1e293b',
  nodeStroke: '#475569',
  nodeText: '#f1f5f9',
  nodeSubText: '#94a3b8',
  edge: '#94a3b8',
  edgeLabel: '#cbd5e1',
  edgeSelected: '#60a5fa',
  selection: '#60a5fa',
  groupStroke: '#8895a9',
  groupLabel: '#cbd5e1',
  port: '#f8fafc',
  marquee: '#60a5fa',
};

const STORAGE_KEY = 'archsketch.theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _theme = signal<Theme>(this.initialTheme());

  readonly theme = this._theme.asReadonly();
  readonly isDark = computed(() => this._theme() === 'dark');
  readonly canvasPalette = computed<CanvasPalette>(() => (this._theme() === 'dark' ? DARK : LIGHT));

  constructor() {
    this.apply(this._theme());
  }

  toggle(): void {
    this.set(this._theme() === 'dark' ? 'light' : 'dark');
  }

  set(theme: Theme): void {
    this._theme.set(theme);
    this.apply(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ストレージが利用できない環境では無視
    }
  }

  private apply(theme: Theme): void {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }

  private initialTheme(): Theme {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') return stored;
    } catch {
      // fallthrough
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
