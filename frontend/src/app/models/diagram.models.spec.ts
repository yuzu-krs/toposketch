import { createEmptyDocument, defaultConnection, normalizeDocument } from './diagram.models';

describe('normalizeDocument', () => {
  it('有効なドキュメントをそのまま受け入れる', () => {
    const doc = createEmptyDocument('テスト');
    const restored = normalizeDocument(JSON.parse(JSON.stringify(doc)));
    expect(restored.name).toBe('テスト');
    expect(restored.nodes).toEqual([]);
    expect(restored.background.grid).toBe(true);
  });

  it('スキーマ不一致はエラー', () => {
    expect(() => normalizeDocument({ schema: 2, nodes: [], edges: [], groups: [] })).toThrowError(/スキーマ/);
  });

  it('配列がない場合はエラー', () => {
    expect(() => normalizeDocument({ schema: 1 })).toThrowError(/nodes/);
  });

  it('参照先のないエッジは破棄される', () => {
    const raw = {
      schema: 1,
      name: 'x',
      nodes: [{ id: 'a', type: 'api', label: 'A', x: 0, y: 0, width: 100, height: 60, color: '#112233', groupId: null, metadata: {} }],
      edges: [
        { id: 'e1', source: 'a', target: 'missing', label: '', style: 'solid', direction: 'forward' },
        { id: 'e2', source: 'a', target: 'a', label: '', style: 'solid', direction: 'forward' },
      ],
      groups: [],
      background: { grid: true },
    };
    const doc = normalizeDocument(raw);
    expect(doc.edges).toEqual([]);
    expect(doc.nodes).toHaveSize(1);
  });

  it('存在しないグループへの所属は解除される', () => {
    const raw = {
      schema: 1,
      nodes: [{ id: 'a', type: 'api', label: 'A', x: 0, y: 0, width: 100, height: 60, color: '#112233', groupId: 'ghost', metadata: {} }],
      edges: [],
      groups: [{ id: 'g1', label: '本物', color: '#6366f1' }],
      background: { grid: true },
    };
    const doc = normalizeDocument(raw);
    expect(doc.nodes[0].groupId).toBeNull();
  });

  it('不正な色や座標は既定値へフォールバックする', () => {
    const raw = {
      schema: 1,
      nodes: [{ id: 'a', type: 'api', label: 'A', x: 'bad', y: null, width: undefined, height: '50', color: 'red', groupId: null, metadata: { v: 1 } }],
      edges: [],
      groups: [],
      background: {},
    };
    const doc = normalizeDocument(raw);
    expect(doc.nodes[0].x).toBe(0);
    expect(doc.nodes[0].width).toBe(148);
    expect(doc.nodes[0].color).toBe('#64748b');
    expect(doc.nodes[0].metadata['v']).toBe('1');
    expect(doc.background.grid).toBe(true);
  });

  it('旧形式（connection / network なし）のデータを既定値で補完する', () => {
    const raw = {
      schema: 1,
      nodes: [{ id: 'a', type: 'router', label: 'RTX', x: 0, y: 0, width: 148, height: 64, color: '#075985', groupId: null, metadata: {} }],
      edges: [{ id: 'e1', source: 'a', target: 'a2', label: '', style: 'dashed', direction: 'forward' }],
      groups: [],
    };
    // target が存在しないためエッジは破棄されるが、別途旧形式エッジを検証
    raw.nodes.push({ id: 'a2', type: 'switch-l2', label: 'SW', x: 200, y: 0, width: 148, height: 64, color: '#15803d', groupId: null, metadata: {} });
    const doc = normalizeDocument(raw);
    expect(doc.nodes[0].network).toBeUndefined();
    expect(doc.edges[0].connection).toEqual(defaultConnection());
  });

  it('ネットワーク情報と接続詳細を正規化する', () => {
    const raw = {
      schema: 1,
      nodes: [{
        id: 'r1', type: 'router', label: 'RTX', x: 0, y: 0, width: 148, height: 64,
        color: '#075985', groupId: null, metadata: {},
        network: { hostname: 'gw', ipAddress: '192.168.1.1', vendor: 'Yamaha', model: 'RTX1210', notes: '' },
      }, {
        id: 's1', type: 'switch-l2', label: 'SW', x: 200, y: 0, width: 148, height: 64,
        color: '#15803d', groupId: null, metadata: {},
      }],
      edges: [{
        id: 'e1', source: 'r1', target: 's1', label: 'uplink', style: 'solid', direction: 'both',
        connection: { type: 'fiber', sourcePort: 'ge2', targetPort: 'ge1', speed: '10Gbps', vlanId: '10,20', mode: 'trunk', color: '#f59e0b', width: 3 },
      }],
      groups: [],
      background: { grid: true },
    };
    const doc = normalizeDocument(raw);
    expect(doc.nodes[0].network?.hostname).toBe('gw');
    expect(doc.nodes[0].network?.notes).toBeUndefined(); // 空文字は除去
    const connection = doc.edges[0].connection;
    expect(connection.type).toBe('fiber');
    expect(connection.mode).toBe('trunk');
    expect(connection.speed).toBe('10Gbps');
  });

  it('接続詳細の不正な値は既定へフォールバックする', () => {
    const raw = {
      schema: 1,
      nodes: [
        { id: 'a', type: 'api', label: 'A', x: 0, y: 0, width: 148, height: 64, color: '#000000', groupId: null, metadata: {} },
        { id: 'b', type: 'api', label: 'B', x: 1, y: 1, width: 148, height: 64, color: '#000000', groupId: null, metadata: {} },
      ],
      edges: [{ id: 'e1', source: 'a', target: 'b', connection: { type: 'unknown', mode: 'bad', width: 99, color: 'red' } }],
      groups: [],
      background: { grid: true },
    };
    const doc = normalizeDocument(raw);
    const connection = doc.edges[0].connection;
    expect(connection.type).toBe('ethernet');
    expect(connection.mode).toBe('');
    expect(connection.width).toBe(0);
    expect(connection.color).toBe('');
  });
});
