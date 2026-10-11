/**
 * 技術アイコンのレジストリとパレット定義。
 * アイコンは 24x24 viewBox の簡略化した SVG 断片（インライン埋め込み用）。
 * SVG 内の <text> にはエクスポート時もスタイルが残るよう font-family を明示する。
 */

export interface IconDef {
  viewBox: string;
  /** SVG 内部マークアップ（信頼できる静的文字列） */
  svg: string;
}

export interface PaletteItem {
  /** アイコンキー */
  key: string;
  label: string;
  color: string;
  width?: number;
  height?: number;
}

export interface PaletteCategory {
  id: string;
  label: string;
  items: PaletteItem[];
}

const FONT = 'Segoe UI,Arial,sans-serif';

export const ICONS: Record<string, IconDef> = {
  angular: {
    viewBox: '0 0 24 24',
    svg: `<path fill="#DD0031" d="M12 2.1 20.7 5.3 19.4 18.4 12 22.3 4.6 18.4 3.3 5.3Z"/><path fill="#fff" opacity=".14" d="M12 4.6 18.2 6.9 17.3 17.2 12 20 6.7 17.2 5.8 6.9Z"/><path fill="#fff" d="M12 7.3 15 14.7H13.4L12.6 12.7H11.4L10.6 14.7H9Z"/>`,
  },
  react: {
    viewBox: '0 0 24 24',
    svg: `<circle cx="12" cy="12" r="2.05" fill="#61DAFB"/><g fill="none" stroke="#61DAFB" stroke-width="1.05"><ellipse cx="12" cy="12" rx="10" ry="4.1"/><ellipse cx="12" cy="12" rx="10" ry="4.1" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4.1" transform="rotate(120 12 12)"/></g>`,
  },
  vue: {
    viewBox: '0 0 24 24',
    svg: `<path fill="#41B883" d="M1.5 3.5h4.1l4 6.9L12 6.3l2.4 4.1 4-6.9h4.1L12 21.7Z"/><path fill="#35495E" d="M9.6 10.4 12 6.3l2.4 4.1L12 15.4Z"/>`,
  },
  svelte: {
    viewBox: '0 0 24 24',
    svg: `<path fill="none" stroke="#FF3E00" stroke-width="2.6" stroke-linecap="round" d="M16.2 6.1c-1.9-2.2-5.3-2.5-7.5-.6-2.2 1.9-2.4 5.2-.5 7.4l3.2 3.6c1.4 1.6 1.3 4.1-.4 5.5"/><path fill="none" stroke="#FF3E00" stroke-width="2.2" stroke-linecap="round" d="M14.9 4.4c1.2-.9 3-.7 4 .5"/>`,
  },
  typescript: {
    viewBox: '0 0 24 24',
    svg: `<rect x="2" y="2" width="20" height="20" rx="2.5" fill="#3178C6"/><text x="12" y="16" text-anchor="middle" font-family="${FONT}" font-size="8" font-weight="700" fill="#fff">TS</text>`,
  },
  javascript: {
    viewBox: '0 0 24 24',
    svg: `<rect x="2" y="2" width="20" height="20" rx="2.5" fill="#F7DF1E"/><text x="12" y="16.2" text-anchor="middle" font-family="${FONT}" font-size="8.5" font-weight="700" fill="#1a1a1a">JS</text>`,
  },
  html5: {
    viewBox: '0 0 24 24',
    svg: `<path fill="#E34F26" d="M3.6 2.2h16.8l-1.5 17L12 21.8l-6.9-2.6Z"/><path fill="#F16529" d="M12 3.9v16l5.2-2 1.3-14Z"/><path fill="#fff" d="M7.6 6.7h8.8l-.3 2.6H10l.2 2.6h5.6l-.5 5.3-3.3.9-3.3-.9-.2-2.2h1.9l.1 1.1 1.5.4 1.5-.4.2-2.2H7.9Z"/>`,
  },
  css3: {
    viewBox: '0 0 24 24',
    svg: `<path fill="#1572B6" d="M3.6 2.2h16.8l-1.5 17L12 21.8l-6.9-2.6Z"/><path fill="#33A9DC" d="M12 3.9v16l5.2-2 1.3-14Z"/><path fill="#fff" d="M16 6.7H8.4l.3 2.6h7l-.4 2.6h-4.2l.2 2.6h3.7l-.4 3-2.6.7-2.6-.7-.1-1.4H6.9l.2 3 4.9 1.6 4.9-1.6.8-8.1Z"/>`,
  },
  aspnet: {
    viewBox: '0 0 24 24',
    svg: `<rect x="2" y="2" width="20" height="20" rx="4" fill="#512BD4"/><text x="12" y="15.2" text-anchor="middle" font-family="${FONT}" font-size="6.4" font-weight="700" fill="#fff">.NET</text>`,
  },
  nodejs: {
    viewBox: '0 0 24 24',
    svg: `<path fill="#5FA04E" d="M12 1.8 21 7v10l-9 5.2L3 17V7Z"/><path fill="none" stroke="#fff" stroke-width=".9" stroke-opacity=".6" d="M12 4.2 18.5 7.95v8.5L12 20.2 5.5 16.45v-8.5Z"/><path fill="#fff" opacity=".18" d="M12 1.8v20.4l9-5.2V7Z"/>`,
  },
  python: {
    viewBox: '0 0 24 24',
    svg: `<path fill="#3776AB" d="M12 2.3c-2.9 0-4.6 1.2-4.6 3v2.1h4.6v.7H5.3c-1.9 0-3.4 1.7-3.4 4.1s1.5 4.1 3.4 4.1h1.5v-2.6c0-1.9 1.6-3.5 3.5-3.5h4.1c1.6 0 2.9-1.3 2.9-2.9v-4c0-1.8-1.6-3-4.3-3Z"/><circle cx="9.9" cy="4.8" r="1" fill="#FFD43B"/><path fill="#FFD43B" d="M12 21.7c2.9 0 4.6-1.2 4.6-3v-2.1H12v-.7h6.7c1.9 0 3.4-1.7 3.4-4.1 0-1.6-.6-3-1.7-3.7v3.3c0 1.9-1.6 3.5-3.5 3.5h-4.1c-1.6 0-2.9 1.3-2.9 2.9v4c0 1.8 1.6 3 4.3 3Z"/><circle cx="14.1" cy="19.2" r="1" fill="#3776AB"/>`,
  },
  java: {
    viewBox: '0 0 24 24',
    svg: `<path fill="#5382A1" d="M9.2 12.4h5.6v6.8c0 1.2-1.2 2.1-2.8 2.1s-2.8-.9-2.8-2.1Z"/><path fill="#E76F00" d="M7.4 11.8c1.2-.6 2.9-.8 4.6-.8s3.4.2 4.6.8c0-1.5-1.6-2.6-4.6-2.6s-4.6 1.1-4.6 2.6Z"/><path fill="#E76F00" d="M15.6 5.4c.7-1.1.9-2.3.6-3.6 1.9 1.2 2.7 3.1 2.2 4.9-.4 1.4-1.5 2.4-2.9 2.7.5-1.2.6-2.6.1-4Z"/><path fill="#E76F00" opacity=".8" d="M13.5 7c-.1-1.2.3-2.4 1.2-3.4-.4 1.4-.2 2.7.6 3.7.7.9.9 2 .5 3.1-1.4-.4-2.2-1.7-2.3-3.4Z"/>`,
  },
  go: {
    viewBox: '0 0 24 24',
    svg: `<rect x="2" y="2" width="20" height="20" rx="4" fill="#00ADD8"/><text x="12" y="15.8" text-anchor="middle" font-family="${FONT}" font-size="8" font-weight="700" fill="#fff">GO</text>`,
  },
  sqlserver: {
    viewBox: '0 0 24 24',
    svg: `<path fill="#D83B01" d="M4.2 6.6c0-1.9 3.5-3.1 7.8-3.1s7.8 1.2 7.8 3.1v10.8c0 1.9-3.5 3.1-7.8 3.1s-7.8-1.2-7.8-3.1Z"/><ellipse cx="12" cy="6.6" rx="7.8" ry="3.1" fill="#F25C28"/><path fill="#fff" opacity=".85" d="M5.6 12.1c1.4 1 3.8 1.6 6.4 1.6s5-.6 6.4-1.6v1.7c0 .9-2.8 2-6.4 2s-6.4-1.1-6.4-2Z"/>`,
  },
  postgresql: {
    viewBox: '0 0 24 24',
    svg: `<path fill="#336791" d="M8.9 4.6C9.4 2.9 11.5 2 13.6 2.3c2.2.3 3.6 1.7 3.4 3.3-.1.9-.6 1.6-1.3 2 .3 1.3-.1 2.7-1.3 3.6-1.2.9-3 1.2-4.6.7l.4 7c0 1.5-1.1 2.7-2.6 2.8-1.5.1-2.8-1-3-2.5-.1-1.3.6-2.4 1.8-2.9L6 8.9c-.3-1.7.6-3.3 2.2-4Z"/><path fill="#336791" d="M15.9 8.1c1.9.4 3.4 1.9 3.6 3.9.2 1.7-.6 3.3-2 4.1l-.6-1.5c.8-.6 1.2-1.5 1.1-2.5-.1-1.2-1-2.2-2.2-2.5Z"/>`,
  },
  mysql: {
    viewBox: '0 0 24 24',
    svg: `<path fill="#00758F" d="M4.2 6.6c0-1.9 3.5-3.1 7.8-3.1s7.8 1.2 7.8 3.1v10.8c0 1.9-3.5 3.1-7.8 3.1s-7.8-1.2-7.8-3.1Z"/><ellipse cx="12" cy="6.6" rx="7.8" ry="3.1" fill="#00A1B0"/><text x="12" y="16.4" text-anchor="middle" font-family="${FONT}" font-size="6" font-weight="700" fill="#fff">My</text>`,
  },
  mongodb: {
    viewBox: '0 0 24 24',
    svg: `<path fill="#47A248" d="M12 2.2c3.1 3.4 4.7 6.7 4.7 10 0 4.2-2.2 7.4-4.7 9.9-2.5-2.5-4.7-5.7-4.7-9.9 0-3.3 1.6-6.6 4.7-10Z"/><path stroke="#2F6B2F" stroke-width="1" fill="none" d="M12 4.6V20"/>`,
  },
  redis: {
    viewBox: '0 0 24 24',
    svg: `<path fill="#DC382D" d="M2.8 8.3 12 4.6l9.2 3.7L12 12Z"/><path fill="#B02A20" d="M2.8 8.3v2.6L12 14.6l9.2-3.7V8.3L12 12Z"/><path fill="#8E2119" d="M2.8 10.9v2.6L12 17.2l9.2-3.7v-2.6L12 14.6Z"/>`,
  },
  cosmosdb: {
    viewBox: '0 0 24 24',
    svg: `<circle cx="12" cy="12" r="7.2" fill="#0078D4"/><ellipse cx="12" cy="12" rx="10" ry="3.6" fill="none" stroke="#50B5F8" stroke-width="1.1" transform="rotate(-24 12 12)"/><circle cx="12" cy="12" r="2" fill="#fff" opacity=".85"/>`,
  },
  functions: {
    viewBox: '0 0 24 24',
    svg: `<rect x="2" y="2" width="20" height="20" rx="4.5" fill="#0078D4"/><path fill="#fff" d="M13.8 4.8 7.9 13.2h3.4l-1.3 6 5.9-8.4h-3.4Z"/>`,
  },
  appservice: {
    viewBox: '0 0 24 24',
    svg: `<rect x="2" y="2" width="20" height="20" rx="4.5" fill="#0078D4"/><circle cx="12" cy="12" r="5.6" fill="none" stroke="#fff" stroke-width="1.2"/><path stroke="#fff" stroke-width="1.2" fill="none" d="M6.4 12h11.2M12 6.4c-3.2 3.2-3.2 8 0 11.2M12 6.4c3.2 3.2 3.2 8 0 11.2"/>`,
  },
  storage: {
    viewBox: '0 0 24 24',
    svg: `<rect x="2" y="2" width="20" height="20" rx="4.5" fill="#0078D4"/><rect x="6" y="6" width="5.4" height="5.4" rx="1" fill="#fff"/><rect x="12.6" y="6" width="5.4" height="5.4" rx="1" fill="#fff" opacity=".8"/><rect x="6" y="12.6" width="5.4" height="5.4" rx="1" fill="#fff" opacity=".8"/><rect x="12.6" y="12.6" width="5.4" height="5.4" rx="1" fill="#fff" opacity=".6"/>`,
  },
  servicebus: {
    viewBox: '0 0 24 24',
    svg: `<rect x="2" y="2" width="20" height="20" rx="4.5" fill="#0078D4"/><rect x="5.5" y="9.5" width="10" height="5" rx="1.2" fill="none" stroke="#fff" stroke-width="1.2"/><path stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round" d="M16 12h2.6m0 0-1.7-1.7M18.6 12l-1.7 1.7"/>`,
  },
  keyvault: {
    viewBox: '0 0 24 24',
    svg: `<rect x="2" y="2" width="20" height="20" rx="4.5" fill="#0078D4"/><circle cx="10" cy="10" r="3" fill="none" stroke="#fff" stroke-width="1.3"/><path stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round" d="M12.2 12.2 17 17M15 14.9l-1.1 1.1M16.3 16.2l-1.1 1.1"/>`,
  },
  aks: {
    viewBox: '0 0 24 24',
    svg: `<rect x="2" y="2" width="20" height="20" rx="4.5" fill="#0078D4"/><circle cx="12" cy="12" r="4.4" fill="none" stroke="#fff" stroke-width="1.1"/><path stroke="#fff" stroke-width="1.1" fill="none" d="M12 5.4v2.2M12 16.4v2.2M5.4 12h2.2M16.4 12h2.2M7.3 7.3l1.6 1.6M15.1 15.1l1.6 1.6M16.7 7.3l-1.6 1.6M8.9 15.1l-1.6 1.6"/>`,
  },
  lambda: {
    viewBox: '0 0 24 24',
    svg: `<rect x="2" y="2" width="20" height="20" rx="4.5" fill="#FF9900"/><text x="12" y="17" text-anchor="middle" font-family="Georgia,serif" font-size="11.5" font-weight="700" font-style="italic" fill="#fff">λ</text>`,
  },
  ec2: {
    viewBox: '0 0 24 24',
    svg: `<rect x="2" y="2" width="20" height="20" rx="4.5" fill="#FF9900"/><rect x="6.5" y="6" width="11" height="4.6" rx="1" fill="#fff"/><rect x="6.5" y="13.4" width="11" height="4.6" rx="1" fill="#fff" opacity=".75"/><circle cx="8.6" cy="8.3" r=".8" fill="#FF9900"/><circle cx="8.6" cy="15.7" r=".8" fill="#FF9900"/>`,
  },
  s3: {
    viewBox: '0 0 24 24',
    svg: `<rect x="2" y="2" width="20" height="20" rx="4.5" fill="#FF9900"/><path fill="#fff" d="M6.6 8h10.8l-1.4 9.2-4 .9-4-.9Z"/><ellipse cx="12" cy="8" rx="5.4" ry="1.9" fill="#fff"/>`,
  },
  rds: {
    viewBox: '0 0 24 24',
    svg: `<rect x="2" y="2" width="20" height="20" rx="4.5" fill="#3B48CC"/><ellipse cx="12" cy="7" rx="6.2" ry="2.4" fill="#C7D2FE"/><path fill="#C7D2FE" d="M5.8 7v10c0 1.3 2.8 2.4 6.2 2.4s6.2-1.1 6.2-2.4V7c0 1.3-2.8 2.4-6.2 2.4S5.8 8.3 5.8 7Z"/>`,
  },
  dynamodb: {
    viewBox: '0 0 24 24',
    svg: `<rect x="2" y="2" width="20" height="20" rx="4.5" fill="#4053D6"/><path fill="#fff" d="M6 7.4c0-1.2 2.7-2.2 6-2.2s6 1 6 2.2v1.8c0 1.2-2.7 2.2-6 2.2s-6-1-6-2.2Z"/><path fill="#fff" opacity=".85" d="M6 11.5c0 1.2 2.7 2.2 6 2.2s6-1 6-2.2v1.8c0 1.2-2.7 2.2-6 2.2s-6-1-6-2.2Z"/><path fill="#fff" opacity=".7" d="M6 15.6c0 1.2 2.7 2.2 6 2.2s6-1 6-2.2v1.8c0 1.2-2.7 2.2-6 2.2s-6-1-6-2.2Z"/>`,
  },
  docker: {
    viewBox: '0 0 24 24',
    svg: `<g fill="#1D63ED"><path d="M4.6 10.6h2.9v2.9H4.6Zm3.9 0h2.9v2.9H8.5Zm3.9 0h2.9v2.9h-2.9ZM8.5 6.7h2.9v2.9H8.5Zm3.9 0h2.9v2.9h-2.9Zm0-3.8h2.9v2.9h-2.9Z"/><path d="M2.9 15.1c.9 3.9 4.4 6.4 9.1 6.4 5 0 8.4-2.9 9.1-7.3.5.2 1.1.2 1.6 0-.2.7-.6 1.4-1.2 1.9-1.5 3.7-5 6.2-9.5 6.2-5.5 0-9.7-3.5-10.4-8.3.4.5.8.9 1.3 1.1Z"/></g>`,
  },
  kubernetes: {
    viewBox: '0 0 24 24',
    svg: `<path fill="#326CE5" d="M12 2.2 20.4 6.5v8.9L12 21.8 3.6 17.4V6.5Z"/><g stroke="#fff" stroke-width="1.1" fill="none"><circle cx="12" cy="12" r="3.4"/><path d="M12 5v3.6M12 15.4V19M6.2 8.7l3.1 1.8M14.7 13.5l3.1 1.8M17.8 8.7l-3.1 1.8M9.3 13.5l-3.1 1.8"/></g>`,
  },
  nginx: {
    viewBox: '0 0 24 24',
    svg: `<rect x="2" y="2" width="20" height="20" rx="4.5" fill="#009639"/><text x="12" y="16.2" text-anchor="middle" font-family="${FONT}" font-size="9.5" font-weight="700" fill="#fff">N</text>`,
  },
  iis: {
    viewBox: '0 0 24 24',
    svg: `<rect x="2" y="2" width="20" height="20" rx="4.5" fill="#0085C3"/><text x="12" y="15.6" text-anchor="middle" font-family="${FONT}" font-size="7" font-weight="700" fill="#fff">IIS</text>`,
  },
  linux: {
    viewBox: '0 0 24 24',
    svg: `<rect x="2" y="2" width="20" height="20" rx="4.5" fill="#111827"/><path stroke="#7EE787" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round" d="M6.8 8.3 10.2 11.8 6.8 15.3"/><path stroke="#7EE787" stroke-width="1.8" stroke-linecap="round" d="M12.2 15.8h5"/>`,
  },
  windows: {
    viewBox: '0 0 24 24',
    svg: `<path fill="#0078D4" d="M3.5 4.7 10.8 3.7v7.8H3.5ZM11.7 3.6 20.5 2.4v9.1h-8.8ZM3.5 12.4h7.3v7.8L3.5 19.2ZM11.7 12.4h8.8v9.1l-8.8-1.2Z"/>`,
  },
  browser: {
    viewBox: '0 0 24 24',
    svg: `<circle cx="12" cy="12" r="8.6" fill="#3B82F6"/><path stroke="#DBEAFE" stroke-width="1.2" fill="none" d="M3.4 12h17.2M12 3.4c-5.4 5.4-5.4 11.8 0 17.2M12 3.4c5.4 5.4 5.4 11.8 0 17.2"/>`,
  },
  mobile: {
    viewBox: '0 0 24 24',
    svg: `<rect x="7.5" y="2.5" width="9" height="19" rx="2.5" fill="#0F172A"/><rect x="9" y="4.5" width="6" height="13.5" rx="1" fill="#38BDF8"/><circle cx="12" cy="19.8" r=".9" fill="#38BDF8"/>`,
  },
  user: {
    viewBox: '0 0 24 24',
    svg: `<circle cx="12" cy="8" r="4" fill="#0891B2"/><path d="M4.5 20.5c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5Z" fill="#0891B2"/>`,
  },
  database: {
    viewBox: '0 0 24 24',
    svg: `<path fill="#64748B" d="M4.2 6.6c0-1.9 3.5-3.1 7.8-3.1s7.8 1.2 7.8 3.1v10.8c0 1.9-3.5 3.1-7.8 3.1s-7.8-1.2-7.8-3.1Z"/><ellipse cx="12" cy="6.6" rx="7.8" ry="3.1" fill="#94A3B8"/>`,
  },
  cache: {
    viewBox: '0 0 24 24',
    svg: `<rect x="5" y="9" width="14" height="7" rx="1.5" fill="#7C3AED"/><path stroke="#C4B5FD" stroke-width="1.4" d="M8 9V6.5M12 9V6.5M16 9V6.5M8 18.5V16M12 18.5V16M16 18.5V16"/>`,
  },
  queue: {
    viewBox: '0 0 24 24',
    svg: `<rect x="4" y="5" width="16" height="4.2" rx="1.2" fill="#0EA5E9"/><rect x="4" y="10" width="16" height="4.2" rx="1.2" fill="#0EA5E9" opacity=".8"/><rect x="4" y="15" width="16" height="4.2" rx="1.2" fill="#0EA5E9" opacity=".6"/>`,
  },
  api: {
    viewBox: '0 0 24 24',
    svg: `<path fill="#059669" d="M12 2.6 20.6 7.4v9.2L12 21.4 3.4 16.6V7.4Z"/><text x="12" y="14.9" text-anchor="middle" font-family="${FONT}" font-size="6" font-weight="700" fill="#fff">API</text>`,
  },
  gateway: {
    viewBox: '0 0 24 24',
    svg: `<rect x="2" y="2" width="20" height="20" rx="4.5" fill="#475569"/><path stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round" d="M6.8 12h6.6m0 0-2-2m2 2-2 2"/><path stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round" d="M16.2 8.4c1.5 1 2.2 2 2.2 3.6s-.7 2.6-2.2 3.6"/>`,
  },
  email: {
    viewBox: '0 0 24 24',
    svg: `<rect x="2.5" y="5.5" width="19" height="13" rx="2" fill="#0284C7"/><path stroke="#fff" stroke-width="1.4" fill="none" d="m4 7 8 6 8-6"/>`,
  },
  scheduler: {
    viewBox: '0 0 24 24',
    svg: `<circle cx="12" cy="12" r="8.6" fill="#F59E0B"/><path stroke="#fff" stroke-width="1.6" stroke-linecap="round" fill="none" d="M12 7.4V12l3.1 2.1"/>`,
  },
  log: {
    viewBox: '0 0 24 24',
    svg: `<path fill="#64748B" d="M6 2.5h8l4 4v15H6Z"/><path fill="#94A3B8" d="M14 2.5l4 4h-4Z"/><path stroke="#fff" stroke-width="1.3" d="M8.5 11h7M8.5 14h7M8.5 17h4.5"/>`,
  },
  firewall: {
    viewBox: '0 0 24 24',
    svg: `<rect x="3" y="5" width="18" height="14" rx="1.5" fill="#EF4444"/><path stroke="#fff" stroke-width="1.1" d="M3 9.7h18M3 14.3h18M9 5v4.7M15 5v4.7M6 9.7v4.6M12 9.7v4.6M18 9.7v4.6M9 14.3V19M15 14.3V19"/>`,
  },
  loadbalancer: {
    viewBox: '0 0 24 24',
    svg: `<circle cx="12" cy="7" r="3" fill="#8B5CF6"/><circle cx="6" cy="17" r="2.6" fill="#8B5CF6"/><circle cx="12" cy="17" r="2.6" fill="#8B5CF6"/><circle cx="18" cy="17" r="2.6" fill="#8B5CF6"/><path stroke="#C4B5FD" stroke-width="1.3" fill="none" d="M10.5 9.5 7 14.6M12 10v4.4M13.5 9.5 17 14.6"/>`,
  },
  cdn: {
    viewBox: '0 0 24 24',
    svg: `<circle cx="12" cy="12" r="7.5" fill="none" stroke="#06B6D4" stroke-width="2"/><path stroke="#06B6D4" stroke-width="1.3" fill="none" d="M12 4.5c-3.5 3.5-3.5 11.5 0 15M12 4.5c3.5 3.5 3.5 11.5 0 15M4.6 12h14.8"/><circle cx="12" cy="12" r="2" fill="#06B6D4"/>`,
  },
  vm: {
    viewBox: '0 0 24 24',
    svg: `<rect x="3" y="4.5" width="18" height="12" rx="2" fill="#334155"/><rect x="5" y="6.5" width="14" height="8" rx="1" fill="#7DD3FC"/><path fill="#334155" d="M10 16.5h4l.8 3H9.2Z"/>`,
  },
  custom: {
    viewBox: '0 0 24 24',
    svg: `<rect x="2" y="2" width="20" height="20" rx="4.5" fill="#64748B"/><path fill="none" stroke="#fff" stroke-width="1.6" stroke-linejoin="round" d="M12 5.5 18 9v6l-6 3.5L6 15V9Z"/><path stroke="#fff" stroke-width="1.6" fill="none" d="M6 9l6 3.5L18 9M12 12.5V18.5"/>`,
  },
};

