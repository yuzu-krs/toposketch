import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { UiIconComponent } from './ui-icon.component';
import { DiagramStore } from '../services/diagram-store.service';
import { ThemeService } from '../services/theme.service';
import { LayoutService } from '../services/layout.service';

/** 上部ツールバー。編集系は Store を直接呼び、ファイル操作系は親へイベントを出す。 */
@Component({
  selector: 'app-toolbar',
  imports: [UiIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss',
})
export class ToolbarComponent {
  readonly store = inject(DiagramStore);
  readonly theme = inject(ThemeService);
  private readonly layout = inject(LayoutService);
  readonly saving = input(false);

  readonly paletteOpen = input(true);
  readonly propertiesOpen = input(true);

  readonly newDiagram = output<void>();
  readonly openDialog = output<void>();
  readonly save = output<void>();
  readonly exportJson = output<void>();
  readonly exportSvg = output<void>();
  readonly exportPng = output<void>();
  readonly importFile = output<File>();
  readonly zoomIn = output<void>();
  readonly zoomOut = output<void>();
  readonly zoomFit = output<void>();
  readonly zoomReset = output<void>();
  readonly togglePalette = output<void>();
  readonly toggleProperties = output<void>();

  readonly exportOpen = signal(false);
  readonly layoutOpen = signal(false);

  rename(value: string): void {
    const name = value.trim();
    if (name && name !== this.store.name()) {
      this.store.renameDocument(name);
    }
  }

  autoLayout(direction: 'TB' | 'LR'): void {
    this.layoutOpen.set(false);
    const positions = this.layout.run(this.store.doc(), { direction });
    this.store.applyLayout(positions);
  }

  onImportFile(input: HTMLInputElement): void {
    const file = input.files?.[0];
    if (file) {
      this.importFile.emit(file);
    }
    input.value = '';
  }
}
