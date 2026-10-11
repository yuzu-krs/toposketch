import { DiagramDocument, DiagramEdge, DiagramGroup, DiagramNode } from './diagram.models';

/** キャンバス上の幾何計算ユーティリティ（描画・ヒットテスト共通）。 */

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function nodeCenter(node: DiagramNode): Point {
  return { x: node.x + node.width / 2, y: node.y + node.height / 2 };
}

export function nodeRect(node: DiagramNode): Rect {
  return { x: node.x, y: node.y, width: node.width, height: node.height };
}

export function rectsIntersect(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function rectContains(rect: Rect, p: Point): boolean {
  return p.x >= rect.x && p.x <= rect.x + rect.width && p.y >= rect.y && p.y <= rect.y + rect.height;
}

export function unionRect(rects: Rect[]): Rect | null {
  if (!rects.length) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const r of rects) {
    minX = Math.min(minX, r.x);
    minY = Math.min(minY, r.y);
    maxX = Math.max(maxX, r.x + r.width);
    maxY = Math.max(maxY, r.y + r.height);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/** グループに属するノードを囲む矩形（ラベル・余白込み）。 */
export function groupBounds(group: DiagramGroup, nodes: DiagramNode[]): Rect {
  const members = nodes.filter(n => n.groupId === group.id);
  const base = unionRect(members.map(nodeRect));
  if (!base) {
    return { x: 0, y: 0, width: 220, height: 140 };
  }
  const pad = 26;
  const labelSpace = 14;
  return {
    x: base.x - pad,
    y: base.y - pad - labelSpace,
    width: base.width + pad * 2,
    height: base.height + pad * 2 + labelSpace,
  };
}

export interface EdgeGeometry {
  /** SVG path の d 属性 */
  d: string;
  /** ベジェ中点（ラベル配置用） */
  mid: Point;
}

/** ノードの相対位置から接続辺を選び、ベジェパスを生成する。 */
export function edgeGeometry(source: DiagramNode, target: DiagramNode): EdgeGeometry {
  const sc = nodeCenter(source);
  const tc = nodeCenter(target);
  const dx = tc.x - sc.x;
  const dy = tc.y - sc.y;

  let sp: Point, tp: Point, sn: Point, tn: Point;
  if (Math.abs(dx) >= Math.abs(dy)) {
    const dir = dx >= 0 ? 1 : -1;
    sp = { x: sc.x + (dir * source.width) / 2, y: sc.y };
    tp = { x: tc.x - (dir * target.width) / 2, y: tc.y };
    sn = { x: dir, y: 0 };
    tn = { x: -dir, y: 0 };
  } else {
    const dir = dy >= 0 ? 1 : -1;
    sp = { x: sc.x, y: sc.y + (dir * source.height) / 2 };
    tp = { x: tc.x, y: tc.y - (dir * target.height) / 2 };
    sn = { x: 0, y: dir };
    tn = { x: 0, y: -dir };
  }

  const dist = Math.hypot(tp.x - sp.x, tp.y - sp.y);
  const k = Math.min(140, Math.max(40, dist * 0.45));
  const c1 = { x: sp.x + sn.x * k, y: sp.y + sn.y * k };
  const c2 = { x: tp.x + tn.x * k, y: tp.y + tn.y * k };

  return {
    d: `M ${round(sp.x)} ${round(sp.y)} C ${round(c1.x)} ${round(c1.y)}, ${round(c2.x)} ${round(c2.y)}, ${round(tp.x)} ${round(tp.y)}`,
    mid: cubicMidpoint(sp, c1, c2, tp),
  };
}

function cubicMidpoint(p0: Point, p1: Point, p2: Point, p3: Point): Point {
  const t = 0.5;
  const mt = 1 - t;
  return {
    x: mt * mt * mt * p0.x + 3 * mt * mt * t * p1.x + 3 * mt * t * t * p2.x + t * t * t * p3.x,
    y: mt * mt * mt * p0.y + 3 * mt * mt * t * p1.y + 3 * mt * t * t * p2.y + t * t * t * p3.y,
  };
}

/** ノードの4辺の中点（接続ポート位置）。 */
export function portPoints(node: DiagramNode): Record<'top' | 'right' | 'bottom' | 'left', Point> {
  return {
    top: { x: node.x + node.width / 2, y: node.y },
    right: { x: node.x + node.width, y: node.y + node.height / 2 },
    bottom: { x: node.x + node.width / 2, y: node.y + node.height },
    left: { x: node.x, y: node.y + node.height / 2 },
  };
}

/** ジオメトリのヒットテスト：ポイントを含む最前面のノード（後勝ち）。 */
export function nodeAt(doc: DiagramDocument, p: Point): DiagramNode | null {
  for (let i = doc.nodes.length - 1; i >= 0; i--) {
    const n = doc.nodes[i];
    const expanded = { x: n.x - 2, y: n.y - 2, width: n.width + 4, height: n.height + 4 };
    if (rectContains(expanded, p)) return n;
  }
  return null;
}

/** ポイントを含む最前面のグループ（後勝ち、ノードの下）。 */
export function groupAt(doc: DiagramDocument, p: Point): DiagramGroup | null {
  for (let i = doc.groups.length - 1; i >= 0; i--) {
    const g = doc.groups[i];
    if (rectContains(groupBounds(g, doc.nodes), p)) return g;
  }
  return null;
}

/** ドキュメント全体を囲む矩形（フィット表示用）。 */
export function contentBounds(doc: DiagramDocument): Rect | null {
  const rects: Rect[] = doc.nodes.map(nodeRect);
  for (const g of doc.groups) {
    rects.push(groupBounds(g, doc.nodes));
  }
  return unionRect(rects);
}

export function round(v: number): number {
  return Math.round(v * 10) / 10;
}

/** エッジの参照整合チェック（削除後のクリーンアップ用）。 */
export function edgeTouchesNode(edge: DiagramEdge, nodeId: string): boolean {
  return edge.source === nodeId || edge.target === nodeId;
}
