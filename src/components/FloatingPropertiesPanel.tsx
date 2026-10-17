import React from 'react';
import {
  Sparkles,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Trash2,
  Copy,
  Layers,
  X,
  ShieldCheck,
  RotateCcw,
  Pencil,
} from 'lucide-react';
import type { EditorElement, ExtractedTextItem } from '../types/pdf.ts';

interface FloatingPropertiesPanelProps {
  element: EditorElement | null;
  textItem: ExtractedTextItem | null;
  onUpdateElement: (updated: Partial<EditorElement>) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
  onUpdateTextItem: (updated: Partial<ExtractedTextItem>) => void;
  onResetTextItem: () => void;
  onClose: () => void;
}

const FONT_FAMILIES = [
  { label: 'Helvetica (Clean Sans)', value: 'Helvetica' },
  { label: 'Times New Roman (Formal Serif)', value: 'Times New Roman' },
  { label: 'Courier (Typewriter Mono)', value: 'Courier' },
  { label: 'Arial (Standard Sans)', value: 'Arial' },
  { label: 'Georgia (Modern Serif)', value: 'Georgia' },
  { label: 'Verdana (Legible Sans)', value: 'Verdana' },
];

const PRESET_COLORS = [
  '#000000', // Solid Black
  '#1e293b', // Deep Slate
  '#1e3a8a', // Corporate Blue
  '#991b1b', // Burgundy Red
  '#166534', // Forest Green
  '#b45309', // Amber Gold
  '#475569', // Muted Gray
  '#ffffff', // White
];

