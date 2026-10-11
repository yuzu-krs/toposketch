import { TestBed } from '@angular/core/testing';
import { DiagramStore } from './diagram-store.service';
import { createEmptyDocument, DiagramDocument } from '../models/diagram.models';

describe('DiagramStore', () => {
  let store: DiagramStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(DiagramStore);
    store.load(createEmptyDocument('テスト図'), null);
  });

  const doc = (): DiagramDocument => store.doc();

  describe('addNodeAt / patchNode', () => {
    it('ノードを追加して選択する', () => {
      const id = store.addNodeAt({ key: 'angular', label: 'Angular', color: '#DD0031' }, 100, 200);
      expect(doc().nodes).toHaveSize(1);
      expect(doc().nodes[0].id).toBe(id);
      expect(doc().nodes[0].type).toBe('angular');
      expect(store.selection().nodeIds).toEqual([id]);
      expect(store.dirty()).toBe(true);
    });

    it('パッチ適用でプロパティを更新する', () => {
      const id = store.addNodeAt({ key: 'api', label: 'API', color: '#059669' }, 0, 0);
      store.patchNode(id, { label: '変更後', color: '#000000' });
      const node = doc().nodes.find(n => n.id === id)!;
      expect(node.label).toBe('変更後');
      expect(node.color).toBe('#000000');
    });
  });

  describe('edges', () => {
    it('接続を追加できる（重複は無視）', () => {
      const a = store.addNodeAt({ key: 'api', label: 'A', color: '#000000' }, 0, 0);
      const b = store.addNodeAt({ key: 'api', label: 'B', color: '#000000' }, 0, 0);
      expect(store.addEdge(a, b)).not.toBeNull();
      expect(store.addEdge(a, b)).toBeNull();
      expect(store.addEdge(b, a)).toBeNull(); // 逆方向も重複扱い
      expect(store.addEdge(a, a)).toBeNull(); // 自己ループ不可
      expect(doc().edges).toHaveSize(1);
    });

    it('ノード削除で接続するエッジも削除される', () => {
      const a = store.addNodeAt({ key: 'api', label: 'A', color: '#000000' }, 0, 0);
      const b = store.addNodeAt({ key: 'api', label: 'B', color: '#000000' }, 0, 0);
      const c = store.addNodeAt({ key: 'api', label: 'C', color: '#000000' }, 0, 0);
      store.addEdge(a, b);
      store.addEdge(b, c);
      store.selectNode(b);
      store.deleteSelection();
      expect(doc().nodes).toHaveSize(2);
      expect(doc().edges).toHaveSize(0);
    });
  });

  describe('undo / redo', () => {
    it('操作 → undo → redo の一連の流れ', () => {
      const id = store.addNodeAt({ key: 'api', label: 'A', color: '#000000' }, 0, 0);
      expect(doc().nodes).toHaveSize(1);
      expect(store.canUndo()).toBe(true);

      store.undo();
      expect(doc().nodes).toHaveSize(0);
      expect(store.canRedo()).toBe(true);

      store.redo();
      expect(doc().nodes).toHaveSize(1);
      expect(doc().nodes[0].id).toBe(id);
    });

    it('ジェスチャ（ドラッグ）は履歴1エントリにまとまる', () => {
      store.addNodeAt({ key: 'api', label: 'A', color: '#000000' }, 0, 0);
      store.addNodeAt({ key: 'api', label: 'B', color: '#000000' }, 500, 500);

      store.beginGesture();
      store.moveNodes(new Map([['n-x', { x: 1, y: 1 }]]));
      store.moveNodes(new Map([['n-y', { x: 2, y: 2 }]]));
      store.endGesture(true);
      store.undo();
      // undo でジェスチャ前（ノード2個追加直後）に戻る
      expect(doc().nodes).toHaveSize(2);
      expect(store.canRedo()).toBe(true);
    });

    it('ジェスチャのキャンセルでドラッグ前の状態へ戻る', () => {
      const id = store.addNodeAt({ key: 'api', label: 'A', color: '#000000' }, 10, 10);
      store.beginGesture();
      store.liveMutate(d => {
        d.nodes[0].x = 999;
      });
      store.endGesture(false);
      expect(doc().nodes[0].x).toBe(10);
      expect(doc().nodes[0].id).toBe(id);
    });

    it('undo 後に参照が壊れた選択はクリーンアップされる', () => {
      const id = store.addNodeAt({ key: 'api', label: 'A', color: '#000000' }, 0, 0);
      expect(store.selection().nodeIds).toEqual([id]);
      store.undo();
      expect(store.selection().nodeIds).toEqual([]);
    });
  });

  describe('groups', () => {
    it('選択ノードをグループ化し、解除できる', () => {
      const a = store.addNodeAt({ key: 'api', label: 'A', color: '#000000' }, 0, 0);
      const b = store.addNodeAt({ key: 'api', label: 'B', color: '#000000' }, 0, 0);
      store.selectNode(a);
      store.selectNode(b, true);
      const groupId = store.groupSelection('クラスタ');
      expect(groupId).not.toBeNull();
      expect(doc().groups).toHaveSize(1);
      expect(doc().nodes.every(n => n.groupId === groupId)).toBe(true);

      store.selectGroup(groupId!);
      store.ungroupSelection();
      expect(doc().groups).toHaveSize(0);
      expect(doc().nodes.every(n => n.groupId === null)).toBe(true);
    });

    it('グループ削除では中のノードは残る', () => {
      const a = store.addNodeAt({ key: 'api', label: 'A', color: '#000000' }, 0, 0);
      const b = store.addNodeAt({ key: 'api', label: 'B', color: '#000000' }, 0, 0);
      store.selectNode(a);
      store.selectNode(b, true);
      const groupId = store.groupSelection()!;
      store.selectGroup(groupId);
      store.deleteSelection();
      expect(doc().groups).toHaveSize(0);
      expect(doc().nodes).toHaveSize(2);
      expect(doc().nodes.every(n => n.groupId === null)).toBe(true);
    });
  });

  describe('duplicateSelection', () => {
    it('ノードと選択エッジを複製する', () => {
      const a = store.addNodeAt({ key: 'api', label: 'A', color: '#000000' }, 0, 0);
      const b = store.addNodeAt({ key: 'api', label: 'B', color: '#000000' }, 0, 0);
      store.addEdge(a, b);
      store.selectNode(a);
      store.selectNode(b, true);
      store.selectEdge(doc().edges[0].id, true);
      store.duplicateSelection();
      expect(doc().nodes).toHaveSize(4);
      expect(doc().edges).toHaveSize(2);
      expect(store.selection().nodeIds).toHaveSize(2);
    });
  });

  it('load で履歴と選択がリセットされる', () => {
    store.addNodeAt({ key: 'api', label: 'A', color: '#000000' }, 0, 0);
    store.load(createEmptyDocument('別の図'), 'abc');
    expect(doc().name).toBe('別の図');
    expect(store.diagramId()).toBe('abc');
    expect(store.canUndo()).toBe(false);
    expect(store.canRedo()).toBe(false);
    expect(store.dirty()).toBe(false);
  });
});
