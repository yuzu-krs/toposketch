import { TestBed } from '@angular/core/testing';
import { ExportService } from './export.service';
import { ThemeService } from './theme.service';

describe('ExportService.buildExportSvg', () => {
  let service: ExportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExportService);
  });

  function makeCanvasSvg(): SVGSVGElement {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('data-diagram-name', 'テスト図');
    const content = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    content.setAttribute('id', 'as-content');
    content.setAttribute('transform', 'translate(10, 20) scale(0.5)');
    const entities = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    entities.setAttribute('id', 'as-entities');
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', '0');
    rect.setAttribute('y', '0');
    rect.setAttribute('width', '100');
    rect.setAttribute('height', '50');
    entities.appendChild(rect);
    const excluded = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    excluded.setAttribute('data-export-exclude', '');
    excluded.setAttribute('width', '999');
    content.appendChild(entities);
    content.appendChild(excluded);
    svg.appendChild(content);
    return svg;
  }

  it('UI専用要素を除去し、width/height/viewBox と背景を設定する', () => {
    const result = service.buildExportSvg(makeCanvasSvg());
    const element = result.element;

    expect(element.querySelector('[data-export-exclude]')).toBeNull();
    expect(element.getAttribute('xmlns')).toBe('http://www.w3.org/2000/svg');
    expect(Number(element.getAttribute('width'))).toBeGreaterThan(100); // 100 + 余白
    expect(Number(element.getAttribute('height'))).toBeGreaterThan(50);
    expect(element.getAttribute('viewBox')).toBe(`0 0 ${element.getAttribute('width')} ${element.getAttribute('height')}`);
    expect(element.getAttribute('font-family')).toContain('sans-serif');

    const background = element.querySelector('rect');
    expect(background?.getAttribute('fill')).toBe(TestBed.inject(ThemeService).canvasPalette().background);

    // 変換はコンテンツ全体を可視化する位置へリセットされる
    const content = element.querySelector('#as-content') as SVGGElement;
    expect(content.getAttribute('transform')).toMatch(/translate\(/);
  });

  it('テーマに応じた背景色を使う', () => {
    const theme = TestBed.inject(ThemeService);
    theme.set('dark');
    const result = service.buildExportSvg(makeCanvasSvg());
    const background = result.element.querySelector('rect');
    expect(background?.getAttribute('fill')).toBe('#0f172a');
    theme.set('light');
  });
});
