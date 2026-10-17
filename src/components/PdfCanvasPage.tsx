import React, { useEffect, useRef, useState } from 'react';
import type * as pdfjsLib from 'pdfjs-dist';
import type {
  EditorElement,
  ExtractedTextItem,
  MatchedStyle,
  ActiveTool,
  PageMetadata,
} from '../types/pdf.ts';
import { sampleColorsFromCanvas } from '../utils/colorSampler.ts';
import { findNearestTextBlock } from '../utils/fontMatcher.ts';
import {
  Sparkles,
  Move,
  Trash2,
  Check,
  RotateCcw,
  Pencil,
  Eye,
} from 'lucide-react';

interface PdfCanvasPageProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  pageNumber: number;
  zoom: number;
  activeTool: ActiveTool;
  smartMatchEnabled: boolean;
  showLayoutLayer: boolean;
  textItems: ExtractedTextItem[];
  onUpdateTextItems: (pageNumber: number, items: ExtractedTextItem[]) => void;
  activeEditingTextId: string | null;
  onSelectTextItem: (id: string | null) => void;
  onUpdateTextItem: (id: string, updated: Partial<ExtractedTextItem>) => void;
  onResetTextItem: (id: string) => void;
  elements: EditorElement[];
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onAddElement: (element: EditorElement, matchedStyle?: MatchedStyle | null) => void;
  onUpdateElement: (id: string, updated: Partial<EditorElement>) => void;
  onDeleteElement: (id: string) => void;
  onPageRendered: (meta: PageMetadata) => void;
}

