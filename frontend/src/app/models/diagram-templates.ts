import {
  DEFAULT_NODE_HEIGHT,
  DEFAULT_NODE_WIDTH,
  DiagramDocument,
  DiagramEdge,
  DiagramGroup,
  DiagramNode,
  EdgeConnection,
  NodeNetworkInfo,
  createEmptyDocument,
  defaultConnection,
} from './diagram.models';
import { createSampleDocument } from './sample-diagram';

/** 新規作成ダイアログで選べる構成図テンプレート。 */
export interface DiagramTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  create: () => DiagramDocument;
}

function node(
  id: string,
  type: string,
  label: string,
  x: number,
  y: number,
  color: string,
  network: NodeNetworkInfo = {},
  groupId: string | null = null,
): DiagramNode {
  return {
    id, type, label, x, y,
    width: DEFAULT_NODE_WIDTH, height: DEFAULT_NODE_HEIGHT,
    color, groupId, metadata: {}, network,
  };
}

function edge(
  id: string,
  source: string,
  target: string,
  label: string,
  connection: Partial<EdgeConnection> = {},
): DiagramEdge {
  return {
    id, source, target, label,
    style: 'solid', direction: 'forward',
    connection: { ...defaultConnection(), ...connection },
  };
}

function group(id: string, label: string, color: string): DiagramGroup {
  return { id, label, color };
}

