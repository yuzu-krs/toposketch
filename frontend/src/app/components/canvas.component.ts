import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DiagramStore } from '../services/diagram-store.service';
import { ThemeService } from '../services/theme.service';
import { RecentItemsService } from '../services/recent-items.service';
import { iconFor, paletteItem, typeLabel } from '../models/icon-registry';
import { DEFAULT_NODE_HEIGHT, DEFAULT_NODE_WIDTH, DiagramNode } from '../models/diagram.models';
import { connectionMetaText, resolveConnectionStyle } from '../models/connection-style';
import { createSampleDocument } from '../models/sample-diagram';
import {
  Point,
  Rect,
  contentBounds,
  edgeGeometry,
  groupBounds,
  nodeAt,
  rectsIntersect,
} from '../models/geometry';

type PortSide = 'top' | 'right' | 'bottom' | 'left';

interface Interaction {
  type: 'pan' | 'drag-nodes' | 'marquee' | 'connect';
  startScreen?: Point;
  startWorld?: Point;
  startPan?: Point;
  nodeIds?: string[];
  origPositions?: Map<string, Point>;
  moved?: boolean;
  additive?: boolean;
  fromNodeId?: string;
  fromPoint?: Point;
}

interface EditState {
  kind: 'node' | 'edge' | 'group';
  id: string;
  value: string;
  x: number; // 画面座標
  y: number;
}

const GRID = 8;
const MIN_ZOOM = 0.15;
const MAX_ZOOM = 3;

/** 中央のキャンバス。SVG 属性ベース描画でエクスポートを自己完結させている。 */
@Component({
  selector: 'app-canvas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './canvas.component.html',
  styleUrl: './canvas.component.scss',
  host: { class: 'block h-full w-full' },
})
export class CanvasComponent implements AfterViewInit {
  readonly store = inject(DiagramStore);
  private readonly theme = inject(ThemeService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly recents = inject(RecentItemsService);

  private readonly svgRoot = viewChild.required<ElementRef<SVGSVGElement>>('svgRoot');
  private readonly editInput = viewChild<ElementRef<HTMLInputElement>>('editInput');
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly pal = this.theme.canvasPalette;
  readonly zoom = signal(1);
  readonly pan = signal<Point>({ x: 80, y: 60 });
  readonly size = signal<{ w: number; h: number }>({ w: 0, h: 0 });

  readonly hoverNodeId = signal<string | null>(null);
  readonly connectTargetId = signal<string | null>(null);
  readonly connectCursor = signal<Point | null>(null);
  readonly marquee = signal<Rect | null>(null);
  readonly editing = signal<EditState | null>(null);
  readonly snapEnabled = signal(true);
  readonly spaceHeld = signal(false);
  readonly panning = signal(false);

  private interaction: Interaction | null = null;
  private toggleOffOnUp: string | null = null;
  private resizeObserver: ResizeObserver | null = null;

  readonly zoomPercent = computed(() => Math.round(this.zoom() * 100));

  readonly groupsView = computed(() => {
    const doc = this.store.doc();
    return doc.groups.map(g => ({ group: g, bounds: groupBounds(g, doc.nodes) }));
  });

  readonly edgesView = computed(() => {
    const doc = this.store.doc();
    const themeEdge = this.pal().edge;
    const byId = new Map(doc.nodes.map(n => [n.id, n]));
    return doc.edges.flatMap(e => {
      const source = byId.get(e.source);
      const target = byId.get(e.target);
      if (!source || !target) return [];
      const style = resolveConnectionStyle(e.connection, themeEdge, { legacyDashed: e.style === 'dashed' });
      return [{
        edge: e,
        geo: edgeGeometry(source, target),
        style,
        meta: connectionMetaText(e.connection),
      }];
    });
  });

  readonly gridRect = computed<Rect>(() => {
    const { w, h } = this.size();
    const zoom = this.zoom();
    const pan = this.pan();
    const pad = GRID * 2;
    return {
      x: -pan.x / zoom - pad,
      y: -pan.y / zoom - pad,
      width: w / zoom + pad * 2,
      height: h / zoom + pad * 2,
    };
  });

  readonly connectPreview = computed<{ d: string } | null>(() => {
    const from = this.interactionFromPoint();
    const cursor = this.connectCursor();
    if (!from || !cursor) return null;
    return { d: `M ${from.x} ${from.y} L ${cursor.x} ${cursor.y}` };
  });

  private readonly interactionFromPoint = signal<Point | null>(null);

  constructor() {
    effect(() => {
      const input = this.editInput()?.nativeElement;
      if (input) {
        input.focus();
        input.select();
      }
    });
    afterNextRender(() => this.fit());
  }

  ngAfterViewInit(): void {
    // wheel は preventDefault が必要なため passive: false で手動登録する
    const svg = this.svgRoot().nativeElement;
    svg.addEventListener('wheel', (e: WheelEvent) => this.onWheel(e), { passive: false });

    this.resizeObserver = new ResizeObserver(entries => {
      const rect = entries[0]?.contentRect;
      if (rect) this.size.set({ w: rect.width, h: rect.height });
    });
    this.resizeObserver.observe(this.host.nativeElement);

    window.addEventListener('keydown', e => {
      if (e.code === 'Space' && !this.editing()) {
        this.spaceHeld.set(true);
      }
    });
    window.addEventListener('keyup', e => {
      if (e.code === 'Space') this.spaceHeld.set(false);
    });
  }

  // ------------------------------------------------------------- 座標変換

  private toWorld(clientX: number, clientY: number): Point {
    const rect = this.svgRoot().nativeElement.getBoundingClientRect();
    const zoom = this.zoom();
    const pan = this.pan();
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom,
    };
  }

