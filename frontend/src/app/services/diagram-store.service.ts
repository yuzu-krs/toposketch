import { Injectable, computed, signal } from '@angular/core';
import {
  DEFAULT_CUSTOM_COLOR,
  DEFAULT_GROUP_COLOR,
  DEFAULT_NODE_HEIGHT,
  DEFAULT_NODE_WIDTH,
  DiagramDocument,
  DiagramEdge,
  DiagramGroup,
  DiagramNode,
  Selection,
  cloneDocument,
  createEmptyDocument,
  emptySelection,
  isSelectionEmpty,
  newId,
} from '../models/diagram.models';
import { PaletteItem } from '../models/icon-registry';
import { groupAt } from '../models/geometry';

const HISTORY_LIMIT = 100;

/**
 * 構成図ドキュメントの単一の状態持ち主（シグナルベース）。
 * - undo / redo はドキュメントのスナップショット履歴で実現
 * - ドラッグ中の連続更新はジェスチャ（beginGesture / endGesture）で
 *   履歴を1エントリにまとめる
 */
@Injectable({ providedIn: 'root' })
export class DiagramStore {
  private readonly _doc = signal<DiagramDocument>(createEmptyDocument());
  readonly doc = this._doc.asReadonly();
  readonly nodes = computed(() => this._doc().nodes);
  readonly edges = computed(() => this._doc().edges);
  readonly groups = computed(() => this._doc().groups);
  readonly name = computed(() => this._doc().name);

  private readonly _selection = signal<Selection>(emptySelection());
  readonly selection = this._selection.asReadonly();
  readonly selectedNodeIds = computed(() => new Set(this._selection().nodeIds));
  readonly selectedEdgeIds = computed(() => new Set(this._selection().edgeIds));
  readonly selectedGroupIds = computed(() => new Set(this._selection().groupIds));
  readonly selectionCount = computed(() => {
    const s = this._selection();
    return s.nodeIds.length + s.edgeIds.length + s.groupIds.length;
  });

  private readonly _canUndo = signal(false);
  readonly canUndo = this._canUndo.asReadonly();
  private readonly _canRedo = signal(false);
  readonly canRedo = this._canRedo.asReadonly();

  private readonly _dirty = signal(false);
  readonly dirty = this._dirty.asReadonly();
  private readonly _diagramId = signal<string | null>(null);
  readonly diagramId = this._diagramId.asReadonly();

  private past: DiagramDocument[] = [];
  private future: DiagramDocument[] = [];
  private gestureSnapshot: DiagramDocument | null = null;
  private gestureTouched = false;

  // ---------------------------------------------------------------- 履歴操作

  private pushHistory(previous: DiagramDocument): void {
    this.past.push(previous);
    if (this.past.length > HISTORY_LIMIT) {
      this.past.shift();
    }
    this.future = [];
    this.updateHistoryFlags();
  }

  private updateHistoryFlags(): void {
    this._canUndo.set(this.past.length > 0);
    this._canRedo.set(this.future.length > 0);
  }

  private markDirty(): void {
    this._dirty.set(true);
  }

  undo(): void {
    if (!this.past.length) return;
    this.future.push(cloneDocument(this._doc()));
    this._doc.set(this.past.pop()!);
    this.updateHistoryFlags();
    this.syncSelection();
  }

  redo(): void {
    if (!this.future.length) return;
    this.past.push(cloneDocument(this._doc()));
    this._doc.set(this.future.pop()!);
    this.updateHistoryFlags();
    this.syncSelection();
  }

  /** 履歴を残さずドキュメントを読み込む（新規作成・オープン・インポート用）。 */
  load(doc: DiagramDocument, diagramId: string | null): void {
    this._doc.set(doc);
    this._diagramId.set(diagramId);
    this.past = [];
    this.future = [];
    this.updateHistoryFlags();
    this._selection.set(emptySelection());
    this._dirty.set(false);
  }

  markSaved(diagramId: string): void {
    this._diagramId.set(diagramId);
    this._dirty.set(false);
  }

  // ------------------------------------------------------------- ジェスチャ

  beginGesture(): void {
    this.gestureSnapshot = cloneDocument(this._doc());
    this.gestureTouched = false;
  }

  /** ジェスチャを確定する。commit=false ならドラッグ前の状態へロールバック。 */
  endGesture(commit: boolean): void {
    const snapshot = this.gestureSnapshot;
    this.gestureSnapshot = null;
    if (!snapshot) return;
    if (commit) {
      if (this.gestureTouched) {
        this.pushHistory(snapshot);
        this.markDirty();
      }
    } else {
      this._doc.set(snapshot);
      this.syncSelection();
    }
  }

  /** 履歴1エントリとしてドキュメントを変更する。 */
  mutate(fn: (draft: DiagramDocument) => void): void {
    const previous = cloneDocument(this._doc());
    const draft = cloneDocument(this._doc());
    fn(draft);
    this._doc.set(draft);
    this.pushHistory(previous);
    this.markDirty();
  }

