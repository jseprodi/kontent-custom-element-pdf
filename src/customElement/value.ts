export interface Annotation {
  id: string;
  type: 'text' | 'highlight' | 'drawing' | 'stamp';
  page: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  content?: string;
  color?: string;
  paths?: Array<{ x: number; y: number }>;
  timestamp: number;
}

export interface PDFValue {
  pdfUrl?: string;
  pdfData?: string; // base64 encoded PDF
  annotations: Annotation[];
  version: number;
}

export function parseValue(value: string | null | undefined): PDFValue {
  if (!value) {
    return {
      annotations: [],
      version: 1,
    };
  }

  try {
    const parsed = JSON.parse(value) as PDFValue;
    return {
      annotations: parsed.annotations || [],
      pdfUrl: parsed.pdfUrl,
      pdfData: parsed.pdfData,
      version: parsed.version || 1,
    };
  } catch {
    return {
      annotations: [],
      version: 1,
    };
  }
}

export function serializeValue(value: PDFValue): string {
  return JSON.stringify(value);
}

