import { DIAGRAM_TEMPLATES } from './diagram-templates';
import { normalizeDocument } from './diagram.models';

describe('DIAGRAM_TEMPLATES', () => {
  it('5種類のテンプレートが定義されている', () => {
    expect(DIAGRAM_TEMPLATES.map(t => t.id)).toEqual([
      'empty', 'physical-network', 'logical-network', 'system', 'cloud',
    ]);
  });

  for (const template of DIAGRAM_TEMPLATES) {
    it(`${template.title}: 正規化を通過し参照整合がある`, () => {
      const doc = template.create();
      const restored = normalizeDocument(JSON.parse(JSON.stringify(doc)));

      // 正規化で要素が失われない（参照切れがない）
      expect(restored.nodes.length).toBe(doc.nodes.length);
      expect(restored.edges.length).toBe(doc.edges.length);
      expect(restored.groups.length).toBe(doc.groups.length);

      // ID の一意性
      expect(new Set(doc.nodes.map(n => n.id)).size).toBe(doc.nodes.length);
      expect(new Set(doc.edges.map(e => e.id)).size).toBe(doc.edges.length);

      // エッジの参照先が存在する
      const ids = new Set(doc.nodes.map(n => n.id));
      for (const edge of doc.edges) {
        expect(ids.has(edge.source)).toBe(true);
        expect(ids.has(edge.target)).toBe(true);
        expect(edge.connection).toBeDefined();
      }

      // ノード座標が有限
      for (const node of doc.nodes) {
        expect(Number.isFinite(node.x)).toBe(true);
        expect(Number.isFinite(node.y)).toBe(true);
      }
    });
  }

  it('物理ネットワークテンプレートはポート・速度・VLAN を含む', () => {
    const doc = DIAGRAM_TEMPLATES.find(t => t.id === 'physical-network')!.create();
    const withPorts = doc.edges.filter(e => e.connection.sourcePort && e.connection.targetPort);
    expect(withPorts.length).toBeGreaterThan(5);
    expect(doc.edges.some(e => e.connection.type === 'wifi')).toBe(true);
    expect(doc.edges.some(e => e.connection.type === 'fiber')).toBe(true);
    expect(doc.edges.some(e => e.connection.mode === 'trunk')).toBe(true);
    // ベンダー情報（Cisco / Yamaha）
    const vendors = doc.nodes.map(n => n.network?.vendor).filter(Boolean);
    expect(vendors).toContain('Yamaha');
    expect(vendors).toContain('Cisco');
  });

  it('論理ネットワークテンプレートはVLANグループと論理接続を含む', () => {
    const doc = DIAGRAM_TEMPLATES.find(t => t.id === 'logical-network')!.create();
    expect(doc.groups.length).toBeGreaterThanOrEqual(3);
    expect(doc.edges.some(e => e.connection.type === 'logical')).toBe(true);
    expect(doc.edges.some(e => e.connection.type === 'wifi')).toBe(true);
  });

  it('クラウドテンプレートはVNetとサブネットのグループを持つ', () => {
    const doc = DIAGRAM_TEMPLATES.find(t => t.id === 'cloud')!.create();
    expect(doc.groups.map(g => g.label).some(l => l.includes('VNet'))).toBe(true);
    expect(doc.groups.filter(g => g.label.includes('snet')).length).toBeGreaterThanOrEqual(2);
    const grouped = doc.nodes.filter(n => n.groupId).length;
    expect(grouped).toBeGreaterThanOrEqual(5);
  });
});
