import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'archsketch.recentKeys';
const MAX_ITEMS = 8;

/** パレットで最近使ったコンポーネント（ブラウザに永続化）。 */
@Injectable({ providedIn: 'root' })
export class RecentItemsService {
  private readonly _recent = signal<string[]>(this.load());

  readonly recent = this._recent.asReadonly();

  record(key: string): void {
    this._recent.update(list => [key, ...list.filter(k => k !== key)].slice(0, MAX_ITEMS));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._recent()));
    } catch {
      // ストレージが利用できない環境では無視
    }
  }

  private load(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter(k => typeof k === 'string') : [];
    } catch {
      return [];
    }
  }
}