export const FloatingPropertiesPanel: React.FC<FloatingPropertiesPanelProps> = ({
  element,
  textItem,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  onUpdateTextItem,
  onResetTextItem,
  onClose,
}) => {
  if (!element && !textItem) return null;

  // Case 1: Editing Existing PDF Text In-Place
  if (textItem) {
    const isModified = textItem.isModified || textItem.text !== textItem.originalText;

    return (
      <div
        className="fixed bottom-3 right-3 md:bottom-6 md:right-6 z-40 bg-slate-900/95 border border-indigo-500/60 rounded-2xl shadow-2xl p-4 w-84 max-w-[calc(100vw-1.5rem)] backdrop-blur-md text-white animate-in fade-in slide-in-from-bottom-4 duration-200"
        data-testid="floating-properties-panel"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Pencil className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
                <span>Existing PDF Text</span>
                {isModified && (
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded-full font-bold">
                    Modified
                  </span>
                )}
              </h4>
              <p className="text-[10px] text-slate-400">Page {textItem.pageNumber}</p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            {isModified && (
              <button
                onClick={onResetTextItem}
                aria-label="Revert to original text"
                title="Revert to original text"
                className="p-1.5 text-amber-400 hover:text-amber-300 hover:bg-amber-500/20 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close properties panel"
              title="Close"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Original Text Reference */}
        <div className="mt-3 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
          <div className="text-[10px] text-slate-400 font-medium mb-1">Original Text:</div>
          <p className="text-[11px] text-slate-300 font-mono truncate select-text">
            "{textItem.originalText}"
          </p>
        </div>

        {/* Text Input Content */}
        <div className="mt-3 space-y-3">
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">Edit Text</label>
            <textarea
              rows={2}
              value={textItem.text}
              onChange={(e) => onUpdateTextItem({ text: e.target.value, isModified: true })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
              placeholder="Edit text content..."
            />
          </div>

          {/* Font Family */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">Font Family</label>
            <select
              value={textItem.fontFamily || 'Helvetica'}
              onChange={(e) => onUpdateTextItem({ fontFamily: e.target.value, isModified: true })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
            >
              {FONT_FAMILIES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* Size & Weight & Style */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">Font Size</label>
              <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg px-2 py-1">
                <input
                  type="number"
                  min="6"
                  max="72"
                  value={textItem.fontSize || 14}
                  onChange={(e) =>
                    onUpdateTextItem({
                      fontSize: Math.max(6, parseInt(e.target.value) || 14),
                      isModified: true,
                    })
                  }
                  className="w-full bg-transparent text-xs text-white focus:outline-none"
                />
                <span className="text-[10px] text-slate-400">pt</span>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">Style</label>
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateTextItem({
                      fontWeight: textItem.fontWeight === 'bold' ? 'normal' : 'bold',
                      isModified: true,
                    })
                  }
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center border transition-colors ${
                    textItem.fontWeight === 'bold'
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                  title="Toggle Bold"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateTextItem({
                      fontStyle: textItem.fontStyle === 'italic' ? 'normal' : 'italic',
                      isModified: true,
                    })
                  }
                  className={`flex-1 py-1.5 rounded-lg text-xs italic flex items-center justify-center border transition-colors ${
                    textItem.fontStyle === 'italic'
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                  title="Toggle Italic"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Text Color */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1.5">Text Color</label>
            <div className="flex items-center space-x-1.5">
              {PRESET_COLORS.map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => onUpdateTextItem({ color: col, isModified: true })}
                  style={{ backgroundColor: col }}
                  className={`w-5 h-5 rounded-full border transition-transform ${
                    textItem.color === col
                      ? 'scale-125 ring-2 ring-indigo-400 border-white'
                      : 'border-slate-600 hover:scale-110'
                  }`}
                  title={col}
                />
              ))}
              <input
                type="color"
                value={textItem.color || '#1e293b'}
                onChange={(e) => onUpdateTextItem({ color: e.target.value, isModified: true })}
                className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                title="Custom Color"
              />
            </div>
          </div>

          {/* Mask Background Color */}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-300 font-medium block">
                  Background Mask Cover
                </span>
                <span className="text-[10px] text-slate-500">
                  Hides original text underneath
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="w-5 h-5 rounded border border-slate-600 shadow-sm"
                  style={{ backgroundColor: textItem.backgroundColor || '#ffffff' }}
                />
                <input
                  type="color"
                  value={textItem.backgroundColor || '#ffffff'}
                  onChange={(e) =>
                    onUpdateTextItem({ backgroundColor: e.target.value, isModified: true })
                  }
                  className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                  title="Custom Mask Color"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Case 2: Custom Added Element Properties
  if (element) {
    const isText = element.type === 'text';

    return (
      <div
        className="fixed bottom-3 right-3 md:bottom-6 md:right-6 z-40 bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl p-4 w-84 max-w-[calc(100vw-1.5rem)] backdrop-blur-md text-white animate-in fade-in slide-in-from-bottom-4 duration-200"
        data-testid="floating-properties-panel"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              {element.matchedSourceText ? (
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              ) : (
                <Layers className="w-3.5 h-3.5" />
              )}
            </div>
            <div>
              <h4 className="text-xs font-semibold capitalize text-slate-100">
                {element.type === 'text' ? 'Text Box' : `${element.type} Box`}
              </h4>
              <p className="text-[10px] text-slate-400">Page {element.pageNumber}</p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => onDuplicateElement(element.id)}
              aria-label="Duplicate element"
              title="Duplicate"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDeleteElement(element.id)}
              aria-label="Delete element"
              title="Delete"
              className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              aria-label="Close properties panel"
              title="Close"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {element.matchedSourceText && isText && (
          <div className="mt-3 p-2.5 rounded-xl bg-gradient-to-r from-cyan-950/50 to-indigo-950/50 border border-cyan-500/30 text-xs">
            <div className="flex items-center space-x-1.5 text-cyan-300 font-medium mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-[11px]">Auto-Matched Style From:</span>
            </div>
            <p className="text-[11px] text-slate-300 italic truncate font-mono bg-slate-900/60 px-2 py-1 rounded">
              "{element.matchedSourceText}"
            </p>
          </div>
        )}

        {isText ? (
          <div className="mt-3 space-y-3">
            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">Font Family</label>
              <select
                value={element.fontFamily || 'Helvetica'}
                onChange={(e) => onUpdateElement({ fontFamily: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              >
                {FONT_FAMILIES.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">Font Size</label>
                <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg px-2 py-1">
                  <input
                    type="number"
                    min="6"
                    max="72"
                    value={element.fontSize || 14}
                    onChange={(e) =>
                      onUpdateElement({ fontSize: Math.max(6, parseInt(e.target.value) || 14) })
                    }
                    className="w-full bg-transparent text-xs text-white focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">pt</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">Style</label>
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateElement({
                        fontWeight: element.fontWeight === 'bold' ? 'normal' : 'bold',
                      })
                    }
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center border transition-colors ${
                      element.fontWeight === 'bold'
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateElement({
                        fontStyle: element.fontStyle === 'italic' ? 'normal' : 'italic',
                      })
                    }
                    className={`flex-1 py-1.5 rounded-lg text-xs italic flex items-center justify-center border transition-colors ${
                      element.fontStyle === 'italic'
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1.5">Text Color</label>
              <div className="flex items-center space-x-1.5">
                {PRESET_COLORS.map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => onUpdateElement({ color: col })}
                    style={{ backgroundColor: col }}
                    className={`w-5 h-5 rounded-full border transition-transform ${
                      element.color === col
                        ? 'scale-125 ring-2 ring-indigo-400 border-white'
                        : 'border-slate-600 hover:scale-110'
                    }`}
                  />
                ))}
                <input
                  type="color"
                  value={element.color || '#1e293b'}
                  onChange={(e) => onUpdateElement({ color: e.target.value })}
                  className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">Opacity</label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={element.opacity ?? (element.type === 'highlight' ? 0.35 : 1)}
                onChange={(e) => onUpdateElement({ opacity: parseFloat(e.target.value) })}
                className="w-full accent-indigo-500"
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};
