import React from 'react';
import {
  MousePointer,
  Type,
  Eraser,
  Highlighter,
  Sparkles,
  FileSpreadsheet,
  Trash2,
  FileCheck2,
  FileSignature,
  Award,
} from 'lucide-react';
import type { ActiveTool } from '../types/pdf.ts';

interface ToolbarProps {
  activeTool: ActiveTool;
  onSelectTool: (tool: ActiveTool) => void;
  smartMatchEnabled: boolean;
  onToggleSmartMatch: () => void;
  onLoadSample: (sampleId: string) => void;
  onClearAnnotations: () => void;
  elementCount: number;
  currentSampleId?: string;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  onSelectTool,
  smartMatchEnabled,
  onToggleSmartMatch,
  onLoadSample,
  onClearAnnotations,
  elementCount,
  currentSampleId,
}) => {
  return (
    <div className="bg-slate-900/95 backdrop-blur border-b border-slate-800 px-3 md:px-4 py-1.5 md:py-2 flex items-center justify-between gap-2 z-10 overflow-x-auto no-scrollbar">
      {/* Primary Tools */}
      <div className="flex items-center space-x-1 md:space-x-1.5 shrink-0">
        <button
          onClick={() => onSelectTool('select')}
          aria-label="Direct in-place text editor tool"
          className={`flex items-center space-x-1.5 md:space-x-2 px-2.5 md:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTool === 'select'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="Click any existing text on the document to edit it directly in place"
        >
          <MousePointer className="w-3.5 h-3.5 md:w-4 md:h-4 text-cyan-300" />
          <span>Edit In-Place</span>
        </button>

        <button
          onClick={() => onSelectTool('text')}
          aria-label="Insert new text box tool"
          className={`flex items-center space-x-1.5 md:space-x-2 px-2.5 md:px-3 py-1.5 rounded-lg text-xs font-medium transition-all relative ${
            activeTool === 'text'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="Click empty document area to insert a new text box"
        >
          <Type className="w-3.5 h-3.5 md:w-4 md:h-4 text-indigo-300" />
          <span>Add Text</span>
        </button>

        <button
          onClick={() => onSelectTool('whiteout')}
          aria-label="Whiteout eraser tool"
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTool === 'whiteout'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="Click or drag to whiteout / redact existing document content"
        >
          <Eraser className="w-4 h-4 text-amber-300" />
          <span>Whiteout / Erase</span>
        </button>

        <button
          onClick={() => onSelectTool('highlight')}
          aria-label="Highlighter tool"
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTool === 'highlight'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title="Highlight document regions"
        >
          <Highlighter className="w-4 h-4 text-yellow-300" />
          <span>Highlight</span>
        </button>

        {/* Smart Font Match Toggle */}
        <div className="h-6 w-px bg-slate-800 mx-2" />

        <button
          onClick={onToggleSmartMatch}
          aria-label="Toggle smart font matching"
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            smartMatchEnabled
              ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300'
              : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
          }`}
          title="When enabled, newly placed text automatically adopts font, size, weight, and color of nearest text block"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Auto Font Match</span>
          <span
            className={`w-2 h-2 rounded-full ${
              smartMatchEnabled ? 'bg-cyan-400' : 'bg-slate-500'
            }`}
          />
        </button>
      </div>

      {/* Right Presets & Quick Actions */}
      <div className="flex items-center space-x-2">
        {/* Sample Docs Pill Group */}
        <div className="flex items-center space-x-1 bg-slate-800/90 rounded-lg p-1 border border-slate-700/60 text-xs">
          <span className="text-[11px] text-slate-400 px-2 font-medium flex items-center gap-1">
            <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
            Samples:
          </span>
          <button
            onClick={() => onLoadSample('invoice')}
            aria-label="Load invoice sample"
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              currentSampleId === 'invoice'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
            title="Professional Service Invoice"
          >
            Invoice
          </button>
          <button
            onClick={() => onLoadSample('contract')}
            aria-label="Load contract sample"
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              currentSampleId === 'contract'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
            title="Independent Contractor Agreement"
          >
            Contract
          </button>
          <button
            onClick={() => onLoadSample('certificate')}
            aria-label="Load certificate sample"
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              currentSampleId === 'certificate'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
            title="Honorary Certificate"
          >
            Certificate
          </button>
        </div>

        {/* Clear Annotations */}
        {elementCount > 0 && (
          <button
            onClick={onClearAnnotations}
            aria-label="Clear all annotations"
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-colors"
            title="Remove all added text, whiteout, and highlight annotations"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reset Edits</span>
          </button>
        )}
      </div>
    </div>
  );
};
