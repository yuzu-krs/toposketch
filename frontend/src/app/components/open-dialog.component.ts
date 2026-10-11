import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { DiagramApiService, DiagramDto, DiagramSummaryDto } from '../services/api.service';
import { ToastService } from '../services/toast.service';
import { firstValueFrom } from 'rxjs';

/** 保存済み構成図の一覧・オープン・削除ダイアログ。 */
@Component({
  selector: 'app-open-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './open-dialog.component.html',
  styleUrl: './open-dialog.component.scss',
})
export class OpenDialogComponent {
  private readonly api = inject(DiagramApiService);
  private readonly toasts = inject(ToastService);

  readonly closed = output<void>();
  readonly opened = output<DiagramDto>();

  readonly loading = signal(true);
  readonly diagrams = signal<DiagramSummaryDto[]>([]);
  readonly error = signal<string | null>(null);
  readonly deleting = signal<Set<string>>(new Set());

  constructor() {
    void this.refresh();
  }

  async refresh(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const diagrams = await firstValueFrom(this.api.list());
      this.diagrams.set(diagrams);
    } catch {
      this.error.set('バックエンドに接続できませんでした。API サーバーが起動しているか確認してください。');
    } finally {
      this.loading.set(false);
    }
  }

  async open(id: string): Promise<void> {
    try {
      const diagram = await firstValueFrom(this.api.get(id));
      this.opened.emit(diagram);
      this.closed.emit();
    } catch {
      this.toasts.error('図の読み込みに失敗しました。');
    }
  }

  async remove(id: string, name: string): Promise<void> {
    if (!confirm(`「${name}」を削除します。よろしいですか？`)) return;
    this.deleting.update(set => new Set(set).add(id));
    try {
      await firstValueFrom(this.api.remove(id));
      this.diagrams.update(list => list.filter(d => d.id !== id));
      this.toasts.success('削除しました。');
    } catch {
      this.toasts.error('削除に失敗しました。');
    } finally {
      this.deleting.update(set => {
        const next = new Set(set);
        next.delete(id);
        return next;
      });
    }
  }

  formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleString('ja-JP', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return iso;
    }
  }
}
