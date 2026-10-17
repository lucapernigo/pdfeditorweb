import type { ExtractedTextItem } from '../types/pdf.ts';

/**
 * Groups adjacent word-level or syllable-level text fragments on the same line
 * into natural, cohesive text phrases and lines.
 */
export function groupAdjacentTextItems(items: ExtractedTextItem[]): ExtractedTextItem[] {
  if (!items || items.length === 0) return [];

  // Sort items primarily by vertical line (y) then horizontal position (x)
  const sorted = [...items].sort((a, b) => {
    const yDiff = a.y - b.y;
    if (Math.abs(yDiff) > 4) {
      return yDiff;
    }
    return a.x - b.x;
  });

  const grouped: ExtractedTextItem[] = [];
  let current: ExtractedTextItem = { ...sorted[0] };

  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];

    // Check if on the same horizontal line
    const sameLine = Math.abs(next.y - current.y) <= Math.max(4, current.height * 0.35);
    // Check if font properties match or are close
    const sameFont = next.fontFamily === current.fontFamily && Math.abs(next.fontSize - current.fontSize) <= 3;
    // Calculate gap between current end and next start
    const currentEnd = current.x + current.width;
    const gap = next.x - currentEnd;
    const maxGap = Math.max(8, current.fontSize * 1.6);

    // If on same line, similar font, and gap is small (typical word space), merge them!
    if (sameLine && sameFont && gap >= -4 && gap <= maxGap) {
      const needsSpace =
        !current.text.endsWith(' ') &&
        !next.text.startsWith(' ') &&
        gap > 1;

      const combinedText = needsSpace ? `${current.text} ${next.text}` : `${current.text}${next.text}`;
      const newWidth = Math.max(current.width, (next.x + next.width) - current.x);
      const newHeight = Math.max(current.height, next.height);

      current = {
        ...current,
        text: combinedText,
        originalText: combinedText,
        width: Math.round(newWidth),
        height: Math.round(newHeight),
        // If either is bold, keep bold
        fontWeight: current.fontWeight === 'bold' || next.fontWeight === 'bold' ? 'bold' : 'normal',
      };
    } else {
      grouped.push(current);
      current = { ...next };
    }
  }

  grouped.push(current);
  return grouped;
}
