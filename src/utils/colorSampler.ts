import type { ExtractedTextItem } from '../types/pdf.ts';

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const clamped = Math.max(0, Math.min(255, Math.round(n)));
    return clamped.toString(16).padStart(2, '0');
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Samples the actual rendered canvas pixels to detect:
 * 1. The exact background color directly surrounding the text (for the mask/cover).
 * 2. The exact text foreground ink color.
 */
export function sampleColorsFromCanvas(
  canvas: HTMLCanvasElement,
  items: ExtractedTextItem[],
  zoom: number = 1.0
): ExtractedTextItem[] {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return items;

  const dpr = window.devicePixelRatio || 1;
  const canvasW = canvas.width;
  const canvasH = canvas.height;

  return items.map((item) => {
    try {
      // Scale coordinates to canvas backing store pixels
      const sampleBgX = Math.max(2, Math.min(canvasW - 4, Math.floor((item.x - 3) * dpr)));
      const sampleBgY = Math.max(2, Math.min(canvasH - 4, Math.floor((item.y - 2) * dpr)));

      const bgPixel = ctx.getImageData(sampleBgX, sampleBgY, 1, 1).data;
      const bgHex = rgbToHex(bgPixel[0], bgPixel[1], bgPixel[2]);

      // Calculate background luminance
      const bgLum = 0.299 * bgPixel[0] + 0.587 * bgPixel[1] + 0.114 * bgPixel[2];

      // Sample center for text ink color
      const sampleFgX = Math.max(0, Math.min(canvasW - 1, Math.floor((item.x + item.width * 0.3) * dpr)));
      const sampleFgY = Math.max(0, Math.min(canvasH - 1, Math.floor((item.y + item.height * 0.5) * dpr)));
      const fgPixel = ctx.getImageData(sampleFgX, sampleFgY, 1, 1).data;

      // If background is dark (luminance < 110), text color is typically white or very light
      let detectedTextColor = item.color;
      if (bgLum < 110) {
        // High contrast on dark background
        const fgLum = 0.299 * fgPixel[0] + 0.587 * fgPixel[1] + 0.114 * fgPixel[2];
        if (fgLum > 140) {
          detectedTextColor = rgbToHex(fgPixel[0], fgPixel[1], fgPixel[2]);
        } else {
          detectedTextColor = '#ffffff';
        }
      } else {
        // Light background (white, light gray, pale blue)
        const fgLum = 0.299 * fgPixel[0] + 0.587 * fgPixel[1] + 0.114 * fgPixel[2];
        if (fgLum < 160) {
          detectedTextColor = rgbToHex(fgPixel[0], fgPixel[1], fgPixel[2]);
        }
      }

      return {
        ...item,
        backgroundColor: bgHex,
        color: detectedTextColor,
      };
    } catch {
      return item;
    }
  });
}
