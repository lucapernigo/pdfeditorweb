import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { ExtractedTextItem, PageMetadata } from '../types/pdf.ts';
import { parsePdfFontName } from './fontMatcher.ts';
import { groupAdjacentTextItems } from './textBlockGrouper.ts';

// Configure the worker locally via Vite asset bundling
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

export interface LoadedPdfDoc {
  doc: pdfjsLib.PDFDocumentProxy;
  numPages: number;
}

/**
 * Loads a PDF document from raw Uint8Array bytes
 */
export async function loadPdfFromBytes(bytes: Uint8Array): Promise<LoadedPdfDoc> {
  // Make a clone copy because PDF.js might transfer or neuter the buffer
  const copy = new Uint8Array(bytes);
  const loadingTask = pdfjsLib.getDocument({
    data: copy,
    cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
    cMapPacked: true,
  });

  const doc = await loadingTask.promise;
  return {
    doc,
    numPages: doc.numPages,
  };
}

/**
 * Extracts page dimensions and metadata
 */
export async function getPageMetadata(
  doc: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  scale: number = 1.0
): Promise<PageMetadata> {
  const page = await doc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const baseViewport = page.getViewport({ scale: 1.0 });

  return {
    pageNumber,
    originalWidth: baseViewport.width,
    originalHeight: baseViewport.height,
    viewWidth: viewport.width,
    viewHeight: viewport.height,
    scale,
    rotation: viewport.rotation,
  };
}

/**
 * Extracts all text items with coordinates and typography metadata for a specific page
 */
export async function extractPageTextItems(
  doc: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  scale: number = 1.0
): Promise<ExtractedTextItem[]> {
  const page = await doc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const textContent = await page.getTextContent();

  const items: ExtractedTextItem[] = [];
  const styles = textContent.styles || {};

  for (let i = 0; i < textContent.items.length; i++) {
    const rawItem = textContent.items[i] as any;
    if (!rawItem.str || rawItem.str.trim().length === 0) continue;

    const tx = rawItem.transform; // [sx, sky, skx, sy, tx, ty]
    if (!tx || tx.length < 6) continue;

    // Convert PDF transform matrix to viewport screen coordinates
    // Using viewport conversion:
    // Screen X = tx[4] * scale, Screen Y = viewport.height - (tx[5] * scale)
    const [p0, p1, p2, p3, xPdf, yPdf] = tx;

    // Font size in points/px
    const fontHeight = Math.hypot(p2, p3) * scale;
    const itemWidth = (rawItem.width || 0) * scale;
    const itemHeight = Math.max(fontHeight, (rawItem.height || 0) * scale);

    // Coordinate inversion: in PDF (xPdf, yPdf) is baseline at bottom
    // Convert to top-left screen coordinates
    const screenX = xPdf * scale;
    const screenY = viewport.height - (yPdf * scale) - (itemHeight * 0.85);

    const fontStyleObj = styles[rawItem.fontName] || {};
    const fontName = fontStyleObj.fontFamily || rawItem.fontName || 'Helvetica';
    const parsed = parsePdfFontName(fontName);

    // Color extraction: default to dark ink color
    const color = '#1e293b';

    items.push({
      id: `p${pageNumber}-t${i}`,
      text: rawItem.str,
      originalText: rawItem.str,
      x: Math.round(screenX),
      y: Math.round(screenY),
      width: Math.max(12, Math.round(itemWidth)),
      height: Math.max(12, Math.round(itemHeight)),
      rawFontName: fontName,
      fontFamily: parsed.fontFamily,
      fontSize: Math.max(8, Math.round(fontHeight)),
      fontWeight: parsed.fontWeight,
      fontStyle: parsed.fontStyle,
      color,
      backgroundColor: '#ffffff',
      letterSpacing: 0,
      pageNumber,
    });
  }

  // Group adjacent word fragments into cohesive lines/phrases
  return groupAdjacentTextItems(items);
}