/** 物理ネットワーク構成図（オフィス LAN の例）。 */
function createPhysicalNetworkDocument(): DiagramDocument {
  return {
    schema: 1,
    name: '物理ネットワーク構成図（オフィス）',
    background: { grid: true },
    groups: [
      group('g-lan', '東京オフィス LAN', '#0891b2'),
      group('g-vlan10', 'VLAN 10 営業', '#16a34a'),
      group('g-vlan20', 'VLAN 20 サーバー', '#ea580c'),
      group('g-vlan30', 'VLAN 30 無線', '#8b5cf6'),
    ],
    nodes: [
      node('n-inet', 'internet', 'インターネット', 40, 260, '#94a3b8'),
      node('n-rtx', 'router', 'RTX ルーター', 280, 260, '#075985',
        { hostname: 'tokyo-rtx', ipAddress: '203.0.113.2', subnetMask: '/29', vendor: 'Yamaha', model: 'RTX1210', interfaces: 'ge1: WAN\nge2: LAN' }, 'g-lan'),
      node('n-fw', 'firewall', 'ファイアウォール', 540, 260, '#ef4444',
        { hostname: 'fw-01', ipAddress: '192.168.0.1', vendor: 'Fortinet', model: 'FortiGate 60F' }, 'g-lan'),
      node('n-core', 'switch-l3', 'コア L3 スイッチ', 820, 260, '#c2410c',
        { hostname: 'core-sw', ipAddress: '192.168.0.254', vendor: 'Cisco', model: 'Catalyst 9300', interfaces: 'Gi1/0/1-24' }, 'g-lan'),
      node('n-wlc', 'wlc', 'WLC', 820, 60, '#0f766e',
        { hostname: 'wlc-01', ipAddress: '192.168.30.2', vendor: 'Cisco', model: 'C9800-L' }, 'g-lan'),
      node('n-ap', 'access-point', '無線AP（4F）', 1060, 60, '#0284c7',
        { hostname: 'ap-4f-01', ipAddress: '192.168.30.101', vendor: 'Cisco', model: 'C9130AXI' }, 'g-vlan30'),
      node('n-sw10', 'switch-l2', 'L2 SW（営業F）', 540, 480, '#15803d',
        { hostname: 'sw-eigyo', ipAddress: '192.168.0.11', vendor: 'Yamaha', model: 'SWX2310-28G' }, 'g-lan'),
      node('n-sw20', 'switch-l2', 'L2 SW（サーバーF）', 820, 480, '#15803d',
        { hostname: 'sw-srv', ipAddress: '192.168.0.12', vendor: 'Yamaha', model: 'SWX2310-28G' }, 'g-lan'),
      node('n-pc1', 'pc', '営業PC-01', 380, 680, '#1e293b',
        { hostname: 'PC-E001', ipAddress: '192.168.10.101', macAddress: '00:11:32:AA:BB:01' }, 'g-vlan10'),
      node('n-pc2', 'laptop', '営業ノートPC', 560, 680, '#1e293b',
        { hostname: 'PC-E002', ipAddress: '192.168.10.102' }, 'g-vlan10'),
      node('n-prn', 'printer', 'プリンター', 740, 680, '#334155',
        { hostname: 'PRN-01', ipAddress: '192.168.10.201', vendor: 'Canon', model: 'LBP-673Cdw' }, 'g-vlan10'),
      node('n-srv', 'server', 'ファイルサーバー', 1020, 480, '#334155',
        { hostname: 'fs-01', ipAddress: '192.168.20.10', vendor: 'Dell', model: 'PowerEdge R450' }, 'g-vlan20'),
      node('n-nas', 'nas', 'NAS（バックアップ）', 1200, 480, '#0f766e',
        { hostname: 'nas-01', ipAddress: '192.168.20.11', vendor: 'Synology', model: 'DS923+' }, 'g-vlan20'),
      node('n-tab', 'smartphone', 'タブレット', 1060, 260, '#334155',
        { hostname: 'TAB-01', ipAddress: '192.168.30.51' }, 'g-vlan30'),
    ],
    edges: [
      edge('e1', 'n-inet', 'n-rtx', 'WAN 回線', { sourcePort: '', targetPort: 'ge1', speed: '1Gbps' }),
      edge('e2', 'n-rtx', 'n-fw', '', { sourcePort: 'ge2', targetPort: 'wan1', speed: '1Gbps' }),
      edge('e3', 'n-fw', 'n-core', '', { sourcePort: 'lan1', targetPort: 'Gi1/0/1', speed: '10Gbps', vlanId: '10,20,30', mode: 'trunk' }),
      edge('e4', 'n-core', 'n-sw10', 'フロア', { sourcePort: 'Gi1/0/2', targetPort: 'ge1', speed: '1Gbps', vlanId: '10', mode: 'trunk' }),
      edge('e5', 'n-core', 'n-sw20', '', { sourcePort: 'Gi1/0/3', targetPort: 'ge1', speed: '1Gbps', vlanId: '20', mode: 'trunk' }),
      edge('e6', 'n-core', 'n-wlc', 'CAPWAP', { sourcePort: 'Gi1/0/4', targetPort: 'ge1', speed: '1Gbps', vlanId: '30', mode: 'trunk' }),
      edge('e7', 'n-wlc', 'n-ap', '', { sourcePort: 'ge2', targetPort: 'ge1', speed: '1Gbps', type: 'fiber', vlanId: '30', mode: 'trunk' }),
      edge('e8', 'n-ap', 'n-tab', 'Wi-Fi 6', { type: 'wifi', speed: '1.2Gbps', vlanId: '30' }),
      edge('e9', 'n-sw10', 'n-pc1', '', { sourcePort: 'ge2', targetPort: 'LAN', speed: '1Gbps', vlanId: '10', mode: 'access' }),
      edge('e10', 'n-sw10', 'n-pc2', '', { sourcePort: 'ge3', targetPort: 'LAN', speed: '1Gbps', vlanId: '10', mode: 'access' }),
      edge('e11', 'n-sw10', 'n-prn', '', { sourcePort: 'ge4', targetPort: 'LAN', speed: '1Gbps', vlanId: '10', mode: 'access' }),
      edge('e12', 'n-sw20', 'n-srv', '', { sourcePort: 'ge2', targetPort: 'eth0', speed: '1Gbps', vlanId: '20', mode: 'access' }),
      edge('e13', 'n-sw20', 'n-nas', '', { sourcePort: 'ge3', targetPort: 'LAN1', speed: '1Gbps', vlanId: '20', mode: 'access' }),
    ],
  };
}

