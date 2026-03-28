"use client";

import { useState, useCallback, useRef } from 'react';
import { UploadCloud, File, X, CheckCircle2, AlertCircle, Loader2, RefreshCw } from 'lucide-react';

const PROCESSING_STEPS = [
  { id: 'reading',    label: '📄 Reading docs' },
  { id: 'extracting', label: '🤖 AI Extraction' },
  { id: 'mapping',   label: '🗂️ FHIR Mapping' },
  { id: 'done',      label: '✅ Complete' },
];

export default function FileUploadZone({ onExtractionComplete, phase = 'none', contextHistory = null }) {
  const [isDragging, setIsDragging]   = useState(false);
  const [files, setFiles]             = useState([]);
  const [status, setStatus]           = useState('idle'); // idle | processing | success | error
  const [errorMessage, setErrorMessage] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const storedFiles = useRef([]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const runExtraction = async (filesArray) => {
    setStatus('processing');
    setErrorMessage('');
    setCurrentStep(0);

    // Simulate step timing to give feedback
    const stepTimer = (step, delay) =>
      new Promise(res => setTimeout(() => { setCurrentStep(step); res(); }, delay));

    // Fire steps with slight delays for UX even before actual response
    const stepProm = (async () => {
      await stepTimer(1, 600);   // AI Extraction
      await stepTimer(2, 1400);  // FHIR Mapping
    })();

    try {
      const formData = new FormData();
      filesArray.forEach(f => formData.append('documents', f));
      formData.append('phase', phase);
      if (contextHistory) formData.append('contextHistory', JSON.stringify(contextHistory));

      const response = await fetch('/api/ingest', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        const msg = result?.error || `Server error (${response.status})`;
        const det = result?.details ? `\nDetails: ${result.details}` : '';
        throw new Error(msg + det);
      }

      await stepProm;
      setCurrentStep(3); // done
      setStatus('success');

      if (onExtractionComplete) onExtractionComplete(result);

    } catch (err) {
      console.error('Extraction error:', err);
      setStatus('error');
      setErrorMessage(err.message || 'An unexpected error occurred during processing.');
    }
  };

  const processFiles = (selectedFiles) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const newFiles = Array.from(selectedFiles);
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    const invalidFiles = newFiles.filter(f => !validTypes.includes(f.type));

    if (invalidFiles.length > 0) {
      alert(`Unsupported file type: "${invalidFiles[0].name}". Only PDF and images (JPG, PNG, WebP) are accepted.`);
    }

    const validNewFiles = newFiles.filter(f => validTypes.includes(f.type));
    if (validNewFiles.length === 0) return;

    // Accumulate files instead of overwriting
    const updatedFiles = [...files, ...validNewFiles];
    setFiles(updatedFiles);
    storedFiles.current = updatedFiles;
  };

  const removeFile = (indexToRemove) => {
    const updatedFiles = files.filter((_, idx) => idx !== indexToRemove);
    setFiles(updatedFiles);
    storedFiles.current = updatedFiles;
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length > 0) processFiles(e.dataTransfer.files);
  }, []);

  const handleFileInput = (e) => {
    if (e.target.files?.length > 0) processFiles(e.target.files);
  };

  const resetUpload = () => {
    setFiles([]);
    storedFiles.current = [];
    setStatus('idle');
    setErrorMessage('');
    setCurrentStep(0);
    if (onExtractionComplete) onExtractionComplete(null);
  };

  const retryUpload = async () => {
    if (storedFiles.current.length === 0) return;
    setFiles(storedFiles.current);
    await runExtraction(storedFiles.current);
  };

  return (
    <div className="w-full space-y-4">

      {/* ---- Idle: Drop zone ---- */}
      {status === 'idle' && (
        <div className="space-y-4">
          <div
            className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-10 text-center cursor-pointer
              ${isDragging
                ? 'border-blue-400 bg-blue-500/10 scale-[1.02]'
                : 'border-white/15 hover:border-blue-500/50 hover:bg-white/5 glass-panel'}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload').click()}
          >
            <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 mb-5 transition-transform">
              <UploadCloud size={32} />
            </div>
            <h3 className="text-lg font-semibold mb-1">Upload Medical Records</h3>
            <p className="text-slate-400 text-sm max-w-xs">
              Drag & drop PDFs, scans, or handwritten photos (JPG/PNG).<br/>
              <span className="text-slate-500">Multiple files supported.</span>
            </p>
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".pdf,image/png,image/jpeg,image/webp"
              multiple
              onChange={handleFileInput}
            />
          </div>

          {files.length > 0 && (
            <div className="glass-panel p-5 animate-fade-in border-blue-500/20">
              <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <File size={16} className="text-blue-400"/> Selected Documents 
                  <span className="bg-slate-800 text-xs px-2 py-0.5 rounded-full">{files.length}</span>
                </h4>
                <button onClick={resetUpload} className="text-xs text-slate-500 hover:text-red-400 transition-colors">Clear All</button>
              </div>
              <div className="flex flex-col gap-2 mb-5 max-h-[160px] overflow-y-auto pr-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-900/60 border border-white/5 p-2 rounded-lg pl-3 hover:border-white/20 transition-colors group">
                    <span className="text-xs text-slate-300 truncate pr-4">📄 {f.name}</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeFile(i); }} 
                      className="text-slate-500 hover:text-red-400 opacity-50 group-hover:opacity-100 transition-all shrink-0 p-1 bg-black/40 rounded-md"
                      title="Remove file"
                    >
                      <X size={14}/>
                    </button>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => runExtraction(files)}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:scale-[1.01] transition-all"
              >
                Proceed to Processing ({files.length})
              </button>
            </div>
          )}
        </div>
      )}

      {/* ---- Processing / Success / Error ---- */}
      {status !== 'idle' && (
        <div className="glass-panel p-5 relative overflow-hidden">
          {/* Animated progress bar strip */}
          {status === 'processing' && (
            <div className="absolute top-0 left-0 right-0 h-[3px] overflow-hidden rounded-t-xl">
              <div className="h-full w-full animate-shimmer" />
            </div>
          )}

          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-white/10 shrink-0">
                <File className="text-blue-400" size={20} />
              </div>
              <div>
                <p className="font-semibold text-sm leading-tight">
                  {files.length === 1 ? files[0]?.name : `${files.length} Documents`}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {(files.reduce((acc, f) => acc + f.size, 0) / 1024 / 1024).toFixed(2)} MB total
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {status === 'processing' && (
                <span className="flex items-center text-blue-400 text-xs font-medium gap-1.5">
                  <Loader2 size={14} className="animate-spin" />
                  Processing…
                </span>
              )}
              {status === 'success' && (
                <span className="flex items-center text-emerald-400 text-xs font-medium gap-1.5">
                  <CheckCircle2 size={14} />
                  Done
                </span>
              )}
              {status === 'error' && (
                <span className="flex items-center text-red-400 text-xs font-medium gap-1.5">
                  <AlertCircle size={14} />
                  Failed
                </span>
              )}
              <button
                onClick={resetUpload}
                disabled={status === 'processing'}
                title="Clear"
                className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-slate-500 hover:text-white disabled:opacity-40"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* File chips */}
          {files.length > 1 && (
            <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-white/5">
              {files.map((f, i) => (
                <span key={i} className="chip" title={f.name}>
                  📄 {f.name}
                </span>
              ))}
            </div>
          )}

          {/* Step progress track */}
          {(status === 'processing' || status === 'success') && (
            <div className="mt-4 pt-3 border-t border-white/5">
              <div className="flex items-center gap-1 flex-wrap">
                {PROCESSING_STEPS.map((step, idx) => {
                  const isDone   = currentStep > idx;
                  const isActive = currentStep === idx;
                  return (
                    <div key={step.id} className="flex items-center gap-1">
                      <span
                        className={`step-track-item ${isDone ? 'done' : isActive ? 'active' : ''}`}
                      >
                        {isActive && <Loader2 size={11} className="animate-spin" />}
                        {isDone && <CheckCircle2 size={11} />}
                        {!isActive && !isDone && <span className="w-[11px] h-[11px] rounded-full border border-current inline-block" />}
                        {step.label}
                      </span>
                      {idx < PROCESSING_STEPS.length - 1 && (
                        <span className="text-slate-700 text-xs">›</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Error details + Retry */}
          {status === 'error' && (
            <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-400" />
                <p className="leading-snug">{errorMessage}</p>
              </div>
              {storedFiles.current.length > 0 && (
                <button
                  onClick={retryUpload}
                  className="flex items-center gap-1.5 text-xs font-semibold text-red-300 hover:text-white transition-colors mt-1"
                >
                  <RefreshCw size={12} />
                  Retry with same files
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
