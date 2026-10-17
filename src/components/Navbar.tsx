import React from 'react';
import {
  FileText,
  Download,
  Upload,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Layers,
  Sparkles,
  Undo2,
  Redo2,
  CheckCircle2,
} from 'lucide-react';

interface NavbarProps {
  fileName: string;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  onFitWidth: () => void;
  showLayoutLayer: boolean;
  onToggleLayoutLayer: () => void;
  onOpenUpload: () => void;
  onExport: () => void;
  isExporting: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  textItemCount: number;
  elementCount: number;
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  fileName,
  zoom,
  onZoomChange,
  onFitWidth,
  showLayoutLayer,
  onToggleLayoutLayer,
  onOpenUpload,
  onExport,
  isExporting,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  textItemCount,
  elementCount,
  onToggleSidebar,
  sidebarCollapsed,
}) => {
  return (
    <header className="h-14 md:h-16 bg-slate-900 border-b border-slate-800 px-2.5 md:px-4 flex items-center justify-between select-none z-20 shadow-md">
      {/* Brand & File Info */}
      <div className="flex items-center space-x-2 md:space-x-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            aria-label="Toggle pages sidebar"
            className="md:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
            title="Pages"
          >
            <FileText className="w-4 h-4 text-indigo-400" />
          </button>
        )}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white shrink-0">
            <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-white text-sm md:text-base tracking-tight">TypoMatch</span>
              <span className="hidden sm:inline text-[10px] md:text-xs px-1.5 py-0.2 md:py-0.5 rounded-full font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                PDF Pro
              </span>
            </div>
            <p className="hidden sm:block text-[10px] md:text-[11px] text-slate-400 font-medium">Smart Font-Matching</p>
          </div>
        </div>

        <div className="hidden lg:flex items-center space-x-2 pl-3 border-l border-slate-800 ml-2">
          <FileText className="w-4 h-4 text-slate-400" />
          <span
            className="text-xs text-slate-200 max-w-[160px] truncate font-medium bg-slate-800/60 px-2 py-1 rounded"
            title={fileName}
          >
            {fileName}
          </span>
          {elementCount > 0 && (
            <span className="text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {elementCount} edit{elementCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Middle: Undo/Redo & Zoom & Layout Toggle */}
      <div className="flex items-center space-x-1 md:space-x-2">
        {/* Undo / Redo */}
        <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700/60">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            aria-label="Undo edit"
            title="Undo (Ctrl+Z)"
            className="p-1 md:p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            aria-label="Redo edit"
            title="Redo (Ctrl+Y)"
            className="p-1 md:p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <Redo2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700/60">
          <button
            onClick={() => onZoomChange(Math.max(0.5, zoom - 0.15))}
            aria-label="Zoom out"
            title="Zoom Out"
            className="p-1 md:p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </button>
          <span className="text-[11px] md:text-xs font-semibold text-slate-200 px-1 md:px-2 min-w-[42px] md:min-w-[48px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => onZoomChange(Math.min(2.5, zoom + 0.15))}
            aria-label="Zoom in"
            title="Zoom In"
            className="p-1 md:p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </button>
          <button
            onClick={onFitWidth}
            aria-label="Fit to width"
            title="Fit Width"
            className="hidden sm:block p-1 md:p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors ml-0.5"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Layout Inspector Layer Toggle */}
        <button
          onClick={onToggleLayoutLayer}
          aria-label="Toggle layout regions"
          className={`flex items-center space-x-1.5 px-2 md:px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            showLayoutLayer
              ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/50 shadow-sm'
              : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-700'
          }`}
          title="Highlight detected text layout regions and typography"
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Layout</span>
          {textItemCount > 0 && (
            <span className="bg-slate-700/80 text-slate-300 text-[10px] px-1.5 py-0.2 rounded-full">
              {textItemCount}
            </span>
          )}
        </button>
      </div>

      {/* Right: Upload & Export */}
      <div className="flex items-center space-x-1.5 md:space-x-2">
        <button
          onClick={onOpenUpload}
          aria-label="Upload or switch document"
          className="flex items-center space-x-1 px-2 md:px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 transition-colors"
        >
          <Upload className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Change Doc</span>
        </button>

        <button
          onClick={onExport}
          disabled={isExporting}
          aria-label="Download modified PDF"
          className="flex items-center space-x-1.5 px-2.5 md:px-3.5 py-1.5 md:py-2 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 active:scale-95 shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
        >
          <Download className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isExporting ? 'animate-bounce' : ''}`} />
          <span>{isExporting ? '...' : 'Export'}</span>
        </button>
      </div>
    </header>
  );
};
