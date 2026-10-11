import { DiagramDocument, EdgeConnection } from './diagram.models';

function connection(overrides: Partial<EdgeConnection> = {}): EdgeConnection {
  return {
    type: 'ethernet', sourcePort: '', targetPort: '', speed: '',
    vlanId: '', mode: '', color: '', width: 0, ...overrides,
  };
}

/** 初回起動時のデモ用サンプル構成図（Web アプリの一般的なアーキテクチャ）。 */
export function createSampleDocument(): DiagramDocument {
  return {
    schema: 1,
    name: 'サンプル: Web アプリ アーキテクチャ',
    background: { grid: true },
    groups: [
      { id: 'g-frontend', label: 'フロントエンド', color: '#0ea5e9' },
      { id: 'g-azure', label: 'Azure', color: '#0078d4' },
    ],
    nodes: [
      { id: 'n-user', type: 'user', label: 'ユーザー', x: 40, y: 300, width: 130, height: 64, color: '#0891b2', groupId: null, metadata: { 数: '約1,000 DAU' } },
      { id: 'n-cdn', type: 'cdn', label: 'CDN', x: 280, y: 120, width: 130, height: 64, color: '#06b6d4', groupId: 'g-frontend', metadata: {} },
      { id: 'n-spa', type: 'angular', label: 'SPA フロントエンド', x: 280, y: 280, width: 160, height: 64, color: '#dd0031', groupId: 'g-frontend', metadata: { 言語: 'TypeScript' } },
      { id: 'n-api', type: 'aspnet', label: 'REST API', x: 560, y: 280, width: 160, height: 64, color: '#512bd4', groupId: null, metadata: { フレームワーク: 'ASP.NET Core 10' } },
      { id: 'n-sql', type: 'sqlserver', label: 'SQL Server', x: 850, y: 180, width: 150, height: 64, color: '#d83b01', groupId: null, metadata: { 接続: 'EF Core' } },
      { id: 'n-redis', type: 'redis', label: 'Redis キャッシュ', x: 850, y: 330, width: 150, height: 64, color: '#dc382d', groupId: null, metadata: {} },
      { id: 'n-func', type: 'functions', label: '画像リサイズ', x: 560, y: 470, width: 160, height: 64, color: '#0078d4', groupId: 'g-azure', metadata: { トリガー: 'Service Bus' } },
      { id: 'n-sb', type: 'servicebus', label: 'Service Bus', x: 280, y: 470, width: 160, height: 64, color: '#0078d4', groupId: 'g-azure', metadata: {} },
      { id: 'n-blob', type: 'storage', label: 'Blob Storage', x: 850, y: 470, width: 150, height: 64, color: '#0078d4', groupId: 'g-azure', metadata: { コンテナー: 'images' } },
    ],
    edges: [
      { id: 'e-1', source: 'n-user', target: 'n-spa', label: 'HTTPS', style: 'solid', direction: 'forward', connection: connection({ type: 'logical', speed: 'HTTPS' }) },
      { id: 'e-2', source: 'n-spa', target: 'n-cdn', label: '静的アセット', style: 'solid', direction: 'forward', connection: connection() },
      { id: 'e-3', source: 'n-spa', target: 'n-api', label: 'REST / JSON', style: 'solid', direction: 'both', connection: connection({ type: 'logical', speed: 'HTTPS' }) },
      { id: 'e-4', source: 'n-api', target: 'n-sql', label: 'EF Core', style: 'solid', direction: 'forward', connection: connection() },
      { id: 'e-5', source: 'n-api', target: 'n-redis', label: 'キャッシュ', style: 'dashed', direction: 'forward', connection: connection({ type: 'logical' }) },
      { id: 'e-6', source: 'n-api', target: 'n-sb', label: 'キュー投入', style: 'dashed', direction: 'forward', connection: connection({ type: 'logical' }) },
      { id: 'e-7', source: 'n-sb', target: 'n-func', label: 'トリガー', style: 'solid', direction: 'forward', connection: connection({ type: 'logical' }) },
      { id: 'e-8', source: 'n-func', target: 'n-blob', label: '画像保存', style: 'solid', direction: 'forward', connection: connection() },
      { id: 'e-9', source: 'n-func', target: 'n-sql', label: '書き込み', style: 'solid', direction: 'forward', connection: connection() },
    ],
  };
}
