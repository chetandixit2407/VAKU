import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  X,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  FileText,
  ShieldCheck,
  Calendar,
  Clock,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  FileSpreadsheet,
  Presentation,
  AlignLeft,
  Copy,
  Check,
} from 'lucide-react';
import type { Candidate, UserRole } from '../types/index.ts';
import { formatDateTime } from '../utils/dateFormatter.ts';
import { authenticatedFetch } from '../utils/apiClient.ts';
import { PdfCanvasViewer } from './PdfCanvasViewer.tsx';

export type DocumentType = 'RESUME';

interface SecureDocumentViewerModalProps {
  candidate: Candidate;
  currentRole: UserRole;
  documentType?: DocumentType | string;
  onClose: () => void;
}

export const SecureDocumentViewerModal: React.FC<SecureDocumentViewerModalProps> = ({
  candidate,
  currentRole,
  onClose,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [documentBlob, setDocumentBlob] = useState<Blob | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const fileName =
    candidate.resumeFileName || `${candidate.fullName.replace(/\s+/g, '_')}_Resume.pdf`;

  const initialMimeType =
    candidate.resumeMimeType || (fileName.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream');

  const [detectedMime, setDetectedMime] = useState<string>(initialMimeType);

  const lowerFileName = fileName.toLowerCase();
  const lowerMime = detectedMime.toLowerCase();

  const isWordDoc =
    lowerFileName.endsWith('.doc') ||
    lowerFileName.endsWith('.docx') ||
    lowerMime.includes('word') ||
    lowerMime.includes('officedocument.wordprocessingml');

  const isExcelDoc =
    lowerFileName.endsWith('.xls') ||
    lowerFileName.endsWith('.xlsx') ||
    lowerMime.includes('excel') ||
    lowerMime.includes('spreadsheetml');

  const isPowerPointDoc =
    lowerFileName.endsWith('.ppt') ||
    lowerFileName.endsWith('.pptx') ||
    lowerMime.includes('powerpoint') ||
    lowerMime.includes('presentationml');

  const isTextDoc =
    lowerFileName.endsWith('.txt') ||
    lowerFileName.endsWith('.csv') ||
    lowerMime.startsWith('text/') ||
    lowerMime.includes('csv');

  const isImage =
    lowerMime.startsWith('image/') ||
    lowerFileName.endsWith('.png') ||
    lowerFileName.endsWith('.jpg') ||
    lowerFileName.endsWith('.jpeg') ||
    lowerFileName.endsWith('.webp') ||
    lowerFileName.endsWith('.gif');

  const isPdf =
    !isWordDoc &&
    !isExcelDoc &&
    !isPowerPointDoc &&
    !isTextDoc &&
    !isImage &&
    (lowerMime === 'application/pdf' || lowerFileName.endsWith('.pdf') || lowerMime.includes('pdf'));

  const formatLabel = isPdf
    ? 'PDF Document'
    : isWordDoc
    ? 'Word Document'
    : isExcelDoc
    ? 'Excel Spreadsheet'
    : isPowerPointDoc
    ? 'PowerPoint Presentation'
    : isTextDoc
    ? lowerFileName.endsWith('.csv') ? 'CSV Data' : 'Text File'
    : isImage
    ? 'Image Asset'
    : 'Business Document';

  const fileSize = candidate.resumeFileSize || '1.4 MB';
  const uploadedAt = candidate.resumeUploadedAt || candidate.createdAt;

  const formattedUpload = formatDateTime(uploadedAt);

  // Authenticated endpoints on the same origin (no Chrome blocking)
  const apiDocEndpoint = `/api/candidates/${candidate.id}/resume?role=${encodeURIComponent(currentRole)}`;

  const downloadEndpoint = `/api/candidates/${candidate.id}/resume/download?role=${encodeURIComponent(currentRole)}`;

  // Fetch document safely as Blob to avoid any cross-origin or top-frame Chrome blocking
  useEffect(() => {
    let active = true;
    let createdUrl: string | null = null;

    async function loadDocumentBlob() {
      setLoading(true);
      setLoadError(null);
      setBlobUrl(null);
      setDocumentBlob(null);
      try {
        const res = await authenticatedFetch(apiDocEndpoint);
        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          const customError = errData?.error;
          if (res.status === 401) {
            throw new Error(customError || 'Unauthorized: Staff authentication required to access this document.');
          }
          if (res.status === 403) {
            throw new Error(customError || 'You do not have permission to view this document.');
          }
          if (res.status === 404) {
            throw new Error(customError || 'Resume document not found for this candidate.');
          }
          if (res.status === 422) {
            throw new Error(customError || 'Resume preview unavailable. The uploaded resume file is missing or corrupted.');
          }
          if (res.status >= 500) {
            throw new Error(customError || 'Unable to load document. Please try again.');
          }
          throw new Error(customError || `Failed to load document (${res.status} ${res.statusText})`);
        }

        const blob = await res.blob();
        const serverMime = res.headers.get('content-type') || blob.type || initialMimeType;

        if (active) {
          setDetectedMime(serverMime);
          setDocumentBlob(blob);
          createdUrl = URL.createObjectURL(blob);
          setBlobUrl(createdUrl);
        }
      } catch (err: any) {
        if (active) {
          console.error('Error fetching document blob:', err);
          setLoadError(err.message || 'Unable to load document. Please try again.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDocumentBlob();

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [apiDocEndpoint]);

  // Load readable text content if document is text or CSV
  useEffect(() => {
    let active = true;
    if (documentBlob && isTextDoc) {
      documentBlob
        .text()
        .then((text) => {
          if (active) setTextContent(text);
        })
        .catch((e) => {
          console.warn('Error reading text document blob', e);
        });
    } else {
      setTextContent(null);
    }
    return () => {
      active = false;
    };
  }, [documentBlob, isTextDoc]);

  // Zoom handlers
  const handleZoomIn = () => setZoomLevel((prev) => Math.min(250, prev + 25));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(50, prev - 25));
  const handleZoomReset = () => setZoomLevel(100);

  // Fullscreen handler
  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {});
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  // Safe client download trigger
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = downloadEndpoint;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyText = () => {
    if (!textContent) return;
    navigator.clipboard.writeText(textContent).then(() => {
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    });
  };

  // Helper for CSV rendering
  const parsedCsvRows = React.useMemo(() => {
    if (!textContent || !lowerFileName.endsWith('.csv')) return null;
    return textContent
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0)
      .slice(0, 200) // Render up to 200 rows cleanly
      .map((line) => line.split(',').map((c) => c.trim().replace(/^["']|["']$/g, '')));
  }, [textContent, lowerFileName]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-4 overflow-hidden">
      <div
        ref={containerRef}
        className={`bg-slate-900 border border-slate-800 rounded-3xl w-full flex flex-col shadow-2xl overflow-hidden text-slate-100 transition-all ${
          isFullscreen ? 'h-screen w-screen max-w-none rounded-none' : 'max-w-5xl h-[94vh]'
        }`}
      >
        {/* Top Control Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          {/* Document Title & Back */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition flex items-center gap-1.5 cursor-pointer text-xs font-semibold shrink-0"
              title="Return to Candidate Profile"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>

            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                  {fileName}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                  Secure Origin
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Candidate: <strong className="text-slate-200">{candidate.fullName}</strong> • Role:{' '}
                <strong className="text-amber-300">{candidate.position}</strong>
              </p>
            </div>
          </div>

          {/* Interactive Zoom & Toolbar Controls */}
          <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2 shrink-0">
            {/* Zoom Controls for PDF and Images */}
            {(isPdf || isImage) && (
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl px-1.5 py-1 text-xs">
                <button
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 50}
                  className="p-1 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer rounded-lg hover:bg-slate-800"
                  title="Zoom Out (-)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={handleZoomReset}
                  className="px-2 text-[11px] font-mono font-bold text-amber-300 hover:text-amber-200 cursor-pointer"
                  title="Click to reset zoom (100%)"
                >
                  {zoomLevel}%
                </button>
                <button
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 250}
                  className="p-1 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer rounded-lg hover:bg-slate-800"
                  title="Zoom In (+)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={handleZoomReset}
                  className="p-1 ml-1 text-slate-500 hover:text-slate-300 cursor-pointer rounded-lg hover:bg-slate-800"
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Page Counter Display for PDF */}
            {isPdf && totalPages > 1 && (
              <div className="hidden md:flex items-center px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-[11px] text-slate-400 font-mono">
                Page <strong className="text-white mx-1">{currentPage}</strong> / {totalPages}
              </div>
            )}

            {/* Copy button for Text documents */}
            {isTextDoc && textContent && (
              <button
                onClick={handleCopyText}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition flex items-center gap-1 cursor-pointer text-xs"
                title="Copy text content to clipboard"
              >
                {copiedText ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span className="hidden sm:inline">{copiedText ? 'Copied' : 'Copy'}</span>
              </button>
            )}

            {/* Fullscreen Toggle */}
            <button
              onClick={handleToggleFullscreen}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen View'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-xl shadow-lg transition flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Download original file"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download</span>
            </button>

            {/* Close Cross */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Close Viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Security & Metadata Sub-header */}
        <div className="px-4 py-2 bg-slate-950/70 border-b border-slate-800 text-xs flex flex-wrap items-center justify-between gap-3 text-slate-400 shrink-0">
          <div className="flex items-center gap-4 flex-wrap text-[11px]">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              Uploaded: <strong className="text-slate-200">{formattedUpload.date}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Time: <strong className="text-slate-200">{formattedUpload.time}</strong>
            </span>
            <span>
              Size: <strong className="text-slate-200">{fileSize}</strong>
            </span>
            <span>
              Format: <strong className="text-slate-200 uppercase">{formatLabel}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Role: <strong className="text-amber-300">{currentRole}</strong></span>
            </span>
          </div>
        </div>

        {/* Document Canvas & Content Region */}
        <div className="flex-1 min-h-0 w-full bg-slate-950 overflow-hidden relative flex flex-col items-stretch justify-start">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-3 py-16">
              <div className="w-10 h-10 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-300 font-medium">Opening Resume...</p>
              <p className="text-[11px] text-slate-500">Decrypting & rendering in-app document pages</p>
            </div>
          ) : loadError ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md my-auto mx-auto">
              <div className="w-12 h-12 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-2xl flex items-center justify-center mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">
                Resume Document Unavailable
              </h3>
              <p className="text-xs text-slate-400 mb-5 leading-relaxed">{loadError}</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Close Viewer
                </button>
                {!loadError.toLowerCase().includes('not found') && (
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> Download Raw Document
                  </button>
                )}
              </div>
            </div>
          ) : isTextDoc ? (
            /* TEXT / CSV IN-APP SCROLLABLE VIEWER */
            <div className="w-full h-full flex-1 min-h-0 overflow-y-auto overflow-x-auto p-4 sm:p-6 flex flex-col items-center">
              <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden my-auto">
                <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <AlignLeft className="w-4 h-4 text-amber-400" />
                    <span className="font-semibold text-white">{fileName}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                      {lowerFileName.endsWith('.csv') ? 'Tabular CSV View' : 'Plain Text'}
                    </span>
                  </div>
                  <span>{textContent ? `${textContent.split('\n').length} lines` : 'Reading content...'}</span>
                </div>

                <div className="p-4 overflow-x-auto max-h-[70vh] overflow-y-auto font-mono text-xs text-slate-200">
                  {parsedCsvRows && parsedCsvRows.length > 0 ? (
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-950/80 sticky top-0">
                          {parsedCsvRows[0].map((header, idx) => (
                            <th key={idx} className="p-2.5 font-bold text-amber-300 text-[11px] uppercase tracking-wider">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {parsedCsvRows.slice(1).map((row, rIdx) => (
                          <tr key={rIdx} className="border-b border-slate-800/60 hover:bg-slate-800/40">
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="p-2 text-slate-300 text-xs">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <pre className="whitespace-pre-wrap leading-relaxed font-mono select-text">
                      {textContent || 'No readable text content found in document.'}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          ) : isWordDoc ? (
            /* MICROSOFT WORD IN-APP PREVIEW CARD (SCROLLABLE ON ALL SCREENS) */
            <div className="w-full h-full flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 flex flex-col items-center justify-center">
              <div className="w-full max-w-2xl my-auto p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-5 shadow-2xl">
                <div className="w-16 h-16 bg-blue-500/15 text-blue-400 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                  <FileCode className="w-8 h-8" />
                </div>

                <div>
                  <span className="px-3 py-1 bg-blue-500/10 text-blue-300 border border-blue-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
                    Microsoft Word Document (.docx / .doc)
                  </span>
                  <h3 className="text-lg font-bold text-white mt-2">{fileName}</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Candidate: <strong className="text-slate-200">{candidate.fullName}</strong> • Size: {fileSize}
                  </p>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-left text-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px] text-slate-400">
                    <span className="font-semibold text-white">Candidate Dossier Summary:</span>
                    <span className="text-emerald-400 font-bold">Verified Storage</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Applied Position:</span>
                      <strong className="text-white">{candidate.position}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Total Experience:</span>
                      <strong className="text-white">{candidate.totalExperience || 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Current Organization:</span>
                      <strong className="text-white">{candidate.currentCompany || 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Highest Qualification:</span>
                      <strong className="text-white">{candidate.qualification || 'Graduate'}</strong>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-900 text-[11px] text-slate-400 italic">
                    Note: Word documents are preserved in their native binary format. You can download the original file to view full formatting, tables, and styles in MS Word or Google Docs.
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
                  <button
                    onClick={handleDownload}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-slate-950 text-xs font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Original DOC/DOCX</span>
                  </button>
                </div>
              </div>
            </div>
          ) : isExcelDoc ? (
            /* MICROSOFT EXCEL IN-APP PREVIEW CARD (SCROLLABLE ON ALL SCREENS) */
            <div className="w-full h-full flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 flex flex-col items-center justify-center">
              <div className="w-full max-w-2xl my-auto p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-5 shadow-2xl">
                <div className="w-16 h-16 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                  <FileSpreadsheet className="w-8 h-8" />
                </div>

                <div>
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
                    Microsoft Excel Spreadsheet (.xlsx / .xls)
                  </span>
                  <h3 className="text-lg font-bold text-white mt-2">{fileName}</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Candidate: <strong className="text-slate-200">{candidate.fullName}</strong> • Size: {fileSize}
                  </p>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-left text-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px] text-slate-400">
                    <span className="font-semibold text-white">Spreadsheet Data Record:</span>
                    <span className="text-emerald-400 font-bold">Verified Storage</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Candidate:</span>
                      <strong className="text-white">{candidate.fullName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Applied Role:</span>
                      <strong className="text-white">{candidate.position}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Uploaded Format:</span>
                      <strong className="text-emerald-400">Microsoft Excel Workbook</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">File Size:</span>
                      <strong className="text-white">{fileSize}</strong>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-900 text-[11px] text-slate-400 italic">
                    Note: Excel workbooks are stored securely in original binary format. Download to open with MS Excel, LibreOffice Calc, or Google Sheets.
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
                  <button
                    onClick={handleDownload}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 text-xs font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Original Excel File</span>
                  </button>
                </div>
              </div>
            </div>
          ) : isPowerPointDoc ? (
            /* MICROSOFT POWERPOINT IN-APP PREVIEW CARD (SCROLLABLE ON ALL SCREENS) */
            <div className="w-full h-full flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 flex flex-col items-center justify-center">
              <div className="w-full max-w-2xl my-auto p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-5 shadow-2xl">
                <div className="w-16 h-16 bg-orange-500/15 text-orange-400 border border-orange-500/30 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                  <Presentation className="w-8 h-8" />
                </div>

                <div>
                  <span className="px-3 py-1 bg-orange-500/10 text-orange-300 border border-orange-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
                    Microsoft PowerPoint Presentation (.pptx / .ppt)
                  </span>
                  <h3 className="text-lg font-bold text-white mt-2">{fileName}</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Candidate: <strong className="text-slate-200">{candidate.fullName}</strong> • Size: {fileSize}
                  </p>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-left text-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px] text-slate-400">
                    <span className="font-semibold text-white">Presentation Portfolio:</span>
                    <span className="text-emerald-400 font-bold">Verified Storage</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Candidate:</span>
                      <strong className="text-white">{candidate.fullName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Applied Role:</span>
                      <strong className="text-white">{candidate.position}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Presentation Type:</span>
                      <strong className="text-orange-400">MS PowerPoint Slides</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">File Size:</span>
                      <strong className="text-white">{fileSize}</strong>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-900 text-[11px] text-slate-400 italic">
                    Note: PowerPoint presentations are stored securely in original binary format. Download to open with MS PowerPoint, Apple Keynote, or Google Slides.
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
                  <button
                    onClick={handleDownload}
                    className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-slate-950 text-xs font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Original Presentation</span>
                  </button>
                </div>
              </div>
            </div>
          ) : isImage && blobUrl ? (
            /* IMAGE PREVIEW CANVAS WITH FULL VERTICAL & HORIZONTAL SCROLL AND ZOOM */
            <div className="flex-1 w-full h-full overflow-y-auto overflow-x-auto p-4 sm:p-6 flex items-center justify-center">
              <div
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.15s ease-out',
                }}
                className="max-w-full flex items-center justify-center"
              >
                <img
                  src={blobUrl}
                  alt={fileName}
                  className="max-h-[78vh] max-w-full object-contain rounded-2xl border border-slate-800 shadow-2xl bg-slate-900"
                />
              </div>
            </div>
          ) : blobUrl || documentBlob ? (
            /* HIGH-FIDELITY IN-APP PDF CANVAS VIEWER (WORKS IN ALL BROWSERS & IFRAMES, FULL VERTICAL SCROLL) */
            <div className="w-full h-full flex-1 flex flex-col min-h-0 overflow-hidden">
              <PdfCanvasViewer
                blob={documentBlob}
                blobUrl={blobUrl}
                zoomLevel={zoomLevel}
                currentPage={currentPage}
                onTotalPagesDetected={setTotalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          ) : null}
        </div>

        {/* Footer Summary Strip */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2 text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Encrypted internal rendering &bull; Audited access logging enforced</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
