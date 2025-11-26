import React, { useState } from 'react';
import { PDFViewer } from './components/PDFViewer';
import {
  useConfig,
  useValue,
  useIsDisabled,
  useSelectPDFAsset,
  useAddAnnotation,
  useUpdateAnnotation,
  useDeleteAnnotation,
} from './customElement/hooks';
import type { PDFValue } from './customElement/value';

export function IntegrationApp() {
  const config = useConfig();
  const [value, setValue] = useValue();
  const disabled = useIsDisabled();
  const selectPDFAsset = useSelectPDFAsset();
  const addAnnotation = useAddAnnotation();
  const updateAnnotation = useUpdateAnnotation();
  const deleteAnnotation = useDeleteAnnotation();

  const [loading, setLoading] = useState(false);

  const allowAnnotations = config.allowAnnotations !== false;

  // Load PDF from asset
  const handleSelectPDF = async () => {
    setLoading(true);
    try {
      const asset = await selectPDFAsset();
      if (asset) {
        // Fetch the PDF and convert to base64
        try {
          const response = await fetch(asset.url);
          const blob = await response.blob();
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = reader.result as string;
            const updatedValue: PDFValue = {
              ...value,
              pdfUrl: asset.url,
              pdfData: base64data,
              version: (value.version || 1) + 1,
            };
            setValue(updatedValue);
            setLoading(false);
          };
          reader.readAsDataURL(blob);
        } catch (error) {
          console.error('Error loading PDF:', error);
          // Fallback to URL only
          const updatedValue: PDFValue = {
            ...value,
            pdfUrl: asset.url,
            version: (value.version || 1) + 1,
          };
          setValue(updatedValue);
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error selecting PDF:', error);
      setLoading(false);
    }
  };

  // Handle annotation operations
  const handleAnnotationAdd = (annotation: Parameters<typeof addAnnotation>[0]) => {
    if (allowAnnotations && !disabled) {
      addAnnotation(annotation);
    }
  };

  const handleAnnotationUpdate = (id: string, updates: Parameters<typeof updateAnnotation>[1]) => {
    if (allowAnnotations && !disabled) {
      updateAnnotation(id, updates);
    }
  };

  const handleAnnotationDelete = (id: string) => {
    if (allowAnnotations && !disabled) {
      deleteAnnotation(id);
    }
  };

  // Get PDF source
  const pdfUrl = value.pdfUrl;
  const pdfData = value.pdfData;

  return (
    <div className="integration-app">
      <div className="integration-app-header">
        <h2>PDF Editor</h2>
        {!pdfUrl && !pdfData && (
          <button
            onClick={handleSelectPDF}
            disabled={disabled || loading}
            className="button button-primary"
          >
            {loading ? 'Loading...' : 'Select PDF Asset'}
          </button>
        )}
        {(pdfUrl || pdfData) && (
          <button
            onClick={handleSelectPDF}
            disabled={disabled || loading}
            className="button button-secondary"
          >
            {loading ? 'Loading...' : 'Change PDF'}
          </button>
        )}
      </div>

      <div className="integration-app-content">
        {(pdfUrl || pdfData) ? (
          <PDFViewer
            pdfUrl={pdfUrl}
            pdfData={pdfData}
            annotations={value.annotations || []}
            onAnnotationAdd={handleAnnotationAdd}
            onAnnotationUpdate={handleAnnotationUpdate}
            onAnnotationDelete={handleAnnotationDelete}
            allowAnnotations={allowAnnotations}
            disabled={disabled}
          />
        ) : (
          <div className="integration-app-empty">
            <p>No PDF selected. Click "Select PDF Asset" to choose a PDF from your assets.</p>
            {config.maxFileSize && (
              <p className="hint">Maximum file size: {config.maxFileSize} MB</p>
            )}
          </div>
        )}
      </div>

      {value.annotations && value.annotations.length > 0 && (
        <div className="integration-app-annotations-list">
          <h3>Annotations ({value.annotations.length})</h3>
          <ul>
            {value.annotations.map((annotation) => (
              <li key={annotation.id}>
                <span className="annotation-type">{annotation.type}</span>
                <span className="annotation-page">Page {annotation.page}</span>
                {annotation.content && (
                  <span className="annotation-content">{annotation.content}</span>
                )}
                {!disabled && (
                  <button
                    onClick={() => handleAnnotationDelete(annotation.id)}
                    className="button button-small"
                  >
                    Delete
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

