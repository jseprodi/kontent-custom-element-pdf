import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import type { Annotation } from '../customElement/value';

// Set worker source - use CDN for production, or configure for local build
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

interface PDFViewerProps {
  pdfUrl?: string;
  pdfData?: string; // base64
  annotations: Annotation[];
  onAnnotationAdd?: (annotation: Omit<Annotation, 'id' | 'timestamp'>) => void;
  allowAnnotations?: boolean;
  disabled?: boolean;
}

export function PDFViewer({
  pdfUrl,
  pdfData,
  annotations,
  onAnnotationAdd,
  allowAnnotations = true,
  disabled = false,
}: PDFViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const [pdfDocument, setPdfDocument] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [annotationMode, setAnnotationMode] = useState<'none' | 'text' | 'highlight' | 'drawing'>(
    'none'
  );
  const [drawingPath, setDrawingPath] = useState<Array<{ x: number; y: number }>>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPageNum, setDrawingPageNum] = useState<number>(1);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Load PDF
  useEffect(() => {
    async function loadPDF() {
      if (!pdfUrl && !pdfData) {
        setError('No PDF source provided');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        let loadingTask: pdfjsLib.PDFDocumentLoadingTask;

        if (pdfData) {
          // Convert base64 to Uint8Array
          // Handle both data URL format (data:application/pdf;base64,...) and plain base64
          const base64String = pdfData.includes(',') ? pdfData.split(',')[1] : pdfData;
          const binaryString = atob(base64String);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          loadingTask = pdfjsLib.getDocument({ data: bytes });
        } else if (pdfUrl) {
          loadingTask = pdfjsLib.getDocument({ url: pdfUrl });
        } else {
          throw new Error('No PDF source available');
        }

        const pdf = await loadingTask.promise;
        setPdfDocument(pdf);
        setNumPages(pdf.numPages);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError(err instanceof Error ? err.message : 'Failed to load PDF');
      } finally {
        setLoading(false);
      }
    }

    loadPDF();
  }, [pdfUrl, pdfData]);

  // Render page
  const renderPage = useCallback(
    async (pageNum: number) => {
      if (!pdfDocument) return;

      const canvas = canvasRefs.current.get(pageNum);
      const pageContainer = pageRefs.current.get(pageNum);
      if (!canvas || !pageContainer) return;

      try {
        const page = await pdfDocument.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const context = canvas.getContext('2d');
        if (!context) return;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;

        // Render annotations for this page
        const pageAnnotations = annotations.filter((ann) => ann.page === pageNum);
        renderAnnotations(context, pageAnnotations);
      } catch (err) {
        console.error(`Error rendering page ${pageNum}:`, err);
      }
    },
    [pdfDocument, scale, annotations]
  );

  // Render annotations on canvas
  const renderAnnotations = (
    context: CanvasRenderingContext2D,
    pageAnnotations: Annotation[]
  ) => {
    pageAnnotations.forEach((annotation) => {
      context.save();

      switch (annotation.type) {
        case 'text':
          if (annotation.content && annotation.x !== undefined && annotation.y !== undefined) {
            context.font = '14px Arial';
            context.fillStyle = annotation.color || '#000000';
            context.fillText(annotation.content, annotation.x, annotation.y);
          }
          break;

        case 'highlight':
          if (
            annotation.x !== undefined &&
            annotation.y !== undefined &&
            annotation.width !== undefined &&
            annotation.height !== undefined
          ) {
            context.fillStyle = annotation.color || 'rgba(255, 255, 0, 0.3)';
            context.fillRect(annotation.x, annotation.y, annotation.width, annotation.height);
          }
          break;

        case 'drawing':
          if (annotation.paths && annotation.paths.length > 0) {
            context.strokeStyle = annotation.color || '#000000';
            context.lineWidth = 2;
            context.beginPath();
            annotation.paths.forEach((point, index) => {
              if (index === 0) {
                context.moveTo(point.x, point.y);
              } else {
                context.lineTo(point.x, point.y);
              }
            });
            context.stroke();
          }
          break;
      }

      context.restore();
    });
  };

  // Re-render pages when scale or annotations change
  useEffect(() => {
    if (pdfDocument) {
      for (let i = 1; i <= numPages; i++) {
        renderPage(i);
      }
    }
  }, [pdfDocument, numPages, scale, annotations, renderPage]);

  // Handle canvas click for annotations
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>, pageNum: number) => {
      if (!allowAnnotations || disabled || annotationMode === 'none') return;

      const canvas = e.currentTarget;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (annotationMode === 'text') {
        const content = prompt('Enter text annotation:');
        if (content && onAnnotationAdd) {
          onAnnotationAdd({
            type: 'text',
            page: pageNum,
            x,
            y,
            content,
            color: '#000000',
          });
        }
      } else if (annotationMode === 'highlight') {
        const width = 100;
        const height = 20;
        if (onAnnotationAdd) {
          onAnnotationAdd({
            type: 'highlight',
            page: pageNum,
            x: x - width / 2,
            y: y - height / 2,
            width,
            height,
            color: 'rgba(255, 255, 0, 0.3)',
          });
        }
      }
    },
    [allowAnnotations, disabled, annotationMode, onAnnotationAdd]
  );

  // Handle drawing - mouse down
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>, pageNum: number) => {
      if (!allowAnnotations || disabled || annotationMode !== 'drawing') return;

      const canvas = e.currentTarget;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setIsDrawing(true);
      setDrawingPageNum(pageNum);
      setDrawingPath([{ x, y }]);
    },
    [allowAnnotations, disabled, annotationMode]
  );

  // Handle drawing - mouse move
  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing || !allowAnnotations || disabled) return;

      const canvas = e.currentTarget;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setDrawingPath((prev: Array<{ x: number; y: number }>) => [...prev, { x, y }]);
    },
    [isDrawing, allowAnnotations, disabled]
  );

  // Handle drawing - mouse up
  const handleCanvasMouseUp = useCallback(
    (_e: React.MouseEvent<HTMLCanvasElement>, pageNum: number) => {
      if (!isDrawing || !allowAnnotations || disabled) return;

      setIsDrawing(false);
      if (drawingPath.length > 1 && onAnnotationAdd) {
        // Calculate bounding box for drawing
        const xs = drawingPath.map((p) => p.x);
        const ys = drawingPath.map((p) => p.y);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        onAnnotationAdd({
          type: 'drawing',
          page: drawingPageNum || pageNum,
          x: minX,
          y: minY,
          paths: drawingPath,
          color: '#000000',
        });
      }
      setDrawingPath([]);
      setDrawingPageNum(1);
    },
    [isDrawing, allowAnnotations, disabled, drawingPath, drawingPageNum, onAnnotationAdd]
  );

  if (loading) {
    return (
      <div className="pdf-viewer-loading">
        <p>Loading PDF...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pdf-viewer-error">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (!pdfDocument) {
    return (
      <div className="pdf-viewer-empty">
        <p>No PDF loaded. Please select a PDF asset.</p>
      </div>
    );
  }

  return (
    <div className="pdf-viewer-container" ref={containerRef}>
      <div className="pdf-viewer-controls">
        <div className="pdf-viewer-pagination">
          <button
            onClick={() => setCurrentPage((p: number) => Math.max(1, p - 1))}
            disabled={currentPage === 1 || disabled}
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {numPages}
          </span>
          <button
            onClick={() => setCurrentPage((p: number) => Math.min(numPages, p + 1))}
            disabled={currentPage === numPages || disabled}
          >
            Next
          </button>
        </div>

        <div className="pdf-viewer-zoom">
          <button onClick={() => setScale((s: number) => Math.max(0.5, s - 0.25))} disabled={disabled}>
            -
          </button>
          <span>{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale((s: number) => Math.min(3, s + 0.25))} disabled={disabled}>
            +
          </button>
        </div>

        {allowAnnotations && (
          <div className="pdf-viewer-annotation-tools">
            <button
              className={annotationMode === 'text' ? 'active' : ''}
              onClick={() => setAnnotationMode(annotationMode === 'text' ? 'none' : 'text')}
              disabled={disabled}
            >
              Text
            </button>
            <button
              className={annotationMode === 'highlight' ? 'active' : ''}
              onClick={() =>
                setAnnotationMode(annotationMode === 'highlight' ? 'none' : 'highlight')
              }
              disabled={disabled}
            >
              Highlight
            </button>
            <button
              className={annotationMode === 'drawing' ? 'active' : ''}
              onClick={() => setAnnotationMode(annotationMode === 'drawing' ? 'none' : 'drawing')}
              disabled={disabled}
            >
              Draw
            </button>
          </div>
        )}
      </div>

      <div className="pdf-viewer-pages">
        {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => {
          const isVisible = Math.abs(pageNum - currentPage) <= 1;
          return (
            <div
              key={pageNum}
              ref={(el: HTMLDivElement | null) => {
                if (el) pageRefs.current.set(pageNum, el);
              }}
              className={`pdf-viewer-page ${isVisible ? 'visible' : 'hidden'}`}
            >
              <canvas
                ref={(el: HTMLCanvasElement | null) => {
                  if (el) canvasRefs.current.set(pageNum, el);
                }}
                onClick={(e) => handleCanvasClick(e, pageNum)}
                onMouseDown={(e) => handleCanvasMouseDown(e, pageNum)}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={(e) => handleCanvasMouseUp(e, pageNum)}
                style={{ display: 'block', margin: '0 auto' }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

