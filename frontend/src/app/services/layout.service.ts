import { Injectable } from '@angular/core';
import { DiagramDocument, DiagramNode } from '../models/diagram.models';

export interface LayoutOptions {
  horizontalGap: number;
  verticalGap: number;
}

const DEFAULT_OPTIONS: LayoutOptions = { horizontalGap: 70, verticalGap: 80 };

/**
 * 階層型自動レイアウト（Sugiyama スタイルの簡略版）。
 * 1. DFS でバックエッジ（循環を戻す辺）を検出して除外し DAG 化
 * 2. 最長経路でレイヤー（行）を割り当て
 * 3. 重心法（バリセンター）のスイープでレイヤー内の並びを改善
 * 4. レイヤー・ノード寸法から座標を割り当て
 */
@Injectable({ providedIn: 'root' })
export class LayoutService {
  run(doc: DiagramDocument, options: Partial<LayoutOptions> = {}): Map<string, { x: number; y: number }> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const positions = new Map<string, { x: number; y: number }>();
    if (!doc.nodes.length) return positions;

    const index = new Map(doc.nodes.map(n => [n.id, n]));
    const edges = doc.edges
      .filter(e => index.has(e.source) && index.has(e.target) && e.source !== e.target)
      .map(e => ({ source: e.source, target: e.target }));

    const keptEdges = this.removeBackEdges(doc.nodes.map(n => n.id), edges);
    const layers = this.assignLayers(doc.nodes.map(n => n.id), keptEdges);
    const order = this.orderWithinLayers(doc.nodes, keptEdges, layers);

    // レイヤーごとの高さ・幅を計算して座標を割り当てる
    const maxLayer = Math.max(...layers.values());
    const byLayer = new Map<number, string[]>();
    for (const [id, layer] of layers) {
      const list = byLayer.get(layer) ?? [];
      list.push(id);
      byLayer.set(layer, list);
    }

    let y = 0;
    const layerWidths: number[] = [];
    const layerHeights: number[] = [];
    for (let l = 0; l <= maxLayer; l++) {
      const ids = order.get(l) ?? [];
      const height = Math.max(DEFAULT_MIN_HEIGHT, ...ids.map(id => index.get(id)!.height));
      const width = ids.reduce((sum, id) => sum + index.get(id)!.width, 0) + Math.max(0, ids.length - 1) * opts.horizontalGap;
      layerWidths[l] = width;
      layerHeights[l] = height;
      y += height + opts.verticalGap;
    }
    const maxWidth = Math.max(0, ...layerWidths);

    y = 0;
    for (let l = 0; l <= maxLayer; l++) {
      const ids = order.get(l) ?? [];
      const x0 = (maxWidth - layerWidths[l]) / 2;
      let x = x0;
      for (const id of ids) {
        const node = index.get(id)!;
        positions.set(id, {
          x: Math.round(x),
          y: Math.round(y + (layerHeights[l] - node.height) / 2),
        });
        x += node.width + opts.horizontalGap;
      }
      y += layerHeights[l] + opts.verticalGap;
    }

    return positions;
  }

  /** DFS で循環の原因になるバックエッジを検出し、除外した辺のリストを返す。 */
  private removeBackEdges(nodeIds: string[], edges: { source: string; target: string }[]): { source: string; target: string }[] {
    const adjacency = new Map<string, string[]>();
    for (const id of nodeIds) adjacency.set(id, []);
    for (const e of edges) adjacency.get(e.source)!.push(e.target);

    const state = new Map<string, 0 | 1 | 2>(); // 0=未訪問 1=探索中 2=完了
    for (const id of nodeIds) state.set(id, 0);

    const backEdges = new Set<string>();
    const label = (e: { source: string; target: string }) => `${e.source}->${e.target}`;

    const visit = (id: string) => {
      const stack: { id: string; iter: number }[] = [{ id, iter: 0 }];
      state.set(id, 1);
      while (stack.length) {
        const frame = stack[stack.length - 1];
        const neighbors = adjacency.get(frame.id) ?? [];
        if (frame.iter < neighbors.length) {
          const next = neighbors[frame.iter++];
          const s = state.get(next);
          if (s === 1) {
            backEdges.add(label({ source: frame.id, target: next }));
          } else if (s === 0) {
            state.set(next, 1);
            stack.push({ id: next, iter: 0 });
          }
        } else {
          state.set(frame.id, 2);
          stack.pop();
        }
      }
    };

    for (const id of nodeIds) {
      if (state.get(id) === 0) visit(id);
    }

    return edges.filter(e => !backEdges.has(label(e)));
  }

  /** 最長経路ベースのレイヤー割り当て（DAG である前提）。 */
  private assignLayers(nodeIds: string[], edges: { source: string; target: string }[]): Map<string, number> {
    const layers = new Map<string, number>();
    for (const id of nodeIds) layers.set(id, 0);

    const incoming = new Map<string, string[]>();
    for (const id of nodeIds) incoming.set(id, []);
    for (const e of edges) incoming.get(e.target)!.push(e.source);

    // 反復緩和。DAG なので高々 |V| 回で収束する。
    for (let iter = 0; iter < nodeIds.length + 1; iter++) {
      let changed = false;
      for (const e of edges) {
        const candidate = layers.get(e.source)! + 1;
        if (candidate > layers.get(e.target)!) {
          layers.set(e.target, Math.min(candidate, nodeIds.length - 1));
          changed = true;
        }
      }
      if (!changed) break;
    }
    return layers;
  }

  /** 重心法でレイヤー内の順序を改善する。 */
  private orderWithinLayers(
    nodes: DiagramNode[],
    edges: { source: string; target: string }[],
    layers: Map<string, number>,
  ): Map<number, string[]> {
    const maxLayer = Math.max(...layers.values());
    const order = new Map<number, string[]>();
    for (const node of nodes) {
      const l = layers.get(node.id)!;
      const list = order.get(l) ?? [];
      list.push(node.id);
      order.set(l, list);
    }
    // 初期順序は現在の y 座標で安定させる
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    for (const list of order.values()) {
      list.sort((a, b) => nodeMap.get(a)!.y - nodeMap.get(b)!.y);
    }

    const neighborsOf = (id: string, layer: number): number[] => {
      const positions: number[] = [];
      const neighborLayerList = order.get(layer) ?? [];
      for (const e of edges) {
        const other = e.source === id ? e.target : e.target === id ? e.source : null;
        if (other === null) continue;
        const pos = neighborLayerList.indexOf(other);
        if (pos >= 0) positions.push(pos);
      }
      return positions;
    };

    const sweep = (upward: boolean) => {
      const start = upward ? 1 : maxLayer - 1;
      const end = upward ? maxLayer : -1;
      const step = upward ? 1 : -1;
      for (let l = start; l !== end; l += step) {
        const reference = upward ? l - 1 : l + 1;
        const list = order.get(l) ?? [];
        const scored = list.map((id, i) => {
          const neighbors = neighborsOf(id, reference);
          const bary = neighbors.length ? neighbors.reduce((a, b) => a + b, 0) / neighbors.length : i;
          return { id, bary };
        });
        scored.sort((a, b) => a.bary - b.bary);
        order.set(l, scored.map(s => s.id));
      }
    };

    for (let i = 0; i < 2; i++) {
      sweep(true);
      sweep(false);
    }
    return order;
  }
}

const DEFAULT_MIN_HEIGHT = 40;
