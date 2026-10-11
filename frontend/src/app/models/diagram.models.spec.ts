import { createEmptyDocument, normalizeDocument } from './diagram.models';

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
});
