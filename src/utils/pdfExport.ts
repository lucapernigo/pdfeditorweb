import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { EditorElement, ExtractedTextItem, PageMetadata } from '../types/pdf.ts';
import { screenToPdfCoordinates, convertFontSizeToPdf, hexToRgb } from './coordinateTransform.ts';

/**
 * Maps a font family, weight, and style to standard PDF-14 fonts built into all PDF readers.
 */
function getStandardFontName(
  family: string = 'Helvetica',
  weight: 'normal' | 'bold' = 'normal',
  style: 'normal' | 'italic' = 'normal'
): StandardFonts {
  const isBold = weight === 'bold';
  const isItalic = style === 'italic';
  const lower = (family || 'Helvetica').toLowerCase();

  if (lower.includes('times') || lower.includes('serif')) {
    if (isBold && isItalic) return StandardFonts.TimesRomanBoldItalic;
    if (isBold) return StandardFonts.TimesRomanBold;
    if (isItalic) return StandardFonts.TimesRomanItalic;
    return StandardFonts.TimesRoman;
  }

  if (lower.includes('courier') || lower.includes('mono')) {
    if (isBold && isItalic) return StandardFonts.CourierBoldOblique;
    if (isBold) return StandardFonts.CourierBold;
    if (isItalic) return StandardFonts.CourierOblique;
    return StandardFonts.Courier;
  }

  // Default to Helvetica (matches Arial and standard modern sans-serifs)
  if (isBold && isItalic) return StandardFonts.HelveticaBoldOblique;
  if (isBold) return StandardFonts.HelveticaBold;
  if (isItalic) return StandardFonts.HelveticaOblique;
  return StandardFonts.Helvetica;
}

/**
 * Bakes user in-place text edits and annotations directly into the PDF.
 * Original PDF text is seamlessly covered with a background-matched mask
 * and the newly edited text is drawn at the exact coordinates.
 */
