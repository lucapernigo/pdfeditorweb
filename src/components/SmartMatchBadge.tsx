import React from 'react';
import { Sparkles, Check, X } from 'lucide-react';
import type { MatchedStyle } from '../types/pdf.ts';

interface SmartMatchBadgeProps {
  matchedStyle: MatchedStyle | null;
  onDismiss: () => void;
}

export const SmartMatchBadge: React.FC<SmartMatchBadgeProps> = ({
  matchedStyle,
  onDismiss,
}) => {
  if (!matchedStyle) return null;

  return (
    <div className="fixed top-28 right-6 z-40 max-w-sm bg-slate-900/95 border border-cyan-500/50 rounded-2xl shadow-2xl p-3.5 backdrop-blur-md text-white animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h5 className="text-xs font-bold text-cyan-300 tracking-tight flex items-center gap-1.5">
              <span>Smart Font Match Applied</span>
              <span className="text-[10px] bg-cyan-500/20 text-cyan-200 px-1.5 py-0.2 rounded-full border border-cyan-500/30">
                {Math.round(matchedStyle.confidence * 100)}% match
              </span>
            </h5>
            <p className="text-[11px] text-slate-300 truncate max-w-[220px] font-mono mt-0.5">
              "{matchedStyle.sourceText}"
            </p>
          </div>
        </div>
        <button
          onClick={onDismiss}
          aria-label="Dismiss font match notification"
          className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center gap-2 text-[11px] text-slate-200">
        <span className="font-semibold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
          {matchedStyle.fontFamily}
        </span>
        <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
          {matchedStyle.fontSize}pt
        </span>
        <span className="capitalize bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
          {matchedStyle.fontWeight}
        </span>
        <div className="flex items-center gap-1 ml-auto">
          <span
            className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-sm"
            style={{ backgroundColor: matchedStyle.color }}
          />
          <span className="font-mono text-[10px] text-slate-400">{matchedStyle.color}</span>
        </div>
      </div>
    </div>
  );
};
