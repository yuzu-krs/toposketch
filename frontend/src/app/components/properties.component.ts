import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DiagramStore } from '../services/diagram-store.service';
import {
  CONNECTION_TYPES,
  DiagramEdge,
  DiagramGroup,
  DiagramNode,
  EdgeConnection,
  NodeNetworkInfo,
  defaultConnection,
} from '../models/diagram.models';
import { networkKindOf, typeLabel } from '../models/icon-registry';
import { CONNECTION_TYPE_LABELS } from '../models/connection-style';

type PanelMode =
  | { kind: 'empty' }
  | { kind: 'node'; node: DiagramNode }
  | { kind: 'multi'; count: number }
  | { kind: 'edge'; edge: DiagramEdge }
  | { kind: 'group'; group: DiagramGroup };

/** ネットワーク情報の編集フィールド定義（ノード種別に応じて表示を切り替える）。 */
interface NetFieldDef {
  key: keyof NodeNetworkInfo;
  label: string;
  type: 'text' | 'textarea';
}

const DEVICE_FIELDS: NetFieldDef[] = [
  { key: 'hostname', label: 'ホスト名', type: 'text' },
  { key: 'ipAddress', label: 'IPアドレス', type: 'text' },
  { key: 'subnetMask', label: 'サブネットマスク / CIDR', type: 'text' },
  { key: 'defaultGateway', label: 'デフォルトゲートウェイ', type: 'text' },
  { key: 'vlanId', label: 'VLAN ID', type: 'text' },
  { key: 'macAddress', label: 'MACアドレス', type: 'text' },
  { key: 'vendor', label: 'メーカー', type: 'text' },
  { key: 'model', label: 'モデル名', type: 'text' },
  { key: 'interfaces', label: 'インターフェース', type: 'textarea' },
  { key: 'notes', label: '備考', type: 'textarea' },
];

const ENDPOINT_FIELDS: NetFieldDef[] = [
  { key: 'hostname', label: 'ホスト名', type: 'text' },
  { key: 'ipAddress', label: 'IPアドレス', type: 'text' },
  { key: 'subnetMask', label: 'サブネットマスク / CIDR', type: 'text' },
  { key: 'defaultGateway', label: 'デフォルトゲートウェイ', type: 'text' },
  { key: 'vlanId', label: 'VLAN ID', type: 'text' },
  { key: 'macAddress', label: 'MACアドレス', type: 'text' },
  { key: 'vendor', label: 'メーカー', type: 'text' },
  { key: 'model', label: 'モデル名', type: 'text' },
  { key: 'notes', label: '備考', type: 'textarea' },
];

const LOGICAL_FIELDS: NetFieldDef[] = [
  { key: 'ipAddress', label: 'アドレス / CIDR', type: 'text' },
  { key: 'vlanId', label: 'VLAN ID', type: 'text' },
  { key: 'notes', label: '備考', type: 'textarea' },
];

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

  readonly CONNECTION_TYPE_OPTIONS = CONNECTION_TYPES.map(type => ({
    value: type,
    label: CONNECTION_TYPE_LABELS[type],
  }));

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

  /** ノード種別に応じたネットワーク編集フィールド。 */
  readonly networkFields = computed<NetFieldDef[]>(() => {
    const node = this.selectedNode();
    if (!node) return [];
    switch (networkKindOf(node.type)) {
      case 'device': return DEVICE_FIELDS;
      case 'endpoint': return ENDPOINT_FIELDS;
      case 'logical': return LOGICAL_FIELDS;
      default: return [];
    }
  });

  typeCaption(type: string): string {
    return typeLabel(type);
  }

  netValue(node: DiagramNode, key: keyof NodeNetworkInfo): string {
    return node.network?.[key] ?? '';
  }

  setNetValue(node: DiagramNode, key: keyof NodeNetworkInfo, value: string): void {
    const network: NodeNetworkInfo = { ...(node.network ?? {}) };
    if (value.trim()) {
      network[key] = value;
    } else {
      delete network[key];
    }
    this.store.patchNode(node.id, { network: Object.keys(network).length ? network : undefined });
  }

  setConnection(edge: DiagramEdge, patch: Partial<EdgeConnection>): void {
    this.store.patchEdge(edge.id, { connection: { ...edge.connection, ...patch } });
  }

  resetConnectionColor(edge: DiagramEdge): void {
    this.setConnection(edge, { color: '' });
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

  get defaultConnectionRef(): EdgeConnection {
    return defaultConnection();
  }
}
