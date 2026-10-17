/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type * as pdfjsLib from 'pdfjs-dist';
import { Navbar } from './components/Navbar.tsx';
import { Toolbar } from './components/Toolbar.tsx';
import { PageThumbnailSidebar } from './components/PageThumbnailSidebar.tsx';
import { PdfCanvasPage } from './components/PdfCanvasPage.tsx';
import { FloatingPropertiesPanel } from './components/FloatingPropertiesPanel.tsx';
import { SmartMatchBadge } from './components/SmartMatchBadge.tsx';
import { UploadModal } from './components/UploadModal.tsx';
import {
  loadPdfFromBytes,
  extractPageTextItems,
  LoadedPdfDoc,
} from './utils/pdfLoader.ts';
import { generateSamplePdf } from './utils/sampleDocuments.ts';
import { exportModifiedPdf, downloadPdfBlob } from './utils/pdfExport.ts';
import type {
  EditorElement,
  ExtractedTextItem,
  MatchedStyle,
  ActiveTool,
  PageMetadata,
} from './types/pdf.ts';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
  Sparkles,
} from 'lucide-react';

export default function App() {
  // Document state
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [loadedDoc, setLoadedDoc] = useState<LoadedPdfDoc | null>(null);
  const [fileName, setFileName] = useState<string>('novasoft_invoice_INV2026.pdf');
  const [currentSampleId, setCurrentSampleId] = useState<string>('invoice');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [numPages, setNumPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Viewport & UI State
  const [zoom, setZoom] = useState<number>(1.15);
  const [activeTool, setActiveTool] = useState<ActiveTool>('select');
  const [smartMatchEnabled, setSmartMatchEnabled] = useState<boolean>(true);
  const [showLayoutLayer, setShowLayoutLayer] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);

  // Layout Text Items & In-Place Editing State
  const [pageTextItems, setPageTextItems] = useState<Record<number, ExtractedTextItem[]>>({});
  const [activeEditingTextId, setActiveEditingTextId] = useState<string | null>(null);
  const [pagesMetadata, setPagesMetadata] = useState<Record<number, PageMetadata>>({});

  // Additional elements (whiteouts, highlights, custom boxes) & History
  const [elements, setElements] = useState<EditorElement[]>([]);
  const [history, setHistory] = useState<EditorElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // Smart Match Notification
  const [activeMatchedStyle, setActiveMatchedStyle] = useState<MatchedStyle | null>(null);

  // Push new state to undo/redo history
  const pushHistory = useCallback(
    (newElements: EditorElement[]) => {
      const nextHistory = history.slice(0, historyIndex + 1);
      nextHistory.push(newElements);
      setHistory(nextHistory);
      setHistoryIndex(nextHistory.length - 1);
    },
    [history, historyIndex]
  );

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setElements(prev);
      setHistoryIndex(historyIndex - 1);
      setSelectedElementId(null);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setElements(next);
      setHistoryIndex(historyIndex + 1);
      setSelectedElementId(null);
    }
  };

  // Load a document from bytes
  const loadDocumentFromBytes = async (bytes: Uint8Array, name: string, sampleId?: string) => {
    setIsLoading(true);
    try {
      const loaded = await loadPdfFromBytes(bytes);
      setPdfBytes(bytes);
      setLoadedDoc(loaded);
      setNumPages(loaded.numPages);
      setCurrentPage(1);
      setFileName(name);
      if (sampleId) setCurrentSampleId(sampleId);

      // Reset editor elements for new doc
      setElements([]);
      setHistory([[]]);
      setHistoryIndex(0);
      setSelectedElementId(null);
      setActiveEditingTextId(null);
      setPageTextItems({});
      setPagesMetadata({});

      // Pre-extract page 1 text items
      const items = await extractPageTextItems(loaded.doc, 1, zoom);
      setPageTextItems((prev) => ({ ...prev, 1: items }));
    } catch (err) {
      console.error('Failed to load PDF document:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load default invoice sample on initial mount
  useEffect(() => {
    async function loadInitial() {
      const sample = await generateSamplePdf('invoice');
      await loadDocumentFromBytes(sample.bytes, sample.filename, 'invoice');
    }
    loadInitial();

    const handleWindowResize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };
    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, []);

  // When current page changes or zoom changes, extract text items for that page if not already loaded
  useEffect(() => {
    if (!loadedDoc) return;
    async function fetchPageText() {
      if (!loadedDoc) return;
      // If we already have items for this page, preserve existing modified items!
      const currentItems = pageTextItems[currentPage];
      if (currentItems && currentItems.some((i) => i.isModified)) {
        return;
      }
      const items = await extractPageTextItems(loadedDoc.doc, currentPage, zoom);
      setPageTextItems((prev) => ({ ...prev, [currentPage]: items }));
    }
    fetchPageText();
  }, [loadedDoc, currentPage, zoom]);

  // Handle uploading custom file
  const handleFileUpload = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    setCurrentSampleId('');
    await loadDocumentFromBytes(bytes, file.name);
  };

  // Handle selecting preset sample
  const handleSelectSample = async (sampleId: string) => {
    const sample = await generateSamplePdf(sampleId);
    await loadDocumentFromBytes(sample.bytes, sample.filename, sampleId);
  };

  // Handlers for in-place text editing
  const handleUpdateTextItems = (page: number, items: ExtractedTextItem[]) => {
    setPageTextItems((prev) => {
      const existing = prev[page] || [];
      // Keep any user edits that happened before sampled colors arrived
      const merged = items.map((newItem) => {
        const found = existing.find((e) => e.id === newItem.id);
        if (found && found.isModified) {
          return { ...newItem, text: found.text, isModified: true };
        }
        return newItem;
      });
      return {
        ...prev,
        [page]: merged,
      };
    });
  };

  const handleSelectTextItem = (id: string | null) => {
    setActiveEditingTextId(id);
    if (id) {
      setSelectedElementId(null);
    }
  };

  const handleUpdateTextItem = (id: string, updated: Partial<ExtractedTextItem>) => {
    setPageTextItems((prev) => {
      const currentList = prev[currentPage] || [];
      const nextList = currentList.map((item) =>
        item.id === id ? { ...item, ...updated, isModified: true } : item
      );
      return {
        ...prev,
        [currentPage]: nextList,
      };
    });
  };

  const handleResetTextItem = (id: string) => {
    setPageTextItems((prev) => {
      const currentList = prev[currentPage] || [];
      const nextList = currentList.map((item) =>
        item.id === id
          ? {
              ...item,
              text: item.originalText,
              isModified: false,
            }
          : item
      );
      return {
        ...prev,
        [currentPage]: nextList,
      };
    });
  };

  // Add new element (e.g. custom text or whiteout)
  const handleAddElement = (newElement: EditorElement, matched?: MatchedStyle | null) => {
    const nextElements = [...elements, newElement];
    setElements(nextElements);
    pushHistory(nextElements);

    if (matched) {
      setActiveMatchedStyle(matched);
      setTimeout(() => {
        setActiveMatchedStyle((cur) => (cur === matched ? null : cur));
      }, 4500);
    }
  };

  const handleUpdateElement = (id: string, updated: Partial<EditorElement>) => {
    const nextElements = elements.map((el) => (el.id === id ? { ...el, ...updated } : el));
    setElements(nextElements);
    pushHistory(nextElements);
  };

  const handleDeleteElement = (id: string) => {
    const nextElements = elements.filter((el) => el.id !== id);
    setElements(nextElements);
    pushHistory(nextElements);
    if (selectedElementId === id) {
      setSelectedElementId(null);
    }
  };

  const handleDuplicateElement = (id: string) => {
    const original = elements.find((el) => el.id === id);
    if (!original) return;

    const duplicated: EditorElement = {
      ...original,
      id: `el-${Date.now()}`,
      x: original.x + 15,
      y: original.y + 15,
    };

    const nextElements = [...elements, duplicated];
    setElements(nextElements);
    pushHistory(nextElements);
    setSelectedElementId(duplicated.id);
  };

  const handleFitWidth = () => {
    const meta = pagesMetadata[currentPage];
    if (meta && meta.originalWidth > 0) {
      const containerWidth = window.innerWidth - (sidebarCollapsed ? 60 : 220) - 80;
      const calculatedZoom = Math.min(2.0, Math.max(0.6, containerWidth / meta.originalWidth));
      setZoom(Number(calculatedZoom.toFixed(2)));
    } else {
      setZoom(1.0);
    }
  };

  // Clear all annotations and reset in-place edits
  const handleClearAnnotations = () => {
    setElements([]);
    pushHistory([]);
    setSelectedElementId(null);
    setActiveEditingTextId(null);

    // Revert all modified text items back to their original text
    setPageTextItems((prev) => {
      const reverted: Record<number, ExtractedTextItem[]> = {};
      for (const [pageStr, items] of Object.entries(prev)) {
        const pageNum = parseInt(pageStr);
        reverted[pageNum] = items.map((i) => ({
          ...i,
          text: i.originalText,
          isModified: false,
        }));
      }
      return reverted;
    });
  };

  // Export modified PDF: bakes both in-place text edits (with masks) and custom elements
  const handleExportPdf = async () => {
    if (!pdfBytes) return;
    setIsExporting(true);
    try {
      const allModifiedTextItems = Object.values(pageTextItems)
        .flat()
        .filter((item) => item.isModified || item.text !== item.originalText);

      const exportedBytes = await exportModifiedPdf(
        pdfBytes,
        elements,
        pagesMetadata,
        allModifiedTextItems
      );
      const downloadName = fileName.replace(/\.pdf$/i, '') + '_edited.pdf';
      downloadPdfBlob(exportedBytes, downloadName);
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Compute total edit count across both in-place text changes and added annotations
  const allModifiedTexts = Object.values(pageTextItems)
    .flat()
    .filter((item) => item.isModified || item.text !== item.originalText);
  const totalEditsCount = allModifiedTexts.length + elements.length;

  const currentTextItems = pageTextItems[currentPage] || [];
  const selectedTextItem = currentTextItems.find((t) => t.id === activeEditingTextId) || null;
  const selectedElement = elements.find((el) => el.id === selectedElementId) || null;

  // Count elements per page for thumbnail badges
  const elementCountsByPage: Record<number, number> = {};
  for (let p = 1; p <= numPages; p++) {
    const pageModifiedCount = (pageTextItems[p] || []).filter(
      (i) => i.isModified || i.text !== i.originalText
    ).length;
    const pageCustomCount = elements.filter((el) => el.pageNumber === p).length;
    elementCountsByPage[p] = pageModifiedCount + pageCustomCount;
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
      {/* Top Main Navigation */}
      <Navbar
        fileName={fileName}
        zoom={zoom}
        onZoomChange={setZoom}
        onFitWidth={handleFitWidth}
        showLayoutLayer={showLayoutLayer}
        onToggleLayoutLayer={() => setShowLayoutLayer(!showLayoutLayer)}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        onExport={handleExportPdf}
        isExporting={isExporting}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        textItemCount={currentTextItems.length}
        elementCount={totalEditsCount}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        sidebarCollapsed={sidebarCollapsed}
      />

      {/* Editing Toolbar */}
      <Toolbar
        activeTool={activeTool}
        onSelectTool={setActiveTool}
        smartMatchEnabled={smartMatchEnabled}
        onToggleSmartMatch={() => setSmartMatchEnabled(!smartMatchEnabled)}
        onLoadSample={handleSelectSample}
        onClearAnnotations={handleClearAnnotations}
        elementCount={totalEditsCount}
        currentSampleId={currentSampleId}
      />

      {/* Main Workspace: Sidebar + Scrollable Document Canvas */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Thumbnail Drawer */}
        <PageThumbnailSidebar
          numPages={numPages}
          currentPage={currentPage}
          onSelectPage={setCurrentPage}
          pagesMetadata={pagesMetadata}
          elementCountsByPage={elementCountsByPage}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Center PDF Viewer Canvas Scroll Area */}
        <main
          className="flex-1 bg-slate-950 overflow-auto relative p-6 flex flex-col items-center"
          data-testid="pdf-workspace"
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-3">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
              <p className="text-sm font-medium text-slate-300">Rendering document & parsing vector text...</p>
            </div>
          ) : loadedDoc ? (
            <div className="flex flex-col items-center">
              {/* Active Page Canvas */}
              <PdfCanvasPage
                pdfDoc={loadedDoc.doc}
                pageNumber={currentPage}
                zoom={zoom}
                activeTool={activeTool}
                smartMatchEnabled={smartMatchEnabled}
                showLayoutLayer={showLayoutLayer}
                textItems={currentTextItems}
                onUpdateTextItems={handleUpdateTextItems}
                activeEditingTextId={activeEditingTextId}
                onSelectTextItem={handleSelectTextItem}
                onUpdateTextItem={handleUpdateTextItem}
                onResetTextItem={handleResetTextItem}
                elements={elements}
                selectedElementId={selectedElementId}
                onSelectElement={setSelectedElementId}
                onAddElement={handleAddElement}
                onUpdateElement={handleUpdateElement}
                onDeleteElement={handleDeleteElement}
                onPageRendered={(meta) =>
                  setPagesMetadata((prev) => ({ ...prev, [meta.pageNumber]: meta }))
                }
              />

              {/* Bottom Pagination Bar */}
              {numPages > 1 && (
                <div className="sticky bottom-4 z-20 bg-slate-900/90 backdrop-blur border border-slate-700/80 rounded-xl px-3 py-1.5 flex items-center space-x-3 shadow-xl">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage <= 1}
                    aria-label="Previous page"
                    className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="text-xs font-semibold text-slate-300">
                    Page {currentPage} of {numPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
                    disabled={currentPage >= numPages}
                    aria-label="Next page"
                    className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </main>
      </div>

      {/* Floating Property Inspector when text or custom element is selected */}
      <FloatingPropertiesPanel
        element={selectedElement}
        textItem={selectedTextItem}
        onUpdateElement={(updated) => {
          if (selectedElementId) {
            handleUpdateElement(selectedElementId, updated);
          }
        }}
        onDeleteElement={handleDeleteElement}
        onDuplicateElement={handleDuplicateElement}
        onUpdateTextItem={(updated) => {
          if (activeEditingTextId) {
            handleUpdateTextItem(activeEditingTextId, updated);
          }
        }}
        onResetTextItem={() => {
          if (activeEditingTextId) {
            handleResetTextItem(activeEditingTextId);
          }
        }}
        onClose={() => {
          setSelectedElementId(null);
          setActiveEditingTextId(null);
        }}
      />

      {/* Smart Match Toast Notification */}
      <SmartMatchBadge
        matchedStyle={activeMatchedStyle}
        onDismiss={() => setActiveMatchedStyle(null)}
      />

      {/* Upload & Template Selector Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onFileUpload={handleFileUpload}
        onSelectSample={handleSelectSample}
      />
    </div>
  );
}