export const PdfCanvasPage: React.FC<PdfCanvasPageProps> = ({
  pdfDoc,
  pageNumber,
  zoom,
  activeTool,
  smartMatchEnabled,
  showLayoutLayer,
  textItems,
  onUpdateTextItems,
  activeEditingTextId,
  onSelectTextItem,
  onUpdateTextItem,
  onResetTextItem,
  elements,
  selectedElementId,
  onSelectElement,
  onAddElement,
  onUpdateElement,
  onDeleteElement,
  onPageRendered,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeInputRef = useRef<HTMLInputElement>(null);

  const [hoveredTextItem, setHoveredTextItem] = useState<ExtractedTextItem | null>(null);
  const [hoveredNearest, setHoveredNearest] = useState<MatchedStyle | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  const [isDraggingElement, setIsDraggingElement] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isResizingElement, setIsResizingElement] = useState<string | null>(null);
  const [editingCustomTextId, setEditingCustomTextId] = useState<string | null>(null);

  const renderTaskRef = useRef<any>(null);

  // Render PDF page to Canvas with high DPI support
  useEffect(() => {
    let isCancelled = false;

    async function renderPage() {
      if (!canvasRef.current || !pdfDoc) return;

      try {
        const page = await pdfDoc.getPage(pageNumber);
        if (isCancelled) return;

        const viewport = page.getViewport({ scale: zoom });
        const baseViewport = page.getViewport({ scale: 1.0 });

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: true });
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const renderTask = page.render({
          canvasContext: ctx,
          viewport: viewport,
          canvas: canvas,
        });
        renderTaskRef.current = renderTask;

        await renderTask.promise;

        if (!isCancelled) {
          onPageRendered({
            pageNumber,
            originalWidth: baseViewport.width,
            originalHeight: baseViewport.height,
            viewWidth: Math.floor(viewport.width),
            viewHeight: Math.floor(viewport.height),
            scale: zoom,
            rotation: viewport.rotation,
          });

          // Sample canvas background and ink colors for all text items
          if (textItems.length > 0) {
            const sampled = sampleColorsFromCanvas(canvas, textItems, zoom);
            onUpdateTextItems(pageNumber, sampled);
          }
        }
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('Error rendering PDF page:', err);
        }
      }
    }

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdfDoc, pageNumber, zoom]);

  // Auto-focus and select input text when an in-place text item is activated
  useEffect(() => {
    if (activeEditingTextId && activeInputRef.current) {
      activeInputRef.current.focus();
      activeInputRef.current.select();
    }
  }, [activeEditingTextId]);

  // Handle pointer hover
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCursorPos({ x, y });

    // If text tool is active and hovering empty space, calculate nearest match
    if (activeTool === 'text' && smartMatchEnabled && !activeEditingTextId) {
      const match = findNearestTextBlock(x, y, textItems, 350);
      setHoveredNearest(match);
    } else {
      setHoveredNearest(null);
    }

    // Dragging custom element
    if (isDraggingElement) {
      const newX = Math.max(0, Math.min(rect.width - 20, x - dragOffset.x));
      const newY = Math.max(0, Math.min(rect.height - 20, y - dragOffset.y));
      onUpdateElement(isDraggingElement, { x: newX, y: newY });
    }

    // Resizing custom element
    if (isResizingElement) {
      const el = elements.find((item) => item.id === isResizingElement);
      if (el) {
        const newWidth = Math.max(40, x - el.x);
        const newHeight = Math.max(20, y - el.y);
        onUpdateElement(isResizingElement, { width: newWidth, height: newHeight });
      }
    }
  };

  const handleMouseUp = () => {
    setIsDraggingElement(null);
    setIsResizingElement(null);
  };

  // Handle clicking on page background
  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // If clicked on an existing text item or custom element, do not trigger background click
    if (
      (e.target as HTMLElement).closest('[data-text-id]') ||
      (e.target as HTMLElement).closest('[data-element-id]')
    ) {
      return;
    }

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Deselect active text item if clicking empty space
    if (activeEditingTextId) {
      onSelectTextItem(null);
    }

    if (activeTool === 'whiteout') {
      const newId = `el-${Date.now()}`;
      const newElement: EditorElement = {
        id: newId,
        type: 'whiteout',
        pageNumber,
        x: clickX,
        y: clickY,
        width: 140,
        height: 28,
        backgroundColor: '#ffffff',
        opacity: 1.0,
      };
      onAddElement(newElement);
      onSelectElement(newId);
    } else if (activeTool === 'highlight') {
      const newId = `el-${Date.now()}`;
      const newElement: EditorElement = {
        id: newId,
        type: 'highlight',
        pageNumber,
        x: clickX,
        y: clickY,
        width: 150,
        height: 24,
        color: '#fef08a',
        opacity: 0.35,
      };
      onAddElement(newElement);
      onSelectElement(newId);
    } else if (activeTool === 'text') {
      // If user clicks in empty area with text tool, insert a new box with nearest font match
      let matched: MatchedStyle | null = null;
      if (smartMatchEnabled) {
        matched = findNearestTextBlock(clickX, clickY, textItems, 350);
      }

      const defaultFont = matched?.fontFamily || 'Helvetica';
      const defaultSize = matched?.fontSize || 14;
      const defaultWeight = matched?.fontWeight || 'normal';
      const defaultColor = matched?.color || '#1e293b';

      const newId = `el-${Date.now()}`;
      const newElement: EditorElement = {
        id: newId,
        type: 'text',
        pageNumber,
        x: clickX,
        y: clickY,
        width: 180,
        height: Math.max(30, defaultSize * 1.8),
        text: 'Type text here...',
        fontSize: defaultSize,
        fontFamily: defaultFont,
        fontWeight: defaultWeight,
        fontStyle: matched?.fontStyle || 'normal',
        color: defaultColor,
        textAlign: 'left',
        hasBackgroundFill: true,
        backgroundColor: '#ffffff',
        matchedSourceText: matched ? matched.sourceText : undefined,
      };

      onAddElement(newElement, matched);
      onSelectElement(newId);
      setEditingCustomTextId(newId);
    } else {
      // Select tool clicked background: deselect all
      onSelectElement(null);
      onSelectTextItem(null);
      setEditingCustomTextId(null);
    }
  };

  const handleStartDrag = (e: React.MouseEvent, el: EditorElement) => {
    e.stopPropagation();
    onSelectElement(el.id);
    onSelectTextItem(null);
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setIsDraggingElement(el.id);
    setDragOffset({
      x: mouseX - el.x,
      y: mouseY - el.y,
    });
  };

  const handleStartResize = (e: React.MouseEvent, el: EditorElement) => {
    e.stopPropagation();
    onSelectElement(el.id);
    onSelectTextItem(null);
    setIsResizingElement(el.id);
  };

  const activeEditingItem = textItems.find((t) => t.id === activeEditingTextId) || null;

  return (
    <div
      ref={containerRef}
      onClick={handlePageClick}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="relative inline-block bg-white shadow-2xl rounded-sm transition-shadow select-none mx-auto mb-10 cursor-default"
      style={{
        width: canvasRef.current?.style.width || 'auto',
        height: canvasRef.current?.style.height || 'auto',
      }}
    >
      {/* Background Document Canvas rendered by PDF.js */}
      <canvas ref={canvasRef} className="block pointer-events-none rounded-sm" />

      {/* ========================================================================= */}
      {/* 1. TRUE IN-PLACE EDITING LAYER FOR EXISTING PDF TEXT                     */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {textItems.map((item) => {
          const isActivelyEditing = activeEditingTextId === item.id;
          const isModified = item.isModified || item.text !== item.originalText;
          const isHovered = hoveredTextItem?.id === item.id;

          // Compute responsive box dimensions
          // If edited text is longer than original, expand width dynamically
          const estimatedCharWidth = Math.max(6, item.fontSize * 0.58);
          const currentTextLength = (item.text || '').length;
          const minBoxWidth = Math.max(item.width, currentTextLength * estimatedCharWidth + 10);

          return (
            <div
              key={item.id}
              data-text-id={item.id}
              onMouseEnter={() => setHoveredTextItem(item)}
              onMouseLeave={() => setHoveredTextItem(null)}
              onClick={(e) => {
                e.stopPropagation();
                onSelectTextItem(item.id);
                onSelectElement(null);
              }}
              className={`absolute pointer-events-auto transition-all rounded-[2px] ${
                isActivelyEditing
                  ? 'z-40 ring-2 ring-indigo-500 shadow-xl'
                  : isModified
                  ? 'z-30 ring-1 ring-emerald-500/80 hover:ring-2 hover:ring-indigo-400'
                  : 'hover:ring-1 hover:ring-cyan-500/70 hover:bg-cyan-500/10 cursor-text'
              }`}
              style={{
                left: `${item.x - 2}px`,
                top: `${item.y - 1}px`,
                width: `${minBoxWidth + 4}px`,
                height: `${item.height + 2}px`,
              }}
              title={
                isModified
                  ? `Modified: "${item.text}" (Original: "${item.originalText}")`
                  : `Click to edit: "${item.text}" (${item.fontFamily}, ${item.fontSize}pt)`
              }
            >
              {/* MASKING LAYER: Seamlessly covers the original vector text on canvas */}
              {(isActivelyEditing || isModified) && (
                <div
                  className="absolute inset-0 pointer-events-none rounded-[2px]"
                  style={{
                    backgroundColor: item.backgroundColor || '#ffffff',
                    opacity: 1.0,
                  }}
                />
              )}

              {/* IN-PLACE TEXT INPUT OR DISPLAY */}
              {isActivelyEditing ? (
                <div className="relative w-full h-full flex items-center">
                  <input
                    ref={activeInputRef}
                    data-testid="inplace-text-input"
                    aria-label={`Editing text: ${item.originalText}`}
                    type="text"
                    value={item.text}
                    onChange={(e) =>
                      onUpdateTextItem(item.id, {
                        text: e.target.value,
                        isModified: true,
                      })
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        onSelectTextItem(null);
                      } else if (e.key === 'Escape') {
                        onSelectTextItem(null);
                      }
                    }}
                    className="w-full h-full bg-transparent border-0 outline-none p-0 m-0 leading-none select-text"
                    style={{
                      fontFamily: item.fontFamily || 'Helvetica',
                      fontSize: `${item.fontSize}px`,
                      fontWeight: item.fontWeight || 'normal',
                      fontStyle: item.fontStyle || 'normal',
                      color: item.color || '#1e293b',
                    }}
                  />
                </div>
              ) : isModified ? (
                /* Modified text display overlaid on top of background mask */
                <div
                  className="relative w-full h-full flex items-center px-0.5 select-text leading-none cursor-text truncate"
                  style={{
                    fontFamily: item.fontFamily || 'Helvetica',
                    fontSize: `${item.fontSize}px`,
                    fontWeight: item.fontWeight || 'normal',
                    fontStyle: item.fontStyle || 'normal',
                    color: item.color || '#1e293b',
                  }}
                >
                  <span>{item.text}</span>
                  {/* Subtle modified indicator dot */}
                  <span
                    className="absolute -top-1.5 -right-1.5 w-2 h-2 rounded-full bg-emerald-500 shadow"
                    title="Edited"
                  />
                </div>
              ) : null}

              {/* Hover indicator for non-edited text */}
              {isHovered && !isActivelyEditing && !isModified && (
                <div className="absolute -top-6 left-0 pointer-events-none z-50 bg-slate-900/95 text-white text-[10px] px-2 py-0.5 rounded shadow border border-cyan-500/40 whitespace-nowrap flex items-center gap-1">
                  <Pencil className="w-2.5 h-2.5 text-cyan-400" />
                  <span>Click to edit text</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating Action Header Bar over the currently edited text item */}
      {activeEditingItem && (
        <div
          className="absolute z-50 flex items-center bg-slate-900/95 border border-indigo-500/60 text-white rounded-lg shadow-2xl px-2 py-1 space-x-2 select-none animate-in fade-in zoom-in-95 duration-150"
          style={{
            left: `${activeEditingItem.x - 2}px`,
            top: `${Math.max(6, activeEditingItem.y - 36)}px`,
          }}
        >
          <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-indigo-300">
            <Pencil className="w-3 h-3 text-cyan-400" />
            <span>Editing In-Place</span>
          </div>

          <div className="w-px h-3.5 bg-slate-700" />

          <span className="text-[10px] text-slate-300 font-mono">
            {activeEditingItem.fontFamily} • {activeEditingItem.fontSize}pt • {activeEditingItem.fontWeight}
          </span>

          {/* Reset button if modified */}
          {(activeEditingItem.isModified || activeEditingItem.text !== activeEditingItem.originalText) && (
            <>
              <div className="w-px h-3.5 bg-slate-700" />
              <button
                type="button"
                onClick={() => onResetTextItem(activeEditingItem.id)}
                aria-label="Revert to original text"
                className="flex items-center space-x-1 text-[10px] text-amber-300 hover:text-amber-200 hover:bg-amber-500/20 px-1.5 py-0.5 rounded transition-colors"
                title={`Revert back to: "${activeEditingItem.originalText}"`}
              >
                <RotateCcw className="w-3 h-3" />
                <span>Revert</span>
              </button>
            </>
          )}

          <div className="w-px h-3.5 bg-slate-700" />

          {/* Done / Checkmark button */}
          <button
            type="button"
            onClick={() => onSelectTextItem(null)}
            aria-label="Finish editing text"
            className="flex items-center space-x-1 text-[10px] font-semibold text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 px-1.5 py-0.5 rounded transition-colors"
            title="Done"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Done</span>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CUSTOM USER-ADDED ANNOTATIONS (Whiteouts, Highlights, Custom text)    */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {elements
          .filter((el) => el.pageNumber === pageNumber)
          .map((el) => {
            const isSelected = selectedElementId === el.id;
            const isEditing = editingCustomTextId === el.id;

            return (
              <div
                key={el.id}
                data-element-id={el.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectElement(el.id);
                  onSelectTextItem(null);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  onSelectElement(el.id);
                  onSelectTextItem(null);
                  if (el.type === 'text') {
                    setEditingCustomTextId(el.id);
                  }
                }}
                className={`absolute pointer-events-auto group transition-shadow ${
                  isSelected
                    ? 'ring-2 ring-indigo-500 ring-offset-1 shadow-lg'
                    : 'hover:ring-1 hover:ring-indigo-300/60'
                }`}
                style={{
                  left: `${el.x}px`,
                  top: `${el.y}px`,
                  width: `${el.width}px`,
                  height: `${el.height}px`,
                  backgroundColor:
                    el.type === 'whiteout'
                      ? '#ffffff'
                      : el.hasBackgroundFill
                      ? el.backgroundColor || '#ffffff'
                      : el.type === 'highlight'
                      ? el.color || '#fef08a'
                      : 'transparent',
                  opacity: el.opacity ?? (el.type === 'highlight' ? 0.35 : 1.0),
                }}
              >
                {el.type === 'text' ? (
                  <div className="w-full h-full flex flex-col justify-center px-1">
                    {isEditing ? (
                      <textarea
                        autoFocus
                        value={el.text || ''}
                        onChange={(e) => onUpdateElement(el.id, { text: e.target.value })}
                        onBlur={() => setEditingCustomTextId(null)}
                        className="w-full h-full resize-none bg-transparent outline-none p-0 overflow-hidden leading-tight"
                        style={{
                          fontFamily: el.fontFamily || 'Helvetica',
                          fontSize: `${el.fontSize || 14}px`,
                          fontWeight: el.fontWeight || 'normal',
                          fontStyle: el.fontStyle || 'normal',
                          color: el.color || '#1e293b',
                          textAlign: el.textAlign || 'left',
                        }}
                      />
                    ) : (
                      <div
                        className="w-full h-full overflow-hidden leading-tight whitespace-pre-wrap select-text"
                        style={{
                          fontFamily: el.fontFamily || 'Helvetica',
                          fontSize: `${el.fontSize || 14}px`,
                          fontWeight: el.fontWeight || 'normal',
                          fontStyle: el.fontStyle || 'normal',
                          color: el.color || '#1e293b',
                          textAlign: el.textAlign || 'left',
                        }}
                      >
                        {el.text || 'Type text here...'}
                      </div>
                    )}
                  </div>
                ) : el.type === 'whiteout' ? (
                  <div className="w-full h-full border border-dashed border-slate-300/40 flex items-center justify-center">
                    {isSelected && (
                      <span className="text-[9px] text-slate-400 select-none">Whiteout Mask</span>
                    )}
                  </div>
                ) : null}

                {/* Selected Controls Overlay: Floating Action Bar & Resize Handle */}
                {isSelected && (
                  <>
                    <div className="absolute -top-7 left-0 z-30 flex items-center bg-slate-900/95 border border-slate-700 text-white rounded-lg shadow-xl px-1.5 py-0.5 space-x-1.5 select-none">
                      <button
                        type="button"
                        onMouseDown={(e) => handleStartDrag(e, el)}
                        aria-label="Drag to reposition element"
                        className="flex items-center space-x-1 text-[10px] font-medium text-slate-300 hover:text-white cursor-grab active:cursor-grabbing px-1 py-0.5 rounded hover:bg-slate-800"
                        title="Click and drag to reposition"
                      >
                        <Move className="w-3 h-3 text-indigo-400" />
                        <span>Move</span>
                      </button>

                      <div className="w-px h-3 bg-slate-700" />

                      <span className="text-[10px] text-slate-400 font-mono">
                        {el.type === 'text' ? `${el.fontSize || 14}pt` : el.type}
                      </span>

                      <div className="w-px h-3 bg-slate-700" />

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteElement(el.id);
                        }}
                        aria-label="Delete this element"
                        className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 p-0.5 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    <div
                      onMouseDown={(e) => handleStartResize(e, el)}
                      className="absolute -bottom-2 -right-2 w-4 h-4 bg-indigo-600 border-2 border-white rounded-full cursor-nwse-resize shadow-md hover:scale-125 transition-transform"
                      title="Drag to resize"
                    />
                  </>
                )}
              </div>
            );
          })}
      </div>

      {/* SVG Proximity Line Preview for Smart Font Matching when inserting in empty area */}
      {activeTool === 'text' && smartMatchEnabled && hoveredNearest && cursorPos && !activeEditingTextId && (
        <svg
          className="absolute inset-0 pointer-events-none z-10 w-full h-full"
          style={{ width: '100%', height: '100%' }}
        >
          <line
            x1={cursorPos.x}
            y1={cursorPos.y}
            x2={hoveredNearest.sourceBox.x + hoveredNearest.sourceBox.width / 2}
            y2={hoveredNearest.sourceBox.y + hoveredNearest.sourceBox.height / 2}
            stroke="#06b6d4"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            className="animate-pulse opacity-80"
          />
          <rect
            x={hoveredNearest.sourceBox.x - 2}
            y={hoveredNearest.sourceBox.y - 2}
            width={hoveredNearest.sourceBox.width + 4}
            height={hoveredNearest.sourceBox.height + 4}
            fill="#06b6d4"
            fillOpacity="0.15"
            stroke="#06b6d4"
            strokeWidth="1.5"
            rx="3"
          />
        </svg>
      )}

      {/* Layout Regions Layer Toggle */}
      {showLayoutLayer && (
        <div className="absolute inset-0 pointer-events-none z-10">
          {textItems.map((item) => (
            <div
              key={`layout-${item.id}`}
              className="absolute border border-indigo-400/50 bg-indigo-500/10 rounded-[2px]"
              style={{
                left: `${item.x}px`,
                top: `${item.y}px`,
                width: `${item.width}px`,
                height: `${item.height}px`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