  private toScreen(worldX: number, worldY: number): Point {
    const zoom = this.zoom();
    const pan = this.pan();
    return { x: worldX * zoom + pan.x, y: worldY * zoom + pan.y };
  }

  // ------------------------------------------------------------- ズーム

  zoomAt(clientX: number, clientY: number, factor: number): void {
    const rect = this.svgRoot().nativeElement.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    const zoom = this.zoom();
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom * factor));
    if (next === zoom) return;
    const pan = this.pan();
    this.pan.set({
      x: px - (px - pan.x) * (next / zoom),
      y: py - (py - pan.y) * (next / zoom),
    });
    this.zoom.set(next);
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    const factor = Math.exp(-e.deltaY * 0.0012);
    this.zoomAt(e.clientX, e.clientY, factor);
  }

  zoomIn(): void {
    const rect = this.svgRoot().nativeElement.getBoundingClientRect();
    this.zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, 1.25);
  }

  zoomOut(): void {
    const rect = this.svgRoot().nativeElement.getBoundingClientRect();
    this.zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, 1 / 1.25);
  }

  zoomReset(): void {
    this.zoom.set(1);
  }

  fit(): void {
    const bounds = contentBounds(this.store.doc());
    const rect = this.svgRoot().nativeElement.getBoundingClientRect();
    if (!bounds || !rect.width || !rect.height) {
      this.zoom.set(1);
      this.pan.set({ x: 80, y: 60 });
      return;
    }
    const pad = 60;
    const zoom = Math.min(
      MAX_ZOOM,
      Math.max(MIN_ZOOM, Math.min((rect.width - pad * 2) / bounds.width, (rect.height - pad * 2) / bounds.height)));
    this.zoom.set(zoom);
    this.pan.set({
      x: (rect.width - bounds.width * zoom) / 2 - bounds.x * zoom,
      y: (rect.height - bounds.height * zoom) / 2 - bounds.y * zoom,
    });
  }

  isInteracting(): boolean {
    return this.interaction !== null || this.editing() !== null;
  }

  /** Esc キー：進行中の操作をキャンセル。何か処理したら true を返す。 */
  cancelInteraction(): boolean {
    if (this.editing()) {
      this.editing.set(null);
      return true;
    }
    if (this.interaction?.type === 'drag-nodes') {
      this.store.endGesture(false);
      this.interaction = null;
      return true;
    }
    if (this.interaction?.type === 'marquee') {
      this.marquee.set(null);
      this.interaction = null;
      return true;
    }
    if (this.interaction?.type === 'connect') {
      this.interaction = null;
      this.connectCursor.set(null);
      this.connectTargetId.set(null);
      this.interactionFromPoint.set(null);
      return true;
    }
    return false;
  }

  // ------------------------------------------------------- ポインタイベント

  onPointerDown(event: PointerEvent): void {
    if (event.button === 2) return;
    const svg = this.svgRoot().nativeElement;
    svg.setPointerCapture(event.pointerId);
    event.preventDefault();

    if (event.button === 1 || this.spaceHeld()) {
      this.interaction = {
        type: 'pan',
        startScreen: { x: event.clientX, y: event.clientY },
        startPan: this.pan(),
      };
      this.panning.set(true);
      return;
    }
    if (event.button !== 0) return;

    const target = event.target as Element;
    const world = this.toWorld(event.clientX, event.clientY);
    this.toggleOffOnUp = null;

    const portEl = target.closest('[data-port]');
    const nodeEl = target.closest('[data-node-id]');
    const edgeEl = target.closest('[data-edge-id]');
    const groupEl = target.closest('[data-group-id]');

    if (portEl) {
      const nodeId = portEl.getAttribute('data-node-id')!;
      const side = portEl.getAttribute('data-port') as PortSide;
      const node = this.store.nodes().find(n => n.id === nodeId);
      if (node) {
        const point = this.portWorld(node, side);
        this.interaction = { type: 'connect', fromNodeId: nodeId, fromPoint: point };
        this.interactionFromPoint.set(point);
        this.connectCursor.set(world);
      }
      return;
    }

    if (nodeEl) {
      const id = nodeEl.getAttribute('data-node-id')!;
      const wasSelected = this.store.selectedNodeIds().has(id);
      if (!wasSelected) {
        this.store.selectNode(id, event.shiftKey);
      } else if (event.shiftKey) {
        this.toggleOffOnUp = id;
      }
      this.startNodeDrag(world);
      return;
    }

    if (edgeEl) {
      const id = edgeEl.getAttribute('data-edge-id')!;
      this.store.selectEdge(id, event.shiftKey);
      return;
    }

    if (groupEl) {
      const id = groupEl.getAttribute('data-group-id')!;
      if (!this.store.selectedGroupIds().has(id)) {
        this.store.selectGroup(id, event.shiftKey);
      }
      const memberIds = this.store.nodes().filter(n => n.groupId === id).map(n => n.id);
      this.startNodeDrag(world, memberIds);
      return;
    }

    // 空白：マーキー選択
    if (!event.shiftKey) {
      this.store.clearSelection();
    }
    this.interaction = { type: 'marquee', startWorld: world, additive: event.shiftKey };
    this.updateMarquee(world);
  }

  private startNodeDrag(world: Point, ids?: string[]): void {
    const nodeIds = ids ?? [...this.store.selection().nodeIds];
    if (!nodeIds.length) return;
    const origPositions = new Map<string, Point>();
    for (const node of this.store.nodes()) {
      if (nodeIds.includes(node.id)) {
        origPositions.set(node.id, { x: node.x, y: node.y });
      }
    }
    this.store.beginGesture();
    this.interaction = { type: 'drag-nodes', startWorld: world, nodeIds, origPositions, moved: false };
  }

  onPointerMove(event: PointerEvent): void {
    const interaction = this.interaction;
    if (!interaction) return;

    switch (interaction.type) {
      case 'pan': {
        const dx = event.clientX - interaction.startScreen!.x;
        const dy = event.clientY - interaction.startScreen!.y;
        this.pan.set({ x: interaction.startPan!.x + dx, y: interaction.startPan!.y + dy });
        break;
      }
      case 'drag-nodes': {
        const world = this.toWorld(event.clientX, event.clientY);
        const dx = world.x - interaction.startWorld!.x;
        const dy = world.y - interaction.startWorld!.y;
        if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) interaction.moved = true;
        const positions = new Map<string, Point>();
        for (const [id, p] of interaction.origPositions!) {
          positions.set(id, {
            x: this.snapValue(p.x + dx),
            y: this.snapValue(p.y + dy),
          });
        }
        this.store.moveNodes(positions);
        break;
      }
      case 'marquee': {
        this.updateMarquee(this.toWorld(event.clientX, event.clientY));
        break;
      }
      case 'connect': {
        const world = this.toWorld(event.clientX, event.clientY);
        this.connectCursor.set(world);
        const hit = nodeAt(this.store.doc(), world);
        this.connectTargetId.set(hit && hit.id !== interaction.fromNodeId ? hit.id : null);
        break;
      }
    }
  }

  onPointerUp(event: PointerEvent): void {
    const interaction = this.interaction;
    if (!interaction) return;
    this.interaction = null;

    try {
      this.svgRoot().nativeElement.releasePointerCapture(event.pointerId);
    } catch {
      // すでに解放されている場合は無視
    }

    switch (interaction.type) {
      case 'pan':
        this.panning.set(false);
        break;
      case 'drag-nodes':
        this.store.endGesture(interaction.moved === true);
        if (this.toggleOffOnUp && interaction.moved !== true) {
          this.store.toggleNode(this.toggleOffOnUp);
        }
        this.toggleOffOnUp = null;
        break;
      case 'marquee':
        this.marquee.set(null);
        break;
      case 'connect': {
        const target = this.connectTargetId();
        if (target && interaction.fromNodeId) {
          this.store.addEdge(interaction.fromNodeId, target);
        }
        this.connectTargetId.set(null);
        this.connectCursor.set(null);
        this.interactionFromPoint.set(null);
        break;
      }
    }
  }

  onPointerCancel(event: PointerEvent): void {
    const interaction = this.interaction;
    this.interaction = null;
    if (interaction?.type === 'drag-nodes') {
      this.store.endGesture(false);
    }
    this.marquee.set(null);
    this.connectTargetId.set(null);
    this.connectCursor.set(null);
    this.panning.set(false);
    void event;
  }

  private updateMarquee(current: Point): void {
    const interaction = this.interaction;
    if (!interaction?.startWorld) return;
    const start = interaction.startWorld;
    const rect = {
      x: Math.min(start.x, current.x),
      y: Math.min(start.y, current.y),
      width: Math.abs(current.x - start.x),
      height: Math.abs(current.y - start.y),
    };
    this.marquee.set(rect);

    const doc = this.store.doc();
    const hitIds = doc.nodes
      .filter(n => rectsIntersect(rect, { x: n.x, y: n.y, width: n.width, height: n.height }))
      .map(n => n.id);
    const base = interaction.additive ? this.store.selection().nodeIds : [];
    this.store.setSelection({
      nodeIds: [...new Set([...base, ...hitIds])],
      edgeIds: interaction.additive ? this.store.selection().edgeIds : [],
      groupIds: interaction.additive ? this.store.selection().groupIds : [],
    });
  }

  // ---------------------------------------------------------- ダブルクリック

  onDoubleClick(event: MouseEvent): void {
    const target = event.target as Element;
    const nodeEl = target.closest('[data-node-id]');
    const edgeEl = target.closest('[data-edge-id]');
    const groupEl = target.closest('[data-group-id]');

    if (nodeEl) {
      const node = this.store.nodes().find(n => n.id === nodeEl.getAttribute('data-node-id'));
      if (node) this.startEdit('node', node.id, node.label, this.toScreen(node.x + node.width / 2, node.y + node.height / 2));
      return;
    }
    if (edgeEl) {
      const view = this.edgesView().find(v => v.edge.id === edgeEl.getAttribute('data-edge-id'));
      if (view) {
        this.startEdit('edge', view.edge.id, view.edge.label, this.toScreen(view.geo.mid.x, view.geo.mid.y));
      }
      return;
    }
    if (groupEl) {
      const view = this.groupsView().find(v => v.group.id === groupEl.getAttribute('data-group-id'));
      if (view) {
        const b = view.bounds;
        this.startEdit('group', view.group.id, view.group.label, this.toScreen(b.x + 70, b.y + 8));
      }
    }
  }

  private startEdit(kind: EditState['kind'], id: string, value: string, screen: Point): void {
    this.editing.set({
      kind,
      id,
      value,
      x: screen.x - 85,
      y: screen.y - 14,
    });
  }

  commitEdit(): void {
    const edit = this.editing();
    if (!edit) return;
    const value = (this.editInput()?.nativeElement.value ?? '').trim();
    this.editing.set(null);
    if (!value || value === edit.value) return;

    if (edit.kind === 'node') this.store.patchNode(edit.id, { label: value });
    else if (edit.kind === 'edge') this.store.patchEdge(edit.id, { label: value });
    else this.store.patchGroup(edit.id, { label: value });
  }

  cancelEdit(): void {
    this.editing.set(null);
  }

  // ------------------------------------------------------------ D&D 追加

  onDragOver(event: DragEvent): void {
    if (event.dataTransfer?.types.includes('application/x-archsketch-item')) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  onDrop(event: DragEvent): void {
    const key = event.dataTransfer?.getData('application/x-archsketch-item');
    if (!key) return;
    event.preventDefault();
    const world = this.toWorld(event.clientX, event.clientY);
    this.addNodeAtWorld(key, world);
  }

  addNodeAtCenter(key: string): void {
    const rect = this.svgRoot().nativeElement.getBoundingClientRect();
    const world = this.toWorld(rect.left + rect.width / 2, rect.top + rect.height / 2);
    this.addNodeAtWorld(key, world);
  }

  addNodeAtWorld(key: string, world: Point): void {
    const item = paletteItem(key);
    if (!item) return;
    this.recents.record(key);
    this.store.addNodeAt(item, world.x - DEFAULT_NODE_WIDTH / 2, world.y - DEFAULT_NODE_HEIGHT / 2);
  }

  loadSample(): void {
    this.store.load(createSampleDocument(), null);
  }

  // ------------------------------------------------------------ 描画補助

  isSelectedNode(id: string): boolean {
    return this.store.selectedNodeIds().has(id);
  }

  isSelectedEdge(id: string): boolean {
    return this.store.selectedEdgeIds().has(id);
  }

  isSelectedGroup(id: string): boolean {
    return this.store.selectedGroupIds().has(id);
  }

  isConnectTarget(id: string): boolean {
    return this.connectTargetId() === id;
  }

  showPorts(node: DiagramNode): boolean {
    return this.hoverNodeId() === node.id || this.isSelectedNode(node.id);
  }

  nodeStroke(node: DiagramNode): string {
    return this.isSelectedNode(node.id) || this.isConnectTarget(node.id)
      ? node.color
      : this.pal().nodeStroke;
  }

  nodeStrokeWidth(node: DiagramNode): number {
    return this.isSelectedNode(node.id) || this.isConnectTarget(node.id) ? 2.5 : 1.5;
  }

  edgeStroke(id: string, presetStroke: string): string {
    return this.isSelectedEdge(id) ? this.pal().edgeSelected : presetStroke;
  }

  edgeStrokeWidth(id: string, presetWidth: number): number {
    return this.isSelectedEdge(id) ? presetWidth + 0.7 : presetWidth;
  }

  /** ノード下段のキャプション（ホスト名があれば優先表示）。 */
  nodeCaption(node: DiagramNode): string {
    const network = node.network;
    if (network?.hostname) return network.hostname;
    return this.typeCaption(node.type);
  }

  /** ホバーツールチップの本文。 */
  nodeTooltip(node: DiagramNode): string {
    const lines = [node.label];
    const n = node.network;
    if (n?.hostname) lines.push(`ホスト名: ${n.hostname}`);
    if (n?.ipAddress) lines.push(`IP: ${n.ipAddress}${n.subnetMask ? ` ${n.subnetMask}` : ''}`);
    if (n?.vlanId) lines.push(`VLAN: ${n.vlanId}`);
    if (n?.vendor || n?.model) lines.push(`機器: ${[n.vendor, n.model].filter(Boolean).join(' ')}`);
    return lines.join('\n');
  }

  labelLines(label: string): string[] {
    const maxWidth = 92;
    if (this.textWidth(label) <= maxWidth) return [label];
    const lines: string[] = [];
    let current = '';
    for (const ch of label) {
      if (current && this.textWidth(current + ch) > maxWidth) {
        lines.push(current);
        current = ch;
        if (lines.length === 2) break;
      } else {
        current += ch;
      }
    }
    if (lines.length < 2) {
      lines.push(current);
    } else {
      lines[1] = lines[1].length > 9 ? `${lines[1].slice(0, 8)}…` : lines[1];
    }
    return lines;
  }

  /** 全角を 12.5px・半角を 7px と概算するテキスト幅。 */
  private textWidth(text: string): number {
    let width = 0;
    for (const ch of text) {
      width += ch.charCodeAt(0) > 0x2e80 ? 12.5 : 7;
    }
    return width;
  }

  /** ラベル行とキャプションの y 座標。 */
  labelYs(node: DiagramNode): { lines: { text: string; y: number }[]; captionY: number } {
    const lines = this.labelLines(node.label);
    if (lines.length === 1) {
      return {
        lines: [{ text: lines[0], y: node.height / 2 + 4 }],
        captionY: node.height / 2 + 17,
      };
    }
    return {
      lines: [
        { text: lines[0], y: node.height / 2 - 6 },
        { text: lines[1], y: node.height / 2 + 9 },
      ],
      captionY: node.height / 2 + 22,
    };
  }

  groupLabelWidth(label: string): number {
    return Math.max(30, Math.min(240, 16 + this.textWidth(label) * 0.95));
  }

  targetNode(id: string): DiagramNode | null {
    return this.store.nodes().find(n => n.id === id) ?? null;
  }

  onNodeLeave(id: string): void {
    if (this.hoverNodeId() === id) {
      this.hoverNodeId.set(null);
    }
  }

  canvasCursor(): string {
    if (this.panning()) return 'grabbing';
    if (this.spaceHeld()) return 'grab';
    return 'default';
  }

  typeCaption(type: string): string {
    return typeLabel(type);
  }

  ports(node: DiagramNode): { side: string; x: number; y: number }[] {
    return [
      { side: 'top', x: node.width / 2, y: 0 },
      { side: 'right', x: node.width, y: node.height / 2 },
      { side: 'bottom', x: node.width / 2, y: node.height },
      { side: 'left', x: 0, y: node.height / 2 },
    ];
  }

  private portWorld(node: DiagramNode, side: PortSide): Point {
    const map: Record<PortSide, Point> = {
      top: { x: node.x + node.width / 2, y: node.y },
      right: { x: node.x + node.width, y: node.y + node.height / 2 },
      bottom: { x: node.x + node.width / 2, y: node.y + node.height },
      left: { x: node.x, y: node.y + node.height / 2 },
    };
    return map[side];
  }

  private snapValue(v: number): number {
    return this.snapEnabled() ? Math.round(v / GRID) * GRID : Math.round(v);
  }

  /** 8 桁 HEX に透明度を付ける（例: #RRGGBB + '22'）。 */
  hexAlpha(hex: string, alpha: string): string {
    return hex.length === 7 ? `${hex}${alpha}` : hex;
  }

  transform(): string {
    const pan = this.pan();
    return `translate(${pan.x}, ${pan.y}) scale(${this.zoom()})`;
  }

  // アイコン描画（信頼済み HTML のキャッシュ）
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

  documentStats(): { nodes: number; edges: number } {
    const doc = this.store.doc();
    return { nodes: doc.nodes.length, edges: doc.edges.length };
  }

  exportSvgElement(): SVGSVGElement {
    return this.svgRoot().nativeElement;
  }
}
