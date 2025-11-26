import { useCallback } from 'react';
import { useCustomElementContext } from './CustomElementContext';
import { serializeValue, type PDFValue, type Annotation } from './value';
import { promptToSelectAssets } from './selectors';

export function useConfig() {
  const { config } = useCustomElementContext();
  return config;
}

export function useValue(): [PDFValue, (value: PDFValue) => void] {
  const { value, setValue } = useCustomElementContext();

  const updateValue = useCallback(
    (newValue: PDFValue) => {
      setValue(serializeValue(newValue));
    },
    [setValue]
  );

  return [value, updateValue];
}

export function useIsDisabled() {
  const { disabled } = useCustomElementContext();
  return disabled;
}

export function useEnvironmentId() {
  const { environmentId } = useCustomElementContext();
  return environmentId;
}

export function useItemInfo() {
  const { itemInfo } = useCustomElementContext();
  return itemInfo;
}

export function useVariantInfo() {
  const { variantInfo } = useCustomElementContext();
  return variantInfo;
}

export function useSelectPDFAsset() {
  const { api } = useCustomElementContext();

  return useCallback(async () => {
    if (!api) {
      console.warn('Custom Element API not initialized yet');
      return null;
    }

    // Double-check that we're in a Kontent.ai environment
    if (typeof window === 'undefined' || !window.CustomElement) {
      console.error('Not running in Kontent.ai environment');
      return null;
    }

    try {
      const assets = await promptToSelectAssets(api, {
        allowMultiple: false,
        fileType: 'any',
      });

      if (assets && assets.length > 0) {
        return assets[0];
      }
      return null;
    } catch (error) {
      console.error('Error selecting asset:', error);
      // Don't show error to user if it's just that the method isn't available
      // (might be running outside Kontent.ai)
      if (error instanceof Error && error.message.includes('not available')) {
        console.warn('Asset selection is not available in this context');
      }
      return null;
    }
  }, [api]);
}

export function useAddAnnotation() {
  const [value, setValue] = useValue();

  return useCallback(
    (annotation: Omit<Annotation, 'id' | 'timestamp'>) => {
      const newAnnotation: Annotation = {
        ...annotation,
        id: `annotation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
      };

      const updatedValue: PDFValue = {
        ...value,
        annotations: [...value.annotations, newAnnotation],
        version: (value.version || 1) + 1,
      };

      setValue(updatedValue);
    },
    [value, setValue]
  );
}

export function useUpdateAnnotation() {
  const [value, setValue] = useValue();

  return useCallback(
    (id: string, updates: Partial<Annotation>) => {
      const updatedAnnotations = value.annotations.map((annotation) =>
        annotation.id === id ? { ...annotation, ...updates } : annotation
      );

      const updatedValue: PDFValue = {
        ...value,
        annotations: updatedAnnotations,
        version: (value.version || 1) + 1,
      };

      setValue(updatedValue);
    },
    [value, setValue]
  );
}

export function useDeleteAnnotation() {
  const [value, setValue] = useValue();

  return useCallback(
    (id: string) => {
      const updatedAnnotations = value.annotations.filter(
        (annotation) => annotation.id !== id
      );

      const updatedValue: PDFValue = {
        ...value,
        annotations: updatedAnnotations,
        version: (value.version || 1) + 1,
      };

      setValue(updatedValue);
    },
    [value, setValue]
  );
}

