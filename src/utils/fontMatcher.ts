import type { ExtractedTextItem, MatchedStyle } from '../types/pdf.ts';

export interface ParsedFontInfo {
  fontFamily: string;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
}

/**
 * Normalizes raw PDF font names (e.g., "BCDFEE+Helvetica-Bold", "TimesNewRomanPSMT", "Arial,Bold")
 * into a recognized standard web & PDF font family, weight, and style.
 */
export function parsePdfFontName(rawFontName: string): ParsedFontInfo {
  if (!rawFontName) {
    return { fontFamily: 'Helvetica', fontWeight: 'normal', fontStyle: 'normal' };
  }

  // Strip prefix like "ABCDEF+" often added by subsetting
  let cleanName = rawFontName;
  if (cleanName.includes('+')) {
    cleanName = cleanName.split('+')[1];
  }

  const lower = cleanName.toLowerCase();

  // Detect font weight
  const isBold =
    lower.includes('bold') ||
    lower.includes('heavy') ||
    lower.includes('black') ||
    lower.includes('bolder') ||
    lower.includes('semibold') ||
    lower.includes('demibold') ||
    lower.includes('-bd') ||
    lower.includes('-b');

  // Detect font style
  const isItalic =
    lower.includes('italic') ||
    lower.includes('oblique') ||
    lower.includes('slant') ||
    lower.includes('-it') ||
    lower.includes('-i');

  // Map to standard font families
  let fontFamily = 'Helvetica'; // Default clean sans-serif

  if (
    lower.includes('times') ||
    lower.includes('serif') ||
    lower.includes('georgia') ||
    lower.includes('palatino') ||
    lower.includes('garamond') ||
    lower.includes('baskerville')
  ) {
    fontFamily = 'Times New Roman';
  } else if (
    lower.includes('courier') ||
    lower.includes('mono') ||
    lower.includes('consolas') ||
    lower.includes('typewriter') ||
    lower.includes('menlo')
  ) {
    fontFamily = 'Courier';
  } else if (lower.includes('arial')) {
    fontFamily = 'Arial';
  } else if (lower.includes('georgia')) {
    fontFamily = 'Georgia';
  } else if (lower.includes('verdana')) {
    fontFamily = 'Verdana';
  } else if (lower.includes('helvetica') || lower.includes('sans')) {
    fontFamily = 'Helvetica';
  }

  return {
    fontFamily,
    fontWeight: isBold ? 'bold' : 'normal',
    fontStyle: isItalic ? 'italic' : 'normal',
  };
}

/**
 * Computes shortest distance from point (px, py) to a rectangle (rx, ry, rw, rh)
 */
export function distanceToBox(
  px: number,
  py: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number
): number {
  const cx = Math.max(rx, Math.min(px, rx + rw));
  const cy = Math.max(ry, Math.min(py, ry + rh));
  const dx = px - cx;
  const dy = py - cy;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Finds the nearest surrounding text block to a given (x, y) point on the canvas.
 * Weighs horizontal and line continuity to favor reading-flow proximity.
 */
export function findNearestTextBlock(
  targetX: number,
  targetY: number,
  items: ExtractedTextItem[],
  maxDistanceThreshold: number = 400
): MatchedStyle | null {
  if (!items || items.length === 0) {
    return null;
  }

  let bestItem: ExtractedTextItem | null = null;
  let minScore = Infinity;

  for (const item of items) {
    // Skip empty or purely whitespace items
    if (!item.text || item.text.trim().length === 0) continue;

    const rawDist = distanceToBox(targetX, targetY, item.x, item.y, item.width, item.height);

    // Apply reading-order heuristic:
    // If vertically close (same line or next line within 1.5x height), give it a strong preference
    const lineCenterY = item.y + item.height / 2;
    const dy = Math.abs(targetY - lineCenterY);
    const lineBonus = dy <= item.height * 1.5 ? 0.75 : 1.0;

    const weightedScore = rawDist * lineBonus;

    if (weightedScore < minScore) {
      minScore = weightedScore;
      bestItem = item;
    }
  }

  if (!bestItem) return null;

  const actualDistance = distanceToBox(
    targetX,
    targetY,
    bestItem.x,
    bestItem.y,
    bestItem.width,
    bestItem.height
  );

  if (actualDistance > maxDistanceThreshold) {
    return null;
  }

  // Calculate confidence from 0 to 1 based on proximity
  const confidence = Math.max(0.2, Math.min(1.0, 1 - actualDistance / maxDistanceThreshold));

  const parsed = parsePdfFontName(bestItem.rawFontName || bestItem.fontFamily);

  return {
    sourceText: bestItem.text.trim().slice(0, 40),
    fontFamily: parsed.fontFamily,
    fontSize: Math.round(bestItem.fontSize) || 14,
    fontWeight: bestItem.fontWeight || parsed.fontWeight,
    fontStyle: bestItem.fontStyle || parsed.fontStyle,
    color: bestItem.color || '#1e293b',
    letterSpacing: bestItem.letterSpacing || 0,
    distance: Math.round(actualDistance),
    confidence: Number(confidence.toFixed(2)),
    sourceBox: {
      x: bestItem.x,
      y: bestItem.y,
      width: bestItem.width,
      height: bestItem.height,
    },
  };
}
