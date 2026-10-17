import React from 'react';
import { FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import type { PageMetadata } from '../types/pdf.ts';

interface PageThumbnailSidebarProps {
  numPages: number;
  currentPage: number;
  onSelectPage: (page: number) => void;
  pagesMetadata: Record<number, PageMetadata>;
  elementCountsByPage: Record<number, number>;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const PageThumbnailSidebar: React.FC<PageThumbnailSidebarProps> = ({
  numPages,
  currentPage,
  onSelectPage,
  pagesMetadata,
  elementCountsByPage,
  collapsed,
  onToggleCollapse,
}) => {
  return (
    <aside
      className={`bg-slate-900 border-r border-slate-800 transition-all duration-200 flex flex-col z-30 shrink-0 ${
        collapsed
          ? 'hidden md:flex md:w-12 md:static'
          : 'absolute md:static top-0 bottom-0 left-0 w-48 md:w-52 shadow-2xl md:shadow-none'
      }`}
    >
      {/* Sidebar Header */}
      <div className="h-12 border-b border-slate-800 px-3 flex items-center justify-between text-xs text-slate-400 font-medium">
        {!collapsed && (
          <span className="flex items-center gap-1.5 font-semibold text-slate-300">
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            Pages ({numPages})
          </span>
        )}
        <button
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand page sidebar' : 'Collapse page sidebar'}
          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white ml-auto"
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Pages List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2.5">
        {Array.from({ length: numPages }).map((_, idx) => {
          const pageNum = idx + 1;
          const isSelected = pageNum === currentPage;
          const editCount = elementCountsByPage[pageNum] || 0;
          const meta = pagesMetadata[pageNum];
          const isLandscape = meta && meta.originalWidth > meta.originalHeight;

          return (
            <button
              key={pageNum}
              onClick={() => onSelectPage(pageNum)}
              aria-label={`Jump to page ${pageNum}`}
              className={`w-full group rounded-xl p-2 flex flex-col items-center transition-all ${
                isSelected
                  ? 'bg-indigo-600/20 border-2 border-indigo-500 shadow-md shadow-indigo-500/10'
                  : 'bg-slate-800/40 border border-slate-800 hover:bg-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Miniature Thumbnail Representation */}
              <div
                className={`relative bg-white rounded shadow-sm flex flex-col justify-between p-1.5 transition-transform group-hover:scale-102 ${
                  collapsed ? 'w-7 h-9' : isLandscape ? 'w-36 h-24' : 'w-28 h-36'
                }`}
              >
                {/* Visual mock lines to represent PDF content */}
                <div className="space-y-1 w-full opacity-30">
                  <div className="h-1 bg-slate-900 rounded w-1/3" />
                  <div className="h-0.5 bg-slate-700 rounded w-full" />
                  <div className="h-0.5 bg-slate-700 rounded w-5/6" />
                  <div className="h-0.5 bg-slate-700 rounded w-2/3" />
                </div>

                {/* Edit badge on thumbnail */}
                {editCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow">
                    {editCount}
                  </span>
                )}
              </div>

              {!collapsed && (
                <div className="w-full flex items-center justify-between mt-2 px-1 text-[11px]">
                  <span
                    className={`font-semibold ${
                      isSelected ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  >
                    Page {pageNum}
                  </span>
                  {editCount > 0 && (
                    <span className="text-[10px] text-emerald-400 font-medium">
                      {editCount} mod{editCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
};
