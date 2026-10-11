import { defaultConnection } from './diagram.models';
import { connectionMetaText, resolveConnectionStyle } from './connection-style';

describe('connection-style', () => {
  describe('resolveConnectionStyle', () => {
    it('種別ごとのプリセットを適用する', () => {
      const fiber = resolveConnectionStyle({ ...defaultConnection(), type: 'fiber' }, '#111111');
      expect(fiber.stroke).toBe('#f59e0b');
      expect(fiber.dash).toBeNull();

      const wifi = resolveConnectionStyle({ ...defaultConnection(), type: 'wifi' }, '#111111');
      expect(wifi.stroke).toBe('#0ea5e9');
      expect(wifi.dash).toBe('2.5 3.5');

      const vpn = resolveConnectionStyle({ ...defaultConnection(), type: 'vpn' }, '#111111');
      expect(vpn.stroke).toBe('#8b5cf6');
      expect(vpn.dash).toBe('8 4');
    });

    it('ethernet はテーマ既定色を使う', () => {
      const style = resolveConnectionStyle(defaultConnection(), '#475569');
      expect(style.stroke).toBe('#475569');
      expect(style.dash).toBeNull();
    });

    it('カスタム色と太さがプリセットより優先される', () => {
      const style = resolveConnectionStyle(
        { ...defaultConnection(), type: 'wifi', color: '#123456', width: 4 },
        '#111111',
      );
      expect(style.stroke).toBe('#123456');
      expect(style.strokeWidth).toBe(4);
    });

    it('旧データの style:dashed は ethernet のみ破線にする', () => {
      const legacy = resolveConnectionStyle(defaultConnection(), '#111111', { legacyDashed: true });
      expect(legacy.dash).toBe('7 5');

      const legacyFiber = resolveConnectionStyle(
        { ...defaultConnection(), type: 'fiber' }, '#111111', { legacyDashed: true },
      );
      expect(legacyFiber.dash).toBeNull();
    });
  });

  describe('connectionMetaText', () => {
    it('ポート・速度・VLAN・モードを結合する', () => {
      const text = connectionMetaText({
        ...defaultConnection(),
        sourcePort: 'Gi0/1', targetPort: 'ge1', speed: '1Gbps', vlanId: '10', mode: 'trunk',
      });
      expect(text).toBe('Gi0/1 → ge1 · 1Gbps · VLAN 10 · Trunk');
    });

    it('一部だけ設定されている場合は設定分だけ表示する', () => {
      expect(connectionMetaText({ ...defaultConnection(), speed: '10Gbps' })).toBe('10Gbps');
      expect(connectionMetaText({ ...defaultConnection(), vlanId: '20', mode: 'access' })).toBe('VLAN 20 · Access');
      expect(connectionMetaText(defaultConnection())).toBe('');
      expect(connectionMetaText({ ...defaultConnection(), sourcePort: 'ge2' })).toBe('ge2');
    });
  });
});