export async function exportModifiedPdf(
  originalPdfBytes: Uint8Array,
  elements: EditorElement[],
  pagesMetadata: Record<number, PageMetadata>,
  modifiedTextItems: ExtractedTextItem[] = []
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(originalPdfBytes);
  const pdfPages = pdfDoc.getPages();

  // Cache embedded fonts so we don't duplicate font embedding
  const fontCache: Partial<Record<StandardFonts, any>> = {};

  async function getFont(fontName: StandardFonts) {
    if (!fontCache[fontName]) {
      fontCache[fontName] = await pdfDoc.embedFont(fontName);
    }
    return fontCache[fontName];
  }

  // 1. Bake in-place text edits with background-matched masking
  for (const item of modifiedTextItems) {
    if (!item.isModified && item.text === item.originalText) continue;

    const pageIdx = item.pageNumber - 1;
    if (pageIdx < 0 || pageIdx >= pdfPages.length) continue;

    const page = pdfPages[pageIdx];
    const meta = pagesMetadata[item.pageNumber];
    if (!meta) continue;

    const dim = {
      pdfPageWidth: meta.originalWidth,
      pdfPageHeight: meta.originalHeight,
      viewWidth: meta.viewWidth,
      viewHeight: meta.viewHeight,
    };

    const pdfCoords = screenToPdfCoordinates(
      {
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
      },
      dim
    );

    // Step A: Draw background-matched mask to suppress original PDF vector text
    const bgCol = hexToRgb(item.backgroundColor || '#ffffff');
    page.drawRectangle({
      x: Math.max(0, pdfCoords.x - 1.5),
      y: Math.max(0, pdfCoords.y - 1.5),
      width: pdfCoords.width + 3,
      height: pdfCoords.height + 3,
      color: rgb(bgCol.r, bgCol.g, bgCol.b),
      opacity: 1.0,
    });

    // Step B: Draw the new edited text string
    if (item.text && item.text.trim().length > 0) {
      const fontName = getStandardFontName(
        item.fontFamily,
        item.fontWeight,
        item.fontStyle
      );
      const font = await getFont(fontName);
      const pdfFontSize = convertFontSizeToPdf(
        item.fontSize,
        meta.viewHeight,
        meta.originalHeight
      );
      const textColor = hexToRgb(item.color || '#1e293b');

      page.drawText(item.text, {
        x: pdfCoords.x,
        y: pdfCoords.y + pdfCoords.height - pdfFontSize * 0.95,
        size: pdfFontSize,
        font: font,
        color: rgb(textColor.r, textColor.g, textColor.b),
        opacity: 1.0,
      });
    }
  }

  // 2. Bake custom added elements (text, whiteouts, highlights)
  for (const element of elements) {
    const pageIdx = element.pageNumber - 1;
    if (pageIdx < 0 || pageIdx >= pdfPages.length) continue;

    const page = pdfPages[pageIdx];
    const meta = pagesMetadata[element.pageNumber];
    if (!meta) continue;

    const dim = {
      pdfPageWidth: meta.originalWidth,
      pdfPageHeight: meta.originalHeight,
      viewWidth: meta.viewWidth,
      viewHeight: meta.viewHeight,
    };

    const pdfCoords = screenToPdfCoordinates(
      {
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
      },
      dim
    );

    // 1. Draw Whiteout / Redaction rectangle
    if (element.type === 'whiteout') {
      page.drawRectangle({
        x: pdfCoords.x,
        y: pdfCoords.y,
        width: pdfCoords.width,
        height: pdfCoords.height,
        color: rgb(1, 1, 1),
        opacity: element.opacity ?? 1.0,
      });
      continue;
    }

    // 2. Draw Highlight rectangle
    if (element.type === 'highlight') {
      const col = hexToRgb(element.color || '#fef08a');
      page.drawRectangle({
        x: pdfCoords.x,
        y: pdfCoords.y,
        width: pdfCoords.width,
        height: pdfCoords.height,
        color: rgb(col.r, col.g, col.b),
        opacity: element.opacity ?? 0.35,
      });
      continue;
    }

    // 3. Draw Text Element
    if (element.type === 'text' && element.text) {
      // If the text has background fill enabled (whiteout behind text), draw background rectangle first!
      if (element.hasBackgroundFill) {
        const bgCol = hexToRgb(element.backgroundColor || '#ffffff');
        page.drawRectangle({
          x: pdfCoords.x,
          y: pdfCoords.y,
          width: pdfCoords.width,
          height: pdfCoords.height,
          color: rgb(bgCol.r, bgCol.g, bgCol.b),
          opacity: 1.0,
        });
      }

      const fontName = getStandardFontName(
        element.fontFamily,
        element.fontWeight,
        element.fontStyle
      );
      const embeddedFont = await getFont(fontName);

      const pdfFontSize = convertFontSizeToPdf(
        element.fontSize || 14,
        meta.viewHeight,
        meta.originalHeight
      );

      const textColor = hexToRgb(element.color || '#1e293b');
      const lines = element.text.split('\n');
      const lineHeight = pdfFontSize * 1.25;

      // In PDF coordinates, y starts at baseline from bottom
      // We align the top line to start right below the top border of the box
      let currentY = pdfCoords.y + pdfCoords.height - pdfFontSize * 0.95;

      for (const line of lines) {
        if (line.trim().length === 0) {
          currentY -= lineHeight;
          continue;
        }

        let lineX = pdfCoords.x;
        const textWidth = embeddedFont.widthOfTextAtSize(line, pdfFontSize);

        if (element.textAlign === 'center') {
          lineX = pdfCoords.x + Math.max(0, (pdfCoords.width - textWidth) / 2);
        } else if (element.textAlign === 'right') {
          lineX = pdfCoords.x + Math.max(0, pdfCoords.width - textWidth);
        }

        page.drawText(line, {
          x: lineX,
          y: currentY,
          size: pdfFontSize,
          font: embeddedFont,
          color: rgb(textColor.r, textColor.g, textColor.b),
          opacity: element.opacity ?? 1.0,
        });

        currentY -= lineHeight;
      }
    }
  }

  return await pdfDoc.save();
}

/**
 * Triggers a browser download of the exported PDF Uint8Array.
 */
export function downloadPdfBlob(pdfBytes: Uint8Array, fileName: string = 'edited_document.pdf') {
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
