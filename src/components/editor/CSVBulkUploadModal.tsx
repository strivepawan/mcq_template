import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  FileText,
  Layers,
  Sparkles,
  ArrowRight,
  HelpCircle
} from 'lucide-react';
import { csvParserService } from '../../services/csvParserService';
import { CSVImportResult, ParsedMCQRow } from '../../types/mcq';
import { useProjectStore } from '../../store/useProjectStore';

interface CSVBulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CSVBulkUploadModal: React.FC<CSVBulkUploadModalProps> = ({
  isOpen,
  onClose
}) => {
  const { currentProject, bulkAddMcqs } = useProjectStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pasteText, setPasteText] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [importResult, setImportResult] = useState<CSVImportResult | null>(null);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !currentProject) return null;

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        const result = csvParserService.parseMCQCSV(text, file.name);
        setImportResult(result);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.csv') || file.type === 'text/csv' || file.type.includes('text')) {
        handleFile(file);
      }
    }
  };

  const handlePasteSubmit = () => {
    if (!pasteText.trim()) return;
    const result = csvParserService.parseMCQCSV(pasteText, 'pasted_questions.csv');
    setImportResult(result);
  };

  const handleConfirmImport = async () => {
    if (!importResult || importResult.validCount === 0) return;
    setIsProcessing(true);

    try {
      const newItems = csvParserService.parsedRowsToMCQItems(
        importResult.rows,
        currentProject.id,
        true
      );

      await bulkAddMcqs(newItems, importMode);
      onClose();
      // Reset state
      setImportResult(null);
      setPasteText('');
    } catch (err) {
      console.error('Failed to import MCQs:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[90vh] bg-[#0f1422] border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>Bulk CSV Question Importer</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  English & हिंदी
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Upload multiple questions at once from Excel/Google Sheets to create multi-question video reels
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {!importResult ? (
            <>
              {/* Sample Template Downloads Section */}
              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-indigo-200 block">
                      Need standard CSV template formatting?
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Download our ready-made CSV template with sample questions to fill in your data.
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => csvParserService.downloadSampleCSV('en')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-400" />
                    <span>English Sample</span>
                  </button>

                  <button
                    onClick={() => csvParserService.downloadSampleCSV('hi')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>हिंदी Sample</span>
                  </button>
                </div>
              </div>

              {/* Tabs: Upload File vs Paste CSV */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                    activeTab === 'upload'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload .CSV File</span>
                </button>

                <button
                  onClick={() => setActiveTab('paste')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                    activeTab === 'paste'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Direct Paste Raw Text</span>
                </button>
              </div>

              {activeTab === 'upload' ? (
                /* Drag and drop box */
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-10 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
                    dragOver
                      ? 'border-indigo-500 bg-indigo-950/40 ring-4 ring-indigo-500/20'
                      : 'border-slate-700 hover:border-indigo-500/60 bg-slate-900/40 hover:bg-slate-900/70'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv,text/plain"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleFile(e.target.files[0]);
                      }
                    }}
                  />
                  <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                    <UploadCloud className="w-8 h-8 animate-pulse" />
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-bold text-slate-200 block">
                      Click to browse or drag and drop your CSV file here
                    </span>
                    <span className="text-xs text-slate-500 mt-1 block">
                      Supports comma-separated files from Google Sheets, Excel, or CSV exports
                    </span>
                  </div>
                </div>
              ) : (
                /* Paste raw CSV content */
                <div className="flex flex-col gap-3">
                  <textarea
                    rows={8}
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder="Paste CSV contents here, e.g.:
Question,Option A,Option B,Option C,Option D,Correct Answer,Explanation
What is the largest ocean?,Pacific,Atlantic,Indian,Arctic,A,Pacific is the largest."
                    className="w-full p-4 rounded-2xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                  <button
                    onClick={handlePasteSubmit}
                    disabled={!pasteText.trim()}
                    className="self-end px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-md transition"
                  >
                    Parse Questions
                  </button>
                </div>
              )}
            </>
          ) : (
            /* CSV Preview and Validation Results */
            <div className="flex flex-col gap-5">
              {/* Summary Stats Card */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
                  <div>
                    <span className="text-xs font-extrabold text-white block">
                      {importResult.fileName}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Total Parsed: {importResult.totalParsed} questions
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{importResult.validCount} Valid</span>
                  </div>

                  {importResult.invalidCount > 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-400 text-xs font-bold">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>{importResult.invalidCount} Errors</span>
                    </div>
                  )}

                  <button
                    onClick={() => setImportResult(null)}
                    className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                  >
                    Change File
                  </button>
                </div>
              </div>

              {/* Table preview */}
              <div className="border border-slate-800 rounded-2xl overflow-hidden max-h-72 overflow-y-auto bg-slate-950/50">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-900/90 sticky top-0 border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider font-bold">
                    <tr>
                      <th className="p-3 w-12 text-center">#</th>
                      <th className="p-3 w-16 text-center">Status</th>
                      <th className="p-3">Question</th>
                      <th className="p-3">Options (A, B, C, D)</th>
                      <th className="p-3 w-16 text-center">Correct</th>
                      <th className="p-3">Explanation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {importResult.rows.map((row) => (
                      <tr
                        key={row.index}
                        className={`hover:bg-slate-900/40 transition ${
                          !row.isValid ? 'bg-rose-950/10' : ''
                        }`}
                      >
                        <td className="p-3 text-center text-slate-500 font-mono">
                          {row.index}
                        </td>
                        <td className="p-3 text-center">
                          {row.isValid ? (
                            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400" title="Valid MCQ" />
                          ) : (
                            <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500" title={row.errors.join(', ')} />
                          )}
                        </td>
                        <td className="p-3 font-semibold text-slate-200 max-w-xs truncate">
                          {row.question || <span className="text-rose-400 italic">Empty Question</span>}
                        </td>
                        <td className="p-3 text-slate-400 max-w-xs truncate text-[11px]">
                          A: {row.options[0]} | B: {row.options[1]} | C: {row.options[2]} | D: {row.options[3]}
                        </td>
                        <td className="p-3 text-center font-bold text-indigo-400">
                          {row.correctAnswer}
                        </td>
                        <td className="p-3 text-slate-400 max-w-xs truncate text-[11px]">
                          {row.explanation || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Import Mode Options */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <span className="text-xs font-bold text-slate-300">
                  Select how to add these questions to "{currentProject.name}":
                </span>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="append"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700"
                    />
                    <span>Append to existing ({currentProject.mcqItems.length})</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700"
                    />
                    <span>Replace all existing questions</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
          >
            Cancel
          </button>

          {importResult && (
            <button
              onClick={handleConfirmImport}
              disabled={importResult.validCount === 0 || isProcessing}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-black shadow-lg shadow-indigo-600/30 transition transform active:scale-95"
            >
              <span>
                {isProcessing
                  ? 'Importing...'
                  : `Import ${importResult.validCount} Questions`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