/** 論理ネットワーク構成図（サブネット・VLAN 中心）。 */
function createLogicalNetworkDocument(): DiagramDocument {
  return {
    schema: 1,
    name: '論理ネットワーク構成図（VLAN / サブネット）',
    background: { grid: true },
    groups: [
      group('g-dmz', 'DMZ 203.0.113.0/28', '#ea580c'),
      group('g-vlan10', 'VLAN 10 10.0.1.0/24（クライアント）', '#16a34a'),
      group('g-vlan20', 'VLAN 20 10.0.2.0/24（サーバー）', '#0369a1'),
    ],
    nodes: [
      node('n-inet', 'internet', 'インターネット', 40, 300, '#94a3b8'),
      node('n-rtx', 'router', 'エッジルーター', 300, 300, '#075985',
        { hostname: 'edge-rt', ipAddress: '203.0.113.2/28', vendor: 'Yamaha', model: 'RTX830' }),
      node('n-fw', 'firewall', 'FW（ポリシー）', 580, 300, '#ef4444',
        { hostname: 'fw-01', notes: 'VLAN 間通信はFW経由' }),
      node('n-web', 'vm', 'Web サーバー', 850, 120, '#334155',
        { hostname: 'web-01', ipAddress: '203.0.113.10', vendor: 'VMware', model: 'ESXi VM' }, 'g-dmz'),
      node('n-dns', 'dns', 'DNS（公開）', 1060, 120, '#1e40ab', { hostname: 'dns-ext', ipAddress: '203.0.113.11' }, 'g-dmz'),
      node('n-core', 'switch-l3', 'L3 SW（ゲートウェイ）', 850, 300, '#c2410c',
        { hostname: 'core-sw', ipAddress: '10.0.0.254', notes: '各 VLAN のゲートウェイ' }),
      node('n-pc', 'pc', 'クライアント PC', 780, 520, '#1e293b', { hostname: 'PC-A001', ipAddress: '10.0.1.101', defaultGateway: '10.0.1.254' }, 'g-vlan10'),
      node('n-tab', 'smartphone', 'モバイル', 980, 520, '#334155', { hostname: 'SP-001', ipAddress: '10.0.1.102' }, 'g-vlan10'),
      node('n-dhcp', 'dhcp', 'DHCP', 1180, 520, '#be185d', { ipAddress: '10.0.1.5', notes: 'リース 10.0.1.100-200' }, 'g-vlan10'),
      node('n-srv', 'server', 'アプリサーバー', 850, 700, '#334155', { hostname: 'app-01', ipAddress: '10.0.2.10' }, 'g-vlan20'),
      node('n-db', 'nas', 'ストレージ', 1060, 700, '#0f766e', { hostname: 'st-01', ipAddress: '10.0.2.20' }, 'g-vlan20'),
    ],
    edges: [
      edge('e1', 'n-inet', 'n-rtx', '', { type: 'logical', speed: '1Gbps' }),
      edge('e2', 'n-rtx', 'n-fw', '', { type: 'logical' }),
      edge('e3', 'n-fw', 'n-web', 'HTTPS 443', { type: 'logical', sourcePort: '', targetPort: '203.0.113.10:443' }),
      edge('e4', 'n-fw', 'n-dns', 'UDP 53', { type: 'logical' }),
      edge('e5', 'n-fw', 'n-core', '', { type: 'logical', vlanId: '10,20', mode: 'trunk' }),
      edge('e6', 'n-core', 'n-pc', '', { type: 'logical', vlanId: '10', mode: 'access' }),
      edge('e7', 'n-core', 'n-tab', 'Wi-Fi', { type: 'wifi', vlanId: '10' }),
      edge('e8', 'n-core', 'n-dhcp', 'DHCP リレー', { type: 'logical', vlanId: '10' }),
      edge('e9', 'n-core', 'n-srv', '', { type: 'logical', vlanId: '20', mode: 'access' }),
      edge('e10', 'n-core', 'n-db', '', { type: 'logical', vlanId: '20', mode: 'access' }),
    ],
  };
}