  /** ドラッグ中などの履歴に残さない連続変更（beginGesture と対で使用）。 */
  liveMutate(fn: (draft: DiagramDocument) => void): void {
    const draft = cloneDocument(this._doc());
    fn(draft);
    this._doc.set(draft);
    this.gestureTouched = true;
  }

  // --------------------------------------------------------------- 選択操作

  private syncSelection(): void {
    const doc = this._doc();
    const nodeIds = new Set(doc.nodes.map(n => n.id));
    const edgeIds = new Set(doc.edges.map(e => e.id));
    const groupIds = new Set(doc.groups.map(g => g.id));
    this._selection.update(s => ({
      nodeIds: s.nodeIds.filter(id => nodeIds.has(id)),
      edgeIds: s.edgeIds.filter(id => edgeIds.has(id)),
      groupIds: s.groupIds.filter(id => groupIds.has(id)),
    }));
  }

  clearSelection(): void {
    this._selection.set(emptySelection());
  }

  selectNode(id: string, additive = false): void {
    this._selection.update(s => this.merge(s, 'nodeIds', id, additive));
  }

  selectEdge(id: string, additive = false): void {
    this._selection.update(s => this.merge(s, 'edgeIds', id, additive));
  }

  selectGroup(id: string, additive = false): void {
    this._selection.update(s => this.merge(s, 'groupIds', id, additive));
  }

  setSelection(selection: Selection): void {
    this._selection.set(selection);
  }

  toggleNode(id: string): void {
    this._selection.update(s => {
      const has = s.nodeIds.includes(id);
      const nodeIds = has ? s.nodeIds.filter(x => x !== id) : [...s.nodeIds, id];
      return { ...s, nodeIds, edgeIds: has ? s.edgeIds : [], groupIds: has ? s.groupIds : [] };
    });
  }

  selectAll(): void {
    const doc = this._doc();
    this._selection.set({
      nodeIds: doc.nodes.map(n => n.id),
      edgeIds: doc.edges.map(e => e.id),
      groupIds: doc.groups.map(g => g.id),
    });
  }

  private merge(s: Selection, key: 'nodeIds' | 'edgeIds' | 'groupIds', id: string, additive: boolean): Selection {
    const others = additive ? s : emptySelection();
    const list = others[key].includes(id) ? others[key] : [...others[key], id];
    return { ...others, [key]: list } as Selection;
  }

  // ------------------------------------------------------------ ノード操作

  addNodeAt(item: PaletteItem | { key: string; label: string; color: string }, x: number, y: number): string {
    const node: DiagramNode = {
      id: newId(),
      type: item.key,
      label: item.label,
      x: Math.round(x),
      y: Math.round(y),
      width: DEFAULT_NODE_WIDTH,
      height: DEFAULT_NODE_HEIGHT,
      color: item.color,
      groupId: null,
      metadata: {},
    };
    this.mutate(d => {
      const group = groupAt(d, { x: node.x + node.width / 2, y: node.y + node.height / 2 });
      node.groupId = group?.id ?? null;
      d.nodes.push(node);
    });
    this._selection.set({ nodeIds: [node.id], edgeIds: [], groupIds: [] });
    return node.id;
  }

  patchNode(id: string, patch: Partial<DiagramNode>): void {
    this.mutate(d => {
      const node = d.nodes.find(n => n.id === id);
      if (node) Object.assign(node, patch);
    });
  }

  patchNodeLive(id: string, patch: Partial<DiagramNode>): void {
    this.liveMutate(d => {
      const node = d.nodes.find(n => n.id === id);
      if (node) Object.assign(node, patch);
    });
  }

  /** ジェスチャ中の複数ノード一括移動。 */
  moveNodes(positions: Map<string, { x: number; y: number }>): void {
    this.liveMutate(d => {
      for (const node of d.nodes) {
        const p = positions.get(node.id);
        if (p) {
          node.x = p.x;
          node.y = p.y;
        }
      }
    });
  }

  setNodeGroup(nodeIds: string[], groupId: string | null): void {
    this.mutate(d => {
      const ids = new Set(nodeIds);
      for (const node of d.nodes) {
        if (ids.has(node.id)) node.groupId = groupId;
      }
    });
  }

  // ------------------------------------------------------------ エッジ操作

  addEdge(source: string, target: string): string | null {
    if (source === target) return null;
    const existing = this._doc().edges.some(e =>
      (e.source === source && e.target === target) || (e.source === target && e.target === source));
    if (existing) return null;

    const edge: DiagramEdge = {
      id: newId(),
      source,
      target,
      label: '',
      style: 'solid',
      direction: 'forward',
    };
    this.mutate(d => d.edges.push(edge));
    this._selection.set({ nodeIds: [], edgeIds: [edge.id], groupIds: [] });
    return edge.id;
  }

  patchEdge(id: string, patch: Partial<DiagramEdge>): void {
    this.mutate(d => {
      const edge = d.edges.find(e => e.id === id);
      if (edge) Object.assign(edge, patch);
    });
  }

