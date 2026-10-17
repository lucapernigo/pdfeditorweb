/**
 * Utility for converting between screen viewport coordinates (top-left origin, CSS px)
 * and PDF document coordinates (bottom-left origin, 72 pt/inch).
 */

export interface ScreenRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PdfRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PageDimensionInfo {
  pdfPageWidth: number;   // Original PDF width in points (usually ~595.28 for A4, ~612 for Letter)
  pdfPageHeight: number;  // Original PDF height in points (usually ~841.89 for A4, ~792 for Letter)
  viewWidth: number;      // Current rendered width in CSS pixels
  viewHeight: number;     // Current rendered height in CSS pixels
}

/**
 * Converts a screen rectangle to PDF coordinate points.
 * Note that in PDF coordinates:
 * - Origin (0,0) is at the bottom-left corner.
 * - y increases upwards.
 * - Screen y=0 maps to PDF y=pdfPageHeight.
 */
export function screenToPdfCoordinates(
  screenRect: ScreenRect,
  dim: PageDimensionInfo
): PdfRect {
  const scaleX = dim.pdfPageWidth / dim.viewWidth;
  const scaleY = dim.pdfPageHeight / dim.viewHeight;

  const pdfW = screenRect.width * scaleX;
  const pdfH = screenRect.height * scaleY;

  const pdfX = screenRect.x * scaleX;
  // Invert Y coordinate:
  // Screen top is screenRect.y, screen bottom is screenRect.y + screenRect.height.
  // PDF y starts from bottom of page.
  const pdfY = (dim.viewHeight - (screenRect.y + screenRect.height)) * scaleY;

  return {
    x: Math.max(0, Number(pdfX.toFixed(2))),
    y: Math.max(0, Number(pdfY.toFixed(2))),
    width: Math.max(1, Number(pdfW.toFixed(2))),
    height: Math.max(1, Number(pdfH.toFixed(2))),
  };
}

/**
 * Converts a PDF rectangle back to screen viewport pixels.
 */
export function pdfToScreenCoordinates(
  pdfRect: PdfRect,
  dim: PageDimensionInfo
): ScreenRect {
  const scaleX = dim.viewWidth / dim.pdfPageWidth;
  const scaleY = dim.viewHeight / dim.pdfPageHeight;

  const screenW = pdfRect.width * scaleX;
  const screenH = pdfRect.height * scaleY;

  const screenX = pdfRect.x * scaleX;
  // Screen Y increases downwards from top:
  const screenY = dim.viewHeight - (pdfRect.y + pdfRect.height) * scaleY;

  return {
    x: Number(screenX.toFixed(2)),
    y: Number(screenY.toFixed(2)),
    width: Number(screenW.toFixed(2)),
    height: Number(screenH.toFixed(2)),
  };
}

/**
 * Converts screen font size in pixels to PDF font size in points.
 */
export function convertFontSizeToPdf(
  screenFontSize: number,
  viewHeight: number,
  pdfPageHeight: number
): number {
  if (viewHeight <= 0) return screenFontSize;
  const scale = pdfPageHeight / viewHeight;
  return Math.max(6, Number((screenFontSize * scale).toFixed(2)));
}

/**
 * Converts PDF font size in points to screen font size in pixels.
 */
export function convertPdfToScreenFontSize(
  pdfFontSize: number,
  viewHeight: number,
  pdfPageHeight: number
): number {
  if (pdfPageHeight <= 0) return pdfFontSize;
  const scale = viewHeight / pdfPageHeight;
  return Math.max(6, Number((pdfFontSize * scale).toFixed(2)));
}

/**
 * Helper to parse hex colors to RGB components [0..1] for pdf-lib
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  if (clean.length !== 6) {
    return { r: 0, g: 0, b: 0 };
  }
  const intVal = parseInt(clean, 16);
  return {
    r: ((intVal >> 16) & 255) / 255,
    g: ((intVal >> 8) & 255) / 255,
    b: (intVal & 255) / 255,
  };
}
