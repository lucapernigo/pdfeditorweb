export interface ExtractedTextItem {
  id: string;
  text: string;
  originalText: string;
  x: number; // Viewport / canvas pixels
  y: number;
  width: number;
  height: number;
  rawFontName: string;
  fontFamily: string;
  fontSize: number; // Viewport pixels
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  color: string; // Hex color string, e.g. '#1e293b'
  backgroundColor?: string; // Sampled background color underneath text for seamless masking
  letterSpacing: number;
  pageNumber: number;
  isModified?: boolean;
}

export interface InPlaceTextEdit {
  id: string;
  pageNumber: number;
  originalText: string;
  currentText: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  color: string;
  backgroundColor: string;
  isModified: boolean;
}

export interface MatchedStyle {
  sourceText: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  color: string;
  letterSpacing: number;
  distance: number;
  confidence: number; // 0 to 1
  sourceBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export type ElementType = 'text' | 'whiteout' | 'highlight' | 'rectangle';

export interface EditorElement {
  id: string;
  type: ElementType;
  pageNumber: number;
  x: number; // Viewport coordinates at base scale 1.0 (or unscaled page units)
  y: number;
  width: number;
  height: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  color?: string;
  backgroundColor?: string;
  hasBackgroundFill?: boolean; // If true on text, automatically whites-out background behind text
  letterSpacing?: number;
  textAlign?: 'left' | 'center' | 'right';
  opacity?: number;
  matchedSourceText?: string;
}

export interface PageMetadata {
  pageNumber: number;
  originalWidth: number; // PDF points (1/72 in)
  originalHeight: number;
  viewWidth: number; // Rendered screen pixels
  viewHeight: number;
  scale: number;
  rotation: number;
}

export type ActiveTool = 'select' | 'text' | 'whiteout' | 'highlight';
