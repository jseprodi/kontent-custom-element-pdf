import { useState } from 'react';
import { PDFViewer } from './components/PDFViewer';
import {
  useConfig,
  useValue,
  useIsDisabled,
  useSelectPDFAsset,
  useAddAnnotation,
} from './customElement/hooks';
import type { PDFValue } from './customElement/value';

export function IntegrationApp() {
  const config = useConfig();
  const [value, setValue] = useValue();
  const disabled = useIsDisabled();
  const selectPDFAsset = useSelectPDFAsset();
  const addAnnotation = useAddAnnotation();

  const [loading, setLoading] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

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
        // If asset selection failed, show manual input option
        setShowManualInput(true);
      }
    } catch (error) {
      console.error('Error selecting PDF:', error);
      setLoading(false);
      // Show manual input as fallback
      setShowManualInput(true);
    }
  };

  // Load PDF from manual URL
  const handleLoadManualURL = async () => {
    if (!manualUrl.trim()) return;

    setLoading(true);
    try {
      // Validate URL
      try {
        new URL(manualUrl);
      } catch {
        alert('Please enter a valid URL');
        setLoading(false);
        return;
      }

      // Try to fetch and convert to base64
      try {
        const response = await fetch(manualUrl);
        if (!response.ok) throw new Error('Failed to fetch PDF');
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          const updatedValue: PDFValue = {
            ...value,
            pdfUrl: manualUrl,
            pdfData: base64data,
            version: (value.version || 1) + 1,
          };
          setValue(updatedValue);
          setLoading(false);
          setShowManualInput(false);
          setManualUrl('');
        };
        reader.readAsDataURL(blob);
      } catch (error) {
        console.error('Error loading PDF from URL:', error);
        // Fallback to URL only
        const updatedValue: PDFValue = {
          ...value,
          pdfUrl: manualUrl,
          version: (value.version || 1) + 1,
        };
        setValue(updatedValue);
        setLoading(false);
        setShowManualInput(false);
        setManualUrl('');
      }
    } catch (error) {
      console.error('Error loading PDF:', error);
      setLoading(false);
    }
  };

  // Handle annotation operations
  const handleAnnotationAdd = (annotation: Parameters<typeof addAnnotation>[0]) => {
    if (allowAnnotations && !disabled) {
      addAnnotation(annotation);
    }
  };

  // Get PDF source
  const pdfUrl = value.pdfUrl;
  const pdfData = value.pdfData;

  return (
    <div className="integration-app">
      <div className="integration-app-header">
        <h2>PDF Editor</h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {!pdfUrl && !pdfData && (
            <>
              <button
                onClick={handleSelectPDF}
                disabled={disabled || loading}
                className="button button-primary"
              >
                {loading ? 'Loading...' : 'Select PDF Asset'}
              </button>
              {showManualInput && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Enter PDF URL"
                    value={manualUrl}
                    onChange={(e) => setManualUrl(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleLoadManualURL()}
                    disabled={disabled || loading}
                    style={{ padding: '6px 12px', fontSize: '14px', minWidth: '300px' }}
                  />
                  <button
                    onClick={handleLoadManualURL}
                    disabled={disabled || loading || !manualUrl.trim()}
                    className="button button-primary"
                  >
                    Load
                  </button>
                  <button
                    onClick={() => {
                      setShowManualInput(false);
                      setManualUrl('');
                    }}
                    className="button"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </>
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
      </div>

      <div className="integration-app-content">
        {(pdfUrl || pdfData) ? (
          <PDFViewer
            pdfUrl={pdfUrl}
            pdfData={pdfData}
            annotations={value.annotations || []}
            onAnnotationAdd={handleAnnotationAdd}
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
                    onClick={() => {
                      // Delete annotation by filtering it out
                      const updatedAnnotations = value.annotations.filter(
                        (ann) => ann.id !== annotation.id
                      );
                      const updatedValue: PDFValue = {
                        ...value,
                        annotations: updatedAnnotations,
                        version: (value.version || 1) + 1,
                      };
                      setValue(updatedValue);
                    }}
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

