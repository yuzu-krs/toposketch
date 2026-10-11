import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ToolbarComponent } from './components/toolbar.component';
import { PaletteComponent } from './components/palette.component';
import { CanvasComponent } from './components/canvas.component';
import { PropertiesComponent } from './components/properties.component';
import { OpenDialogComponent } from './components/open-dialog.component';
import { ToastsComponent } from './components/toasts.component';
import { DiagramStore } from './services/diagram-store.service';
import { DiagramApiService, DiagramDto } from './services/api.service';
import { ToastService } from './services/toast.service';
import { ExportService } from './services/export.service';
import { createEmptyDocument, normalizeDocument } from './models/diagram.models';
import { PaletteItem } from './models/icon-registry';
import { firstValueFrom } from 'rxjs';

/** アプリケーションシェル：3 カラム構成 + グローバルショートカット + 保存フロー。 */
@Component({
  selector: 'app-root',
  imports: [ToolbarComponent, PaletteComponent, CanvasComponent, PropertiesComponent, OpenDialogComponent, ToastsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly store = inject(DiagramStore);
  private readonly api = inject(DiagramApiService);
  private readonly toasts = inject(ToastService);
  private readonly exporter = inject(ExportService);

  readonly canvas = viewChild.required(CanvasComponent);
  readonly saving = signal(false);
  readonly openDialogVisible = signal(false);

  // ------------------------------------------------------------- ファイル操作

  async save(): Promise<void> {
    if (this.saving()) return;
    const doc = this.store.doc();
    if (!doc.nodes.length && !doc.edges.length) {
      this.toasts.info('図が空です。何かコンポーネントを追加してください。');
      return;
    }
    this.saving.set(true);
    try {
      const contentJson = JSON.stringify(doc);
      const id = this.store.diagramId();
      const saved = id
        ? await firstValueFrom(this.api.update(id, doc.name, contentJson))
        : await firstValueFrom(this.api.create(doc.name, contentJson));
      this.store.markSaved(saved.id);
      this.toasts.success(`「${saved.name}」を保存しました。`);
    } catch (error) {
      this.toasts.error(this.describeError(error, '保存に失敗しました。バックエンドが起動しているか確認してください。'));
    } finally {
      this.saving.set(false);
    }
  }

  newDiagram(): void {
    if (this.store.dirty() && !confirm('未保存の変更があります。破棄して新しい図を作成しますか？')) {
      return;
    }
    this.store.load(createEmptyDocument(), null);
  }

  onOpened(dto: DiagramDto): void {
    try {
      const doc = normalizeDocument(JSON.parse(dto.contentJson));
      this.store.load(doc, dto.id);
      this.toasts.success(`「${doc.name}」を開きました。`);
      setTimeout(() => this.canvas().fit());
    } catch (error) {
      this.toasts.error(this.describeError(error, '図データの解析に失敗しました。'));
    }
  }

  async importJson(file: File): Promise<void> {
    try {
      const text = await file.text();
      const doc = normalizeDocument(JSON.parse(text));
      this.store.load(doc, null);
      this.toasts.success(`「${doc.name}」をインポートしました。`);
      setTimeout(() => this.canvas().fit());
    } catch (error) {
      this.toasts.error(this.describeError(error, 'JSON の読み込みに失敗しました。'));
    }
  }

  onPaletteAdd(item: PaletteItem): void {
    this.canvas().addNodeAtCenter(item.key);
  }

  // ------------------------------------------------------------- エクスポート

  exportJson(): void {
    this.exporter.exportJson(this.store.doc());
  }

  exportSvg(): void {
    this.exporter.exportSvg(this.canvas().exportSvgElement());
  }

  async exportPng(): Promise<void> {
    try {
      await this.exporter.exportPng(this.canvas().exportSvgElement());
    } catch (error) {
      this.toasts.error(this.describeError(error, 'PNG エクスポートに失敗しました。'));
    }
  }

  // ------------------------------------------------------------ ショートカット

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)) {
      return;
    }

    const ctrl = event.ctrlKey || event.metaKey;

    if (ctrl && event.key.toLowerCase() === 's') {
      event.preventDefault();
      void this.save();
      return;
    }
    if (ctrl && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      if (event.shiftKey) this.store.redo();
      else this.store.undo();
      return;
    }
    if (ctrl && event.key.toLowerCase() === 'y') {
      event.preventDefault();
      this.store.redo();
      return;
    }
    if (ctrl && event.key.toLowerCase() === 'a') {
      event.preventDefault();
      this.store.selectAll();
      return;
    }
    if (ctrl && event.key.toLowerCase() === 'g') {
      event.preventDefault();
      if (event.shiftKey) this.store.ungroupSelection();
      else this.store.groupSelection();
      return;
    }
    if (ctrl && event.key.toLowerCase() === 'd') {
      event.preventDefault();
      this.store.duplicateSelection();
      return;
    }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      this.store.deleteSelection();
      return;
    }
    if (event.key === 'Escape') {
      if (this.canvas().cancelInteraction()) {
        event.preventDefault();
      } else {
        this.store.clearSelection();
      }
      return;
    }
    if (event.key.startsWith('Arrow')) {
      const step = event.shiftKey ? 1 : 10;
      const dx = event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0;
      const dy = event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0;
      if (dx || dy) {
        event.preventDefault();
        this.store.nudgeSelection(dx, dy);
      }
      return;
    }
    if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      this.canvas().zoomIn();
      return;
    }
    if (event.key === '-') {
      event.preventDefault();
      this.canvas().zoomOut();
      return;
    }
    if (event.key === '0') {
      event.preventDefault();
      this.canvas().fit();
      return;
    }
    if (event.key === '1') {
      event.preventDefault();
      this.canvas().zoomReset();
      return;
    }
  }

  private describeError(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message) {
      return `${fallback} (${error.message})`;
    }
    return fallback;
  }
}
