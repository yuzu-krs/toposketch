import { TestBed } from '@angular/core/testing';
import { LayoutService } from './layout.service';
import { DiagramDocument } from '../models/diagram.models';

function makeDoc(): DiagramDocument {
  const node = (id: string, x: number, y: number) => ({
    id,
    type: 'api',
    label: id,
    x,
    y,
    width: 148,
    height: 64,
    color: '#000000',
    groupId: null,
    metadata: {},
  });
  return {
    schema: 1,
    name: 'テスト',
    nodes: [node('a', 900, 900), node('b', 0, 0), node('c', 0, 500), node('d', 700, 300)],
    edges: [
      { id: 'e1', source: 'a', target: 'b', label: '', style: 'solid' as const, direction: 'forward' as const },
      { id: 'e2', source: 'a', target: 'c', label: '', style: 'solid' as const, direction: 'forward' as const },
      { id: 'e3', source: 'b', target: 'd', label: '', style: 'solid' as const, direction: 'forward' as const },
      { id: 'e4', source: 'c', target: 'd', label: '', style: 'solid' as const, direction: 'forward' as const },
    ],
    groups: [],
    background: { grid: true },
  };
}

describe('LayoutService', () => {
  let service: LayoutService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LayoutService);
  });

  it('階層構造に従ってノードを配置する（上流ほど小さい y）', () => {
    const positions = service.run(makeDoc());
    expect(positions.size).toBe(4);
    // a は流入なしのルート → 最も上
    const yOrder = [positions.get('a')!.y, positions.get('b')!.y, positions.get('c')!.y, positions.get('d')!.y];
    expect(yOrder[0]).toBeLessThan(yOrder[1]);
    expect(yOrder[0]).toBeLessThan(yOrder[2]);
    expect(yOrder[1]).toBeLessThan(yOrder[3]);
    expect(yOrder[2]).toBeLessThan(yOrder[3]);
  });

  it('同一レイヤーのノードは重ならない', () => {
    const positions = service.run(makeDoc());
    const b = positions.get('b')!;
    const c = positions.get('c')!;
    const separated = b.x + 148 + 1 <= c.x || c.x + 148 + 1 <= b.x;
    expect(b.y).toBe(c.y); // 同じ層
    expect(separated).toBe(true);
  });

  it('循環するグラフでも停止して結果を返す', () => {
    const doc = makeDoc();
    // d -> a を足して循環を作る
    doc.edges.push({ id: 'e5', source: 'd', target: 'a', label: '', style: 'solid', direction: 'forward' });
    const positions = service.run(doc);
    expect(positions.size).toBe(4);
    for (const p of positions.values()) {
      expect(Number.isFinite(p.x)).toBe(true);
      expect(Number.isFinite(p.y)).toBe(true);
    }
  });

  it('空のドキュメントでは空の結果を返す', () => {
    const doc = makeDoc();
    doc.nodes = [];
    doc.edges = [];
    expect(service.run(doc).size).toBe(0);
  });
});
