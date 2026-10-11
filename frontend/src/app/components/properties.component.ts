import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DiagramStore } from '../services/diagram-store.service';
import { DiagramEdge, DiagramGroup, DiagramNode } from '../models/diagram.models';
import { typeLabel } from '../models/icon-registry';

type PanelMode =
  | { kind: 'empty' }
  | { kind: 'node'; node: DiagramNode }
  | { kind: 'multi'; count: number }
  | { kind: 'edge'; edge: DiagramEdge }
  | { kind: 'group'; group: DiagramGroup };

/** 右側パネル：選択要素のプロパティ編集（変更確定は change イベントで履歴1件にまとめる）。 */
@Component({
  selector: 'app-properties',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './properties.component.html',
  styleUrl: './properties.component.scss',
})
export class PropertiesComponent {
  readonly store = inject(DiagramStore);

  readonly PRESET_COLORS = [
    '#64748b', '#dc2626', '#ea580c', '#d97706', '#16a34a', '#0d9488',
    '#0891b2', '#2563eb', '#4f46e5', '#7c3aed', '#db2777', '#e11d48',
  ];

  readonly metadataDraft = signal<string>('');

  readonly mode = computed<PanelMode>(() => {
    const selection = this.store.selection();
    if (selection.nodeIds.length === 1) {
      const node = this.store.nodes().find(n => n.id === selection.nodeIds[0]);
      if (node) return { kind: 'node', node };
    }
    if (selection.nodeIds.length + selection.edgeIds.length + selection.groupIds.length > 1) {
      return { kind: 'multi', count: selection.nodeIds.length + selection.edgeIds.length + selection.groupIds.length };
    }
    if (selection.edgeIds.length === 1) {
      const edge = this.store.edges().find(e => e.id === selection.edgeIds[0]);
      if (edge) return { kind: 'edge', edge };
    }
    if (selection.groupIds.length === 1) {
      const group = this.store.groups().find(g => g.id === selection.groupIds[0]);
      if (group) return { kind: 'group', group };
    }
    return { kind: 'empty' };
  });

  readonly selectedNode = computed(() => {
    const mode = this.mode();
    return mode.kind === 'node' ? mode.node : null;
  });
  readonly selectedEdge = computed(() => {
    const mode = this.mode();
    return mode.kind === 'edge' ? mode.edge : null;
  });
  readonly selectedGroup = computed(() => {
    const mode = this.mode();
    return mode.kind === 'group' ? mode.group : null;
  });
  readonly multiCount = computed(() => {
    const mode = this.mode();
    return mode.kind === 'multi' ? mode.count : 0;
  });

  readonly metadataEntries = computed<[string, string][]>(() => {
    const node = this.selectedNode();
    return node ? Object.entries(node.metadata) : [];
  });

  readonly currentGroupLabel = computed(() => {
    const node = this.selectedNode();
    if (!node?.groupId) return '';
    return this.store.groups().find(g => g.id === node.groupId)?.label ?? '';
  });

  typeCaption(type: string): string {
    return typeLabel(type);
  }

  num(value: string): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  /** 最小値を下回らない数値（テンプレート内では Math が使えないため）。 */
  atLeast(value: string, min: number): number {
    return Math.max(min, this.num(value));
  }

  setNodeGroup(groupId: string): void {
    const node = this.selectedNode();
    if (!node) return;
    this.store.setNodeGroup([node.id], groupId === '' ? null : groupId);
  }

  addMetadata(): void {
    const node = this.selectedNode();
    const key = this.metadataDraft().trim();
    if (!node || !key || node.metadata[key] !== undefined) return;
    this.store.patchNode(node.id, { metadata: { ...node.metadata, [key]: '' } });
    this.metadataDraft.set('');
  }

  setMetadataValue(key: string, value: string): void {
    const node = this.selectedNode();
    if (!node) return;
    this.store.patchNode(node.id, { metadata: { ...node.metadata, [key]: value } });
  }

  removeMetadata(key: string): void {
    const node = this.selectedNode();
    if (!node) return;
    const metadata = { ...node.metadata };
    delete metadata[key];
    this.store.patchNode(node.id, { metadata });
  }

  setGrid(value: boolean): void {
    this.store.setBackgroundGrid(value);
  }

  rename(value: string): void {
    const name = value.trim();
    if (name) {
      this.store.renameDocument(name);
    }
  }
}
