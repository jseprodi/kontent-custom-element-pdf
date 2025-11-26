import { useCallback } from 'react';
import { useCustomElementContext } from './CustomElementContext';
import { parseValue, serializeValue, type PDFValue, type Annotation } from './value';
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
    if (!api) return null;

    try {
      const assets = await promptToSelectAssets(api, {
        allowMultiple: false,
        fileType: 'any',
      });

      if (assets.length > 0) {
        return assets[0];
      }
      return null;
    } catch (error) {
      console.error('Error selecting asset:', error);
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

