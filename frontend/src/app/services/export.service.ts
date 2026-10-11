import { Injectable } from '@angular/core';
import { DiagramDocument } from '../models/diagram.models';
import { ThemeService } from './theme.service';

const FONT_STACK = 'Segoe UI, Hiragino Kaku Gothic ProN, Yu Gothic UI, Meiryo, sans-serif';

/** JSON / SVG / PNG エクスポート。SVG は属性ベースで描画しているため、
 *  クローンから UI 専用要素（[data-export-exclude]）を除去するだけで
 *  スタンドアロンな SVG として成立する。 */
@Injectable({ providedIn: 'root' })
export class ExportService {
  constructor(private readonly theme: ThemeService) {}

  exportJson(doc: DiagramDocument): void {
    const json = JSON.stringify(doc, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    this.download(blob, `${slug(doc.name)}.archsketch.json`);
  }

  exportSvg(svgElement: SVGSVGElement): void {
    const clone = this.buildExportSvg(svgElement);
    const xml = new XMLSerializer().serializeToString(clone.element);
    const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
    this.download(blob, `${slug(clone.name)}.svg`);
  }

  async exportPng(svgElement: SVGSVGElement, scale = 2): Promise<void> {
    const clone = this.buildExportSvg(svgElement);
    const xml = new XMLSerializer().serializeToString(clone.element);
    const blobUrl = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml;charset=utf-8' }));
    try {
      const image = await this.loadImage(blobUrl);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(clone.width * scale);
      canvas.height = Math.round(clone.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D コンテキストを取得できませんでした。');
      ctx.fillStyle = clone.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      const pngBlob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!pngBlob) throw new Error('PNG への変換に失敗しました。');
      this.download(pngBlob, `${slug(clone.name)}.png`);
    } finally {
      URL.revokeObjectURL(blobUrl);
    }
  }

  /** エクスポート用に SVG を組み立てる（テストでも利用）。 */
  buildExportSvg(svgElement: SVGSVGElement): { element: SVGSVGElement; width: number; height: number; name: string; background: string } {
    const background = this.theme.canvasPalette().background;
    const content = svgElement.querySelector('#as-entities');
    const name = svgElement.getAttribute('data-diagram-name') ?? 'diagram';

    let width = 960;
    let height = 600;
    let tx = 0;
    let ty = 0;
    if (content) {
      const bbox = (content as SVGGElement).getBBox();
      if (Number.isFinite(bbox.width) && bbox.width > 0 && Number.isFinite(bbox.height) && bbox.height > 0) {
        const pad = 32;
        width = Math.ceil(bbox.width + pad * 2);
        height = Math.ceil(bbox.height + pad * 2);
        tx = pad - bbox.x;
        ty = pad - bbox.y;
      }
    }

    const clone = svgElement.cloneNode(true) as SVGSVGElement;
    clone.querySelectorAll('[data-export-exclude]').forEach(el => el.remove());

    const main = clone.querySelector('#as-content') as SVGGElement | null;
    if (main) {
      main.setAttribute('transform', `translate(${tx}, ${ty})`);
    }

    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', String(width));
    clone.setAttribute('height', String(height));
    clone.setAttribute('viewBox', `0 0 ${width} ${height}`);
    clone.setAttribute('font-family', FONT_STACK);
    clone.removeAttribute('class');
    clone.removeAttribute('style');

    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('x', '0');
    bgRect.setAttribute('y', '0');
    bgRect.setAttribute('width', String(width));
    bgRect.setAttribute('height', String(height));
    bgRect.setAttribute('fill', background);
    clone.insertBefore(bgRect, clone.firstChild);

    return { element: clone, width, height, name, background };
  }

  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('SVG の画像化に失敗しました。'));
      image.src = url;
    });
  }

  private download(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

function slug(name: string): string {
  const cleaned = name.trim().replace(/[<>:"/\\|?*\s]+/g, '-').replace(/-+/g, '-');
  return cleaned || 'diagram';
}