/** クラウド構成図（Azure の例）。 */
function createCloudDocument(): DiagramDocument {
  return {
    schema: 1,
    name: 'クラウド構成図（Azure 東日本）',
    background: { grid: true },
    groups: [
      group('g-vnet', 'VNet 10.1.0.0/16（japaneast）', '#0078d4'),
      group('g-snet-app', 'snet-app 10.1.1.0/24', '#0ea5e9'),
      group('g-snet-data', 'snet-data 10.1.2.0/24', '#6366f1'),
    ],
    nodes: [
      node('n-inet', 'internet', 'インターネット', 40, 240, '#94a3b8'),
      node('n-cdn', 'cdn', 'Front Door / CDN', 300, 240, '#06b6d4'),
      node('n-app', 'appservice', 'App Service', 620, 140, '#0078d4',
        { hostname: 'app-prod-ej', notes: 'プラン: P1v3, スケールアウト 2-6' }, 'g-snet-app'),
      node('n-func', 'functions', 'Functions（バッチ）', 620, 320, '#0078d4', {}, 'g-snet-app'),
      node('n-sb', 'servicebus', 'Service Bus', 340, 320, '#0078d4', {}, 'g-vnet'),
      node('n-kv', 'keyvault', 'Key Vault', 340, 480, '#0078d4', { notes: 'シークレット / 証明書' }, 'g-vnet'),
      node('n-sql', 'sqlserver', 'Azure SQL', 940, 140, '#d83b01', { ipAddress: 'sql-prod-ej.database.windows.net' }, 'g-snet-data'),
      node('n-redis', 'redis', 'Azure Cache', 940, 320, '#dc382d', {}, 'g-snet-data'),
      node('n-blob', 'storage', 'Blob Storage', 940, 480, '#0078d4', { notes: '静的資産 / バックアップ' }, 'g-vnet'),
    ],
    edges: [
      edge('e1', 'n-inet', 'n-cdn', 'HTTPS', { type: 'logical', speed: 'CDN' }),
      edge('e2', 'n-cdn', 'n-app', '', { type: 'logical' }),
      edge('e3', 'n-app', 'n-sql', 'SQL 認証 1433', { type: 'logical', sourcePort: '', targetPort: '1433' }),
      edge('e4', 'n-app', 'n-redis', 'TLS 6380', { type: 'logical' }),
      edge('e5', 'n-app', 'n-sb', 'キュー送信', { type: 'logical' }),
      edge('e6', 'n-sb', 'n-func', 'トリガー', { type: 'logical' }),
      edge('e7', 'n-func', 'n-blob', '出力', { type: 'logical' }),
      edge('e8', 'n-app', 'n-kv', 'マネージド ID', { type: 'vpn' }),
    ],
  };
}

export const DIAGRAM_TEMPLATES: DiagramTemplate[] = [
  {
    id: 'empty',
    title: '空の図',
    description: '何もない状態から自由に作成します。',
    category: '基本',
    create: () => createEmptyDocument('無題の図'),
  },
  {
    id: 'physical-network',
    title: '物理ネットワーク構成図',
    description: 'ルーター・L2/L3 スイッチ・FW・無線AP・端末の物理接続（ポート・速度・VLAN 付き）。Cisco / Yamaha 機器の例。',
    category: 'ネットワーク',
    create: createPhysicalNetworkDocument,
  },
  {
    id: 'logical-network',
    title: '論理ネットワーク構成図',
    description: 'サブネット・VLAN・DMZ を中心とした論理構成。IP セグメントと経路を表現。',
    category: 'ネットワーク',
    create: createLogicalNetworkDocument,
  },
  {
    id: 'system',
    title: 'システムアーキテクチャ図',
    description: 'Angular + ASP.NET Core + SQL Server の Web アプリ構成例。',
    category: 'アプリケーション',
    create: createSampleDocument,
  },
  {
    id: 'cloud',
    title: 'クラウド構成図',
    description: 'Azure の VNet・サブネット・マネージドサービス構成例。',
    category: 'アプリケーション',
    create: createCloudDocument,
  },
];
