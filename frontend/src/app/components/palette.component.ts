import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PALETTE, PaletteCategory, PaletteItem } from '../models/icon-registry';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { iconFor } from '../models/icon-registry';
import { DEFAULT_CUSTOM_COLOR } from '../models/diagram.models';

interface VisibleCategory extends PaletteCategory {
  filtered: PaletteItem[];
}

/** 左側パネル：技術コンポーネントの一覧と任意コンポーネントの作成。 */
@Component({
  selector: 'app-palette',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './palette.component.html',
  styleUrl: './palette.component.scss',
})
export class PaletteComponent {
  private readonly sanitizer = inject(DomSanitizer);

  readonly addRequest = output<PaletteItem>();

  readonly search = signal('');
  readonly collapsed = signal<Set<string>>(new Set());
  readonly customOpen = signal(false);
  readonly customLabel = signal('マイコンポーネント');
  readonly customColor = signal(DEFAULT_CUSTOM_COLOR);

  readonly PRESET_COLORS = [
    '#64748b', '#dc2626', '#ea580c', '#d97706', '#16a34a', '#0d9488',
    '#0891b2', '#2563eb', '#4f46e5', '#7c3aed', '#db2777', '#e11d48',
  ];

  readonly categories = computed<VisibleCategory[]>(() => {
    const query = this.search().trim().toLowerCase();
    return PALETTE.map(category => ({
      ...category,
      filtered: category.items.filter(item =>
        !query || item.label.toLowerCase().includes(query) || item.key.toLowerCase().includes(query)),
    })).filter(category => category.filtered.length > 0);
  });

  toggleCategory(id: string): void {
    this.collapsed.update(set => {
      const next = new Set(set);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  isCollapsed(id: string): boolean {
    return this.collapsed().has(id);
  }

  /** ドラッグ開始：キャンバスへのドロップ用にキーを渡す。 */
  onDragStart(event: DragEvent, item: PaletteItem): void {
    event.dataTransfer?.setData('application/x-archsketch-item', item.key);
    event.dataTransfer!.effectAllowed = 'copy';
  }

  createCustom(): void {
    const label = this.customLabel().trim() || 'カスタム';
    this.addRequest.emit({ key: 'custom', label, color: this.customColor() });
    this.customOpen.set(false);
  }

  /** アイコンの信頼済み HTML（キャッシュ付き）。 */
  private readonly htmlCache = new Map<string, SafeHtml>();

  iconHtml(key: string): SafeHtml {
    let html = this.htmlCache.get(key);
    if (!html) {
      html = this.sanitizer.bypassSecurityTrustHtml(iconFor(key).svg);
      this.htmlCache.set(key, html);
    }
    return html;
  }

  iconViewBox(key: string): string {
    return iconFor(key).viewBox;
  }
}