export const PALETTE: PaletteCategory[] = [
  {
    id: 'frontend',
    label: 'フロントエンド',
    items: [
      { key: 'angular', label: 'Angular', color: '#DD0031' },
      { key: 'react', label: 'React', color: '#61DAFB' },
      { key: 'vue', label: 'Vue.js', color: '#41B883' },
      { key: 'svelte', label: 'Svelte', color: '#FF3E00' },
      { key: 'typescript', label: 'TypeScript', color: '#3178C6' },
      { key: 'javascript', label: 'JavaScript', color: '#E5C500' },
      { key: 'html5', label: 'HTML5', color: '#E34F26' },
      { key: 'css3', label: 'CSS3', color: '#1572B6' },
      { key: 'browser', label: 'ブラウザ', color: '#3B82F6' },
      { key: 'mobile', label: 'モバイルアプリ', color: '#0F172A' },
      { key: 'user', label: 'ユーザー', color: '#0891B2' },
    ],
  },
  {
    id: 'backend',
    label: 'バックエンド',
    items: [
      { key: 'aspnet', label: 'ASP.NET Core', color: '#512BD4' },
      { key: 'nodejs', label: 'Node.js', color: '#5FA04E' },
      { key: 'python', label: 'Python', color: '#3776AB' },
      { key: 'java', label: 'Java', color: '#5382A1' },
      { key: 'go', label: 'Go', color: '#00ADD8' },
      { key: 'nginx', label: 'Nginx', color: '#009639' },
      { key: 'iis', label: 'IIS', color: '#0085C3' },
      { key: 'api', label: 'Web API', color: '#059669' },
      { key: 'gateway', label: 'API ゲートウェイ', color: '#475569' },
      { key: 'linux', label: 'Linux サーバー', color: '#111827' },
    ],
  },
  {
    id: 'data',
    label: 'データストア',
    items: [
      { key: 'sqlserver', label: 'SQL Server', color: '#D83B01' },
      { key: 'postgresql', label: 'PostgreSQL', color: '#336791' },
      { key: 'mysql', label: 'MySQL', color: '#00758F' },
      { key: 'mongodb', label: 'MongoDB', color: '#47A248' },
      { key: 'redis', label: 'Redis', color: '#DC382D' },
      { key: 'cosmosdb', label: 'Cosmos DB', color: '#0078D4' },
      { key: 'dynamodb', label: 'DynamoDB', color: '#4053D6' },
      { key: 'database', label: 'データベース', color: '#64748B' },
      { key: 'cache', label: 'キャッシュ', color: '#7C3AED' },
    ],
  },
  {
    id: 'azure',
    label: 'Azure',
    items: [
      { key: 'appservice', label: 'App Service', color: '#0078D4' },
      { key: 'functions', label: 'Azure Functions', color: '#0078D4' },
      { key: 'storage', label: 'Blob Storage', color: '#0078D4' },
      { key: 'servicebus', label: 'Service Bus', color: '#0078D4' },
      { key: 'keyvault', label: 'Key Vault', color: '#0078D4' },
      { key: 'aks', label: 'AKS', color: '#0078D4' },
    ],
  },
  {
    id: 'aws',
    label: 'AWS',
    items: [
      { key: 'lambda', label: 'Lambda', color: '#FF9900' },
      { key: 'ec2', label: 'EC2', color: '#FF9900' },
      { key: 's3', label: 'S3', color: '#FF9900' },
      { key: 'rds', label: 'RDS', color: '#3B48CC' },
    ],
  },
  {
    id: 'infra',
    label: 'インフラ',
    items: [
      { key: 'docker', label: 'Docker', color: '#1D63ED' },
      { key: 'kubernetes', label: 'Kubernetes', color: '#326CE5' },
      { key: 'windows', label: 'Windows', color: '#0078D4' },
      { key: 'cdn', label: 'CDN', color: '#06B6D4' },
      { key: 'loadbalancer', label: 'ロードバランサー', color: '#8B5CF6' },
      { key: 'firewall', label: 'ファイアウォール', color: '#EF4444' },
      { key: 'vm', label: 'VM', color: '#334155' },
      { key: 'queue', label: 'キュー', color: '#0EA5E9' },
      { key: 'log', label: 'ログ', color: '#64748B' },
      { key: 'email', label: 'メール', color: '#0284C7' },
      { key: 'scheduler', label: 'スケジューラー', color: '#F59E0B' },
    ],
  },
];

const FALLBACK_ICON = ICONS['custom'];

export function iconFor(key: string): IconDef {
  return ICONS[key] ?? FALLBACK_ICON;
}

export function paletteItem(key: string): PaletteItem | null {
  for (const category of PALETTE) {
    const item = category.items.find(i => i.key === key);
    if (item) return item;
  }
  return null;
}

/** アイコンの表示ラベル（パレット項目名、なければキーそのまま）。 */
export function typeLabel(key: string): string {
  return paletteItem(key)?.label ?? (key === 'custom' ? 'カスタム' : key);
}
