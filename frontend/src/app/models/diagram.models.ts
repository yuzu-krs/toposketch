/** 構成図ドキュメントのデータモデル。フロントエンド単一の真実の情報源。 */

export type EdgeStyle = 'solid' | 'dashed';
export type EdgeDirection = 'forward' | 'both' | 'none';

/** 接続線の種別（ネットワーク構成図向け）。 */
export type EdgeConnectionType = 'ethernet' | 'fiber' | 'wifi' | 'vpn' | 'logical';

/** 接続線の詳細属性（ポート・速度・VLAN など）。 */
export interface EdgeConnection {
  type: EdgeConnectionType;
  /** 接続元ポート名（例: Gi0/1） */
  sourcePort: string;
  /** 接続先ポート名 */
  targetPort: string;
  /** 通信速度（例: 1Gbps） */
  speed: string;
  /** VLAN ID（例: 10、カンマ区切り可） */
  vlanId: string;
  /** Access / Trunk（空文字なら未設定） */
  mode: '' | 'access' | 'trunk';
  /** カスタム色（#RRGGBB。空文字なら種別の規定色） */
  color: string;
  /** 線幅（0 なら種別の規定幅） */
  width: number;
}

/** ネットワーク機器・端末の設定情報。ノード種別に応じて使われる項目が変わる。 */
export interface NodeNetworkInfo {
  hostname?: string;
  ipAddress?: string;
  /** サブネットマスク / CIDR */
  subnetMask?: string;
  defaultGateway?: string;
  vlanId?: string;
  macAddress?: string;
  /** メーカー（Cisco / Yamaha など） */
  vendor?: string;
  /** モデル名（RTX1210 / C9300 など） */
  model?: string;
  /** インターフェース情報（自由記述） */
  interfaces?: string;
  /** 備考 */
  notes?: string;
}

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
  /** ネットワーク機器・端末としての設定情報（任意） */
  network?: NodeNetworkInfo;
}

export interface DiagramEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  style: EdgeStyle;
  direction: EdgeDirection;
  /** 接続の詳細属性 */
  connection: EdgeConnection;
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

export const CONNECTION_TYPES: EdgeConnectionType[] = ['ethernet', 'fiber', 'wifi', 'vpn', 'logical'];

export function defaultConnection(): EdgeConnection {
  return { type: 'ethernet', sourcePort: '', targetPort: '', speed: '', vlanId: '', mode: '', color: '', width: 0 };
}

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
    nodes: doc.nodes.map(n => ({
      ...n,
      metadata: { ...n.metadata },
      network: n.network ? { ...n.network } : undefined,
    })),
    edges: doc.edges.map(e => ({ ...e, connection: { ...e.connection } })),
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
 * 旧バージョン（connection / network 未対応）のデータも既定値で補完される。
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
      network: normalizeNetwork(n['network']),
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
      connection: normalizeConnection(e['connection']),
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

function normalizeConnection(raw: unknown): EdgeConnection {
  const base = defaultConnection();
  if (typeof raw !== 'object' || raw === null) return base;
  const c = raw as Record<string, unknown>;
  const type = CONNECTION_TYPES.includes(c['type'] as EdgeConnectionType)
    ? (c['type'] as EdgeConnectionType)
    : 'ethernet';
  const mode = c['mode'] === 'access' || c['mode'] === 'trunk' ? c['mode'] : '';
  const width = Number(c['width']);
  return {
    type,
    sourcePort: textOrEmpty(c['sourcePort']),
    targetPort: textOrEmpty(c['targetPort']),
    speed: textOrEmpty(c['speed']),
    vlanId: textOrEmpty(c['vlanId']),
    mode,
    color: validColor(c['color']) ? String(c['color']) : '',
    width: Number.isFinite(width) && width >= 0 && width <= 6 ? width : 0,
  };
}

function normalizeNetwork(raw: unknown): NodeNetworkInfo | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined;
  const n = raw as Record<string, unknown>;
  const info: NodeNetworkInfo = {};
  const keys: (keyof NodeNetworkInfo)[] = [
    'hostname', 'ipAddress', 'subnetMask', 'defaultGateway', 'vlanId',
    'macAddress', 'vendor', 'model', 'interfaces', 'notes',
  ];
  for (const key of keys) {
    const value = n[key];
    if (typeof value === 'string' && value.trim()) {
      info[key] = value;
    }
  }
  return Object.keys(info).length ? info : undefined;
}

function textOrEmpty(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function finiteNumber(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function validColor(value: unknown): boolean {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value);
}
