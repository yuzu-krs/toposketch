import { ICONS, PALETTE, iconFor, paletteItem, typeLabel } from './icon-registry';

describe('icon-registry', () => {
  it('パレット内の全アイコンキーがICONSに登録されている', () => {
    for (const category of PALETTE) {
      for (const item of category.items) {
        expect(ICONS[item.key]).withContext(`key: ${item.key}`).toBeDefined();
      }
    }
  });

  it('すべてのアイコンが viewBox と svg 断片を持つ', () => {
    for (const [key, icon] of Object.entries(ICONS)) {
      expect(icon.viewBox).withContext(`viewBox of ${key}`).toMatch(/^0 0 \d+ \d+$/);
      expect(icon.svg).withContext(`svg of ${key}`).toContain('<');
    }
  });

  it('未知のキーはフォールバックアイコンを返す', () => {
    expect(iconFor('does-not-exist')).toBe(ICONS['custom']);
  });

  it('paletteItem と typeLabel が機能する', () => {
    expect(paletteItem('angular')?.label).toBe('Angular');
    expect(paletteItem('nope')).toBeNull();
    expect(typeLabel('custom')).toBe('カスタム');
    expect(typeLabel('unknown-key')).toBe('unknown-key');
  });

  it('カテゴリとアイテムのキーに重複がない', () => {
    const keys = PALETTE.flatMap(c => c.items.map(i => i.key));
    expect(new Set(keys).size).toBe(keys.length);
    const ids = PALETTE.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
