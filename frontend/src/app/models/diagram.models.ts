/** 構成図ドキュメントのデータモデル。フロントエンド単一の真実の情報源。 */

export type EdgeStyle = 'solid' | 'dashed';
export type EdgeDirection = 'forward' | 'both' | 'none';

export interface DiagramNode {
  id: string;
  /** コンポーネント種別キー（icon-registry のキー。'custom' は任意コンポーネント） */
  type: string;
  label: string;
  /** ワールド座標（左上基準） */
  x: number;
  y: number;
  width: number;
  height: number;
  /** アクセント色（枠線・アイコン背景など） */
  color: string;
  /** 所属グループ。未所属なら null */
  groupId: string | null;
  /** 任意のキー・バリュー属性 */
  metadata: Record<string, string>;
}

export interface DiagramEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  style: EdgeStyle;
  direction: EdgeDirection;
}

export interface DiagramGroup {
  id: string;
  label: string;
  color: string;
}

export interface DiagramDocument {
  schema: 1;
  name: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  groups: DiagramGroup[];
  background: { grid: boolean };
}

export interface Selection {
  nodeIds: string[];
  edgeIds: string[];
  groupIds: string[];
}

export const DEFAULT_NODE_WIDTH = 148;
export const DEFAULT_NODE_HEIGHT = 64;
export const DEFAULT_CUSTOM_COLOR = '#64748b';
export const DEFAULT_GROUP_COLOR = '#6366f1';

export function newId(): string {
  return crypto.randomUUID();
}

export function createEmptyDocument(name = '無題の図'): DiagramDocument {
  return {
    schema: 1,
    name,
    nodes: [],
    edges: [],
    groups: [],
    background: { grid: true },
  };
}

export function cloneDocument(doc: DiagramDocument): DiagramDocument {
  return {
    ...doc,
    nodes: doc.nodes.map(n => ({ ...n, metadata: { ...n.metadata } })),
    edges: doc.edges.map(e => ({ ...e })),
    groups: doc.groups.map(g => ({ ...g })),
    background: { ...doc.background },
  };
}

export function emptySelection(): Selection {
  return { nodeIds: [], edgeIds: [], groupIds: [] };
}

export function isSelectionEmpty(selection: Selection): boolean {
  return selection.nodeIds.length + selection.edgeIds.length + selection.groupIds.length === 0;
}

/**
 * 読み込み・インポートした JSON を検証して DiagramDocument に正規化する。
 * 不正な場合は日本語のエラーメッセージを伴う Error を投げる。
 */
export function normalizeDocument(raw: unknown): DiagramDocument {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('図データがオブジェクトではありません。');
  }
  const obj = raw as Record<string, unknown>;
  if (obj['schema'] !== 1) {
    throw new Error('サポートされていないスキーマバージョンです（schema: 1 が必要）。');
  }

  const name = typeof obj['name'] === 'string' && obj['name'].trim() ? obj['name'] : '無題の図';

  if (!Array.isArray(obj['nodes']) || !Array.isArray(obj['edges']) || !Array.isArray(obj['groups'])) {
    throw new Error('nodes / edges / groups 配列が見つかりません。');
  }

  const nodes: DiagramNode[] = (obj['nodes'] as unknown[]).map((item, i) => {
    if (typeof item !== 'object' || item === null) throw new Error(`${i + 1} 番目のノードが不正です。`);
    const n = item as Record<string, unknown>;
    const id = String(n['id'] ?? '');
    if (!id) throw new Error(`${i + 1} 番目のノードに id がありません。`);
    const metadata: Record<string, string> = {};
    if (typeof n['metadata'] === 'object' && n['metadata'] !== null) {
      for (const [k, v] of Object.entries(n['metadata'] as Record<string, unknown>)) {
        metadata[k] = String(v ?? '');
      }
    }
    return {
      id,
      type: String(n['type'] ?? 'custom'),
      label: String(n['label'] ?? ''),
      x: finiteNumber(n['x'], 0),
      y: finiteNumber(n['y'], 0),
      width: finiteNumber(n['width'], DEFAULT_NODE_WIDTH),
      height: finiteNumber(n['height'], DEFAULT_NODE_HEIGHT),
      color: validColor(n['color']) ? String(n['color']) : DEFAULT_CUSTOM_COLOR,
      groupId: typeof n['groupId'] === 'string' ? n['groupId'] : null,
      metadata,
    };
  });

  const nodeIds = new Set(nodes.map(n => n.id));

  const groups: DiagramGroup[] = (obj['groups'] as unknown[]).map((item, i) => {
    if (typeof item !== 'object' || item === null) throw new Error(`${i + 1} 番目のグループが不正です。`);
    const g = item as Record<string, unknown>;
    return {
      id: String(g['id'] ?? ''),
      label: String(g['label'] ?? 'グループ'),
      color: validColor(g['color']) ? String(g['color']) : DEFAULT_GROUP_COLOR,
    };
  }).filter(g => g.id);

  const groupIds = new Set(groups.map(g => g.id));
  for (const node of nodes) {
    if (node.groupId !== null && !groupIds.has(node.groupId)) {
      node.groupId = null;
    }
  }

  const edges: DiagramEdge[] = [];
  const seen = new Set<string>();
  for (const item of (obj['edges'] as unknown[])) {
    if (typeof item !== 'object' || item === null) continue;
    const e = item as Record<string, unknown>;
    const id = String(e['id'] ?? newId());
    const source = String(e['source'] ?? '');
    const target = String(e['target'] ?? '');
    // 参照先が存在しないエッジは警告のうえ破棄（読み込み自体は成功させる）
    if (!nodeIds.has(source) || !nodeIds.has(target) || source === target) continue;
    const dedupeKey = `${source}->${target}#${seen.size}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    edges.push({
      id,
      source,
      target,
      label: String(e['label'] ?? ''),
      style: e['style'] === 'dashed' ? 'dashed' : 'solid',
      direction: e['direction'] === 'both' || e['direction'] === 'none' ? e['direction'] : 'forward',
    });
  }

  const rawBackground = obj['background'];
  const grid = typeof rawBackground === 'object' && rawBackground !== null
    ? (rawBackground as Record<string, unknown>)['grid']
    : undefined;

  return {
    schema: 1,
    name,
    nodes,
    edges,
    groups,
    background: { grid: typeof grid === 'boolean' ? grid : true },
  };
}

function finiteNumber(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function validColor(value: unknown): boolean {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value);
}
