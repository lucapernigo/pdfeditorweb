import React, { useRef, useState } from 'react';
import {
  Upload,
  FileText,
  FileCheck2,
  X,
  FileSpreadsheet,
  Award,
  ShieldAlert,
  ArrowRight,
  FilePlus2,
} from 'lucide-react';
import { SAMPLE_DOCUMENTS } from '../utils/sampleDocuments.ts';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileUpload: (file: File) => void;
  onSelectSample: (sampleId: string) => void;
  isInitialLoad?: boolean;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onFileUpload,
  onSelectSample,
  isInitialLoad = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setErrorMsg('Please upload a valid PDF document (.pdf)');
      return;
    }
    setErrorMsg(null);
    onFileUpload(file);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Upload or select PDF document"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative">
        {/* Close Button */}
        {!isInitialLoad && (
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="text-center max-w-md mx-auto mb-6">
          <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3 text-indigo-400">
            <Upload className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Open or Upload PDF</h2>
          <p className="text-xs text-slate-400 mt-1">
            Choose a PDF from your computer or test immediately with our pre-built sample templates.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Drag & Drop Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-indigo-500 bg-indigo-500/10 scale-101'
              : 'border-slate-700/80 bg-slate-800/40 hover:bg-slate-800/80 hover:border-indigo-500/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />
          <FilePlus2 className="w-10 h-10 text-indigo-400 mx-auto mb-2 opacity-80" />
          <p className="text-sm font-semibold text-slate-200">
            Click to upload or drag & drop a PDF
          </p>
          <p className="text-xs text-slate-400 mt-1">Supports multi-page contracts, invoices, forms & letters</p>
        </div>

        {/* Or choose sample */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Or Try A Ready Sample Document
            </span>
            <span className="text-[11px] text-slate-500">1-Click Instant Preview</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {SAMPLE_DOCUMENTS.map((sample) => {
              const icon =
                sample.id === 'contract' ? (
                  <FileCheck2 className="w-4 h-4 text-emerald-400" />
                ) : sample.id === 'certificate' ? (
                  <Award className="w-4 h-4 text-amber-400" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
                );

              return (
                <button
                  key={sample.id}
                  onClick={() => {
                    onSelectSample(sample.id);
                    onClose();
                  }}
                  aria-label={`Select sample ${sample.title}`}
                  className="group bg-slate-800/50 hover:bg-indigo-600/10 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-3.5 text-left transition-all hover:scale-102 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center">
                        {icon}
                      </div>
                      <span className="text-[10px] font-medium bg-slate-700/60 text-slate-300 px-2 py-0.5 rounded-full">
                        {sample.badge}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {sample.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {sample.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-medium text-indigo-400">
                    <span>Load Template</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
