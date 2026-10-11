import { EdgeConnection, EdgeConnectionType } from './diagram.models';

/** 接続種別ごとの描画スタイル（色・破線・基準線幅）。色が空文字ならテーマ既定色。 */
interface ConnectionPreset {
  color: string;
  dash: string | null;
  width: number;
}

const PRESETS: Record<EdgeConnectionType, ConnectionPreset> = {
  ethernet: { color: '', dash: null, width: 2 },
  fiber: { color: '#f59e0b', dash: null, width: 2.6 },
  wifi: { color: '#0ea5e9', dash: '2.5 3.5', width: 2 },
  vpn: { color: '#8b5cf6', dash: '8 4', width: 2 },
  logical: { color: '#94a3b8', dash: '3 4', width: 1.8 },
};

export const CONNECTION_TYPE_LABELS: Record<EdgeConnectionType, string> = {
  ethernet: 'イーサネット',
  fiber: '光ファイバー',
  wifi: 'Wi-Fi',
  vpn: 'VPN',
  logical: '論理接続',
};

export interface ResolvedConnectionStyle {
  stroke: string;
  strokeWidth: number;
  dash: string | null;
}

/**
 * 接続の描画スタイルを解決する。優先順位:
 * カスタム色/幅 > 種別プリセット > テーマ既定色。
 * 旧データの style:'dashed' は ethernet のみ反映する。
 */
export function resolveConnectionStyle(
  connection: EdgeConnection,
  themeEdgeColor: string,
  options: { legacyDashed?: boolean } = {},
): ResolvedConnectionStyle {
  const preset = PRESETS[connection.type] ?? PRESETS.ethernet;
  const dash =
    options.legacyDashed && connection.type === 'ethernet' ? '7 5' : preset.dash;
  return {
    stroke: connection.color || preset.color || themeEdgeColor,
    strokeWidth: connection.width > 0 ? connection.width : preset.width,
    dash,
  };
}

/** 接続の詳細情報から、エッジ中点に表示する補足テキストを組み立てる。 */
export function connectionMetaText(connection: EdgeConnection): string {
  const parts: string[] = [];
  if (connection.sourcePort && connection.targetPort) {
    parts.push(`${connection.sourcePort} → ${connection.targetPort}`);
  } else if (connection.sourcePort || connection.targetPort) {
    parts.push(connection.sourcePort || connection.targetPort);
  }
  if (connection.speed) parts.push(connection.speed);
  if (connection.vlanId) parts.push(`VLAN ${connection.vlanId}`);
  if (connection.mode) parts.push(connection.mode === 'trunk' ? 'Trunk' : 'Access');
  return parts.join(' · ');
}