  // ---------------------------------------------------------- グループ操作

  patchGroup(id: string, patch: Partial<DiagramGroup>): void {
    this.mutate(d => {
      const group = d.groups.find(g => g.id === id);
      if (group) Object.assign(group, patch);
    });
  }

  /** 選択中のノード（と選択グループのメンバー）を新しいグループにまとめる。 */
  groupSelection(label = 'グループ'): string | null {
    const sel = this._selection();
    const doc = this._doc();
    const memberIds = new Set(sel.nodeIds);
    for (const node of doc.nodes) {
      if (node.groupId && sel.groupIds.includes(node.groupId)) memberIds.add(node.id);
    }
    if (memberIds.size === 0) return null;

    const group: DiagramGroup = { id: newId(), label, color: DEFAULT_GROUP_COLOR };
    this.mutate(d => {
      d.groups.push(group);
      for (const node of d.nodes) {
        if (memberIds.has(node.id)) node.groupId = group.id;
      }
    });
    this._selection.set({ nodeIds: [], edgeIds: [], groupIds: [group.id] });
    return group.id;
  }

  /** 選択されたグループ、および選択ノードが属するグループを解除する。 */
  ungroupSelection(): void {
    const sel = this._selection();
    const doc = this._doc();
    const targetGroups = new Set(sel.groupIds);
    for (const node of doc.nodes) {
      if (node.groupId && sel.nodeIds.includes(node.id)) targetGroups.add(node.groupId);
    }
    if (!targetGroups.size) return;

    this.mutate(d => {
      d.nodes.forEach(n => {
        if (n.groupId && targetGroups.has(n.groupId)) n.groupId = null;
      });
      d.groups = d.groups.filter(g => !targetGroups.has(g.id));
    });
    this.syncSelection();
  }

  // -------------------------------------------------------- 選択要素の操作

  deleteSelection(): void {
    const sel = this._selection();
    if (isSelectionEmpty(sel)) return;

    this.mutate(d => {
      const removedNodes = new Set(sel.nodeIds);
      const removedGroups = new Set(sel.groupIds);

      d.edges = d.edges.filter(e =>
        !sel.edgeIds.includes(e.id) &&
        !removedNodes.has(e.source) &&
        !removedNodes.has(e.target));

      d.nodes = d.nodes.filter(n => !removedNodes.has(n.id));

      d.groups = d.groups.filter(g => !removedGroups.has(g.id));
      d.nodes.forEach(n => {
        if (n.groupId && !d.groups.some(g => g.id === n.groupId)) n.groupId = null;
      });
    });
    this._selection.set(emptySelection());
  }

  duplicateSelection(): void {
    const sel = this._selection();
    if (!sel.nodeIds.length && !sel.edgeIds.length) return;

    const offset = 28;
    const idMap = new Map<string, string>();
    const doc = this._doc();

    for (const id of sel.nodeIds) {
      idMap.set(id, newId());
    }
    // 選択エッジのために、関連ノードも複製対象に含める
    for (const e of doc.edges) {
      if (sel.edgeIds.includes(e.id)) {
        if (!idMap.has(e.source)) idMap.set(e.source, newId());
        if (!idMap.has(e.target)) idMap.set(e.target, newId());
      }
    }

    this.mutate(d => {
      const newNodes = d.nodes
        .filter(n => idMap.has(n.id))
        .map(n => ({ ...n, id: idMap.get(n.id)!, x: n.x + offset, y: n.y + offset, metadata: { ...n.metadata } }));
      d.nodes.push(...newNodes);

      const newEdges = d.edges
        .filter(e => sel.edgeIds.includes(e.id) && idMap.has(e.source) && idMap.has(e.target))
        .map(e => ({ ...e, id: newId(), source: idMap.get(e.source)!, target: idMap.get(e.target)! }));
      d.edges.push(...newEdges);
    });

    this._selection.set({
      nodeIds: [...idMap.values()],
      edgeIds: [],
      groupIds: [],
    });
  }

  nudgeSelection(dx: number, dy: number): void {
    const sel = this._selection();
    if (!sel.nodeIds.length) return;
    this.mutate(d => {
      const ids = new Set(sel.nodeIds);
      d.nodes.forEach(n => {
        if (ids.has(n.id)) {
          n.x += dx;
          n.y += dy;
        }
      });
    });
  }

  renameDocument(name: string): void {
    this.mutate(d => {
      d.name = name;
    });
  }

  setBackgroundGrid(enabled: boolean): void {
    this.mutate(d => {
      d.background.grid = enabled;
    });
  }

  /** 自動レイアウトの結果を適用（履歴1エントリ）。 */
  applyLayout(positions: Map<string, { x: number; y: number }>): void {
    this.mutate(d => {
      for (const node of d.nodes) {
        const p = positions.get(node.id);
        if (p) {
          node.x = Math.round(p.x);
          node.y = Math.round(p.y);
        }
      }
    });
  }
}
