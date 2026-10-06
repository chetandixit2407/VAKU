import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { AlertCircle, RefreshCw } from 'lucide-react';

// Configure PDF.js worker using native Vite bundled asset or same-origin fallback
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker || '/pdfjs/pdf.worker.min.mjs';
  } catch (e) {
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';
    } catch {
      console.warn('PDF.js worker configuration error', e);
    }
  }
}

interface PdfCanvasViewerProps {
  blob: Blob | null;
  blobUrl: string | null;
  zoomLevel: number;
  currentPage: number;
  onTotalPagesDetected?: (pages: number) => void;
  onPageChange?: (page: number) => void;
}

interface PdfPageProps {
  pageNum: number;
  doc: pdfjsLib.PDFDocumentProxy;
  zoomLevel: number;
}

const PdfPage: React.FC<PdfPageProps> = ({ pageNum, doc, zoomLevel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);

  useEffect(() => {
    let isCancelled = false;

    async function draw() {
      if (!canvasRef.current || !doc) return;

      try {
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch {}
          renderTaskRef.current = null;
        }

        const page = await doc.getPage(pageNum);
        if (isCancelled || !canvasRef.current) return;

        const pixelRatio = Math.max(window.devicePixelRatio || 1, 2);
        const scale = (zoomLevel / 100) * 1.25;
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.maxWidth = '100%';
        canvas.style.height = 'auto';

        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        const renderTask = page.render({
          canvasContext: context,
          viewport,
        } as any);

        renderTaskRef.current = renderTask;
        await renderTask.promise;
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.warn(`[PDF Page ${pageNum} render error]`, err?.message || err);
        }
      }
    }

    draw();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {}
        renderTaskRef.current = null;
      }
    };
  }, [pageNum, doc, zoomLevel]);

  return (
    <div className="relative shadow-2xl rounded-xl overflow-hidden bg-white border border-slate-700/60 transition-all shrink-0">
      <div className="absolute top-2 right-2 z-10 px-2.5 py-0.5 rounded-md bg-slate-950/85 backdrop-blur-xs text-[10px] font-mono text-slate-300 font-bold border border-slate-800 pointer-events-none">
        Page {pageNum} of {doc.numPages}
      </div>
      <canvas ref={canvasRef} className="block max-w-full h-auto" />
    </div>
  );
};

export const PdfCanvasViewer: React.FC<PdfCanvasViewerProps> = ({
  blob,
  blobUrl,
  zoomLevel,
  currentPage: _currentPage,
  onTotalPagesDetected,
  onPageChange,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(1);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Load PDF Document Proxy from Blob or BlobUrl
  useEffect(() => {
    let active = true;
    if (!blob && !blobUrl) return;

    setLoading(true);
    setError(null);

    async function loadPdf() {
      try {
        let data: ArrayBuffer;
        if (blob) {
          data = await blob.arrayBuffer();
        } else if (blobUrl) {
          const res = await fetch(blobUrl);
          data = await res.arrayBuffer();
        } else {
          throw new Error('No PDF source provided.');
        }

        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(data),
          cMapPacked: true,
        });

        const doc = await loadingTask.promise;
        if (!active) return;

        setPdfDoc(doc);
        setNumPages(doc.numPages);
        if (onTotalPagesDetected) {
          onTotalPagesDetected(doc.numPages);
        }
        setLoading(false);
      } catch (err: any) {
        if (!active) return;
        console.warn('[PDF.js Canvas Renderer]', err?.message || err);
        setError(err?.message || 'Could not parse PDF document.');
        setLoading(false);
      }
    }

    loadPdf();

    return () => {
      active = false;
    };
  }, [blob, blobUrl]);

  // Track page scroll to update active page counter
  const handleScroll = () => {
    if (!containerRef.current || !onPageChange) return;
    const containerTop = containerRef.current.scrollTop;
    const children = containerRef.current.children;

    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement;
      if (child.offsetTop + child.offsetHeight / 2 >= containerTop) {
        onPageChange(i + 1);
        break;
      }
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-400 mb-3" />
        <p className="text-xs font-semibold text-slate-300">Opening PDF Document Pages...</p>
        <p className="text-[11px] text-slate-500 mt-1">Direct high-fidelity canvas rendering</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="p-8 bg-slate-900 rounded-2xl border border-slate-800 max-w-md shadow-2xl">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-white mb-1">Document Preview Unavailable</h4>
          <p className="text-xs text-slate-400 mb-4">{error}</p>
          <p className="text-[11px] text-slate-500">
            Please use the Download button above to view this document in your local PDF viewer.
          </p>
        </div>
      </div>
    );
  }

  if (!pdfDoc) return null;

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="w-full h-full overflow-y-auto overflow-x-hidden flex flex-col items-center py-6 px-4 space-y-6 scroll-smooth"
      style={{
        maxHeight: '100%',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {Array.from({ length: numPages }, (_, index) => {
        const pageNum = index + 1;
        return (
          <PdfPage
            key={pageNum}
            pageNum={pageNum}
            doc={pdfDoc}
            zoomLevel={zoomLevel}
          />
        );
      })}
    </div>
  );
};
