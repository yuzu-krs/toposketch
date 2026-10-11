import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { DIAGRAM_TEMPLATES, DiagramTemplate } from '../models/diagram-templates';

/** 新規作成ダイアログ：構成図テンプレートを選択する。 */
@Component({
  selector: 'app-new-diagram-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './new-diagram-dialog.component.html',
  styleUrl: './new-diagram-dialog.component.scss',
})
export class NewDiagramDialogComponent {
  readonly templates = DIAGRAM_TEMPLATES;

  readonly closed = output<void>();
  readonly selected = output<DiagramTemplate>();

  select(template: DiagramTemplate): void {
    this.selected.emit(template);
  }
}
