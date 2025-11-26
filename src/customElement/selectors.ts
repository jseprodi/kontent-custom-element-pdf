import type { CustomElementApi, ElementValue } from './types/customElement';

export function getValue(api: CustomElementApi): string {
  return api.getValue();
}

export function setValue(api: CustomElementApi, value: string): void {
  if (api && typeof api.setValue === 'function') {
    api.setValue(value);
  } else {
    console.warn('setValue method not available on Custom Element API');
  }
}

export function setHeight(api: CustomElementApi, height: number | 'default' | 'dynamic'): void {
  if (api && typeof api.setHeight === 'function') {
    api.setHeight(height);
  } else {
    console.warn('setHeight method not available on Custom Element API');
  }
}

export function onDisabledChanged(
  api: CustomElementApi,
  callback: (disabled: boolean) => void
): void {
  api.onDisabledChanged(callback);
}

export async function promptToSelectAssets(
  _api: CustomElementApi,
  options: {
    allowMultiple?: boolean;
    fileType?: 'images' | 'any';
  } = {}
): Promise<Array<{ id: string; url: string; name: string }>> {
  return new Promise((resolve, reject) => {
    // Check if we're in a Kontent.ai environment
    if (typeof window === 'undefined' || !window.CustomElement) {
      reject(new Error('Custom Element API not available'));
      return;
    }

    const customElement = window.CustomElement as any;
    
    // Try different possible method names - check both on CustomElement and as static methods
    const selectMethod = customElement.getSelectAsset || 
                        customElement.selectAsset || 
                        (customElement as any).getAssets ||
                        (window as any).CustomElement?.getSelectAsset ||
                        (window as any).CustomElement?.selectAsset;

    if (!selectMethod || typeof selectMethod !== 'function') {
      reject(new Error('Asset selection method not available. Make sure you are using this custom element within Kontent.ai.'));
      return;
    }

    try {
      // Kontent.ai Custom Element API pattern: method(options, successCallback, errorCallback)
      // Try calling directly first, then with .call() if needed
      if (typeof selectMethod === 'function') {
        selectMethod(
          {
            allowMultiple: options.allowMultiple ?? false,
            fileType: options.fileType ?? 'any',
          },
          (assets: Array<{ id: string; url: string; name: string }>) => {
            if (Array.isArray(assets) && assets.length > 0) {
              resolve(assets);
            } else {
              resolve([]);
            }
          },
          (error: Error | string) => {
            reject(new Error(typeof error === 'string' ? error : error.message || 'Failed to select asset'));
          }
        );
      } else {
        reject(new Error('Asset selection method is not a function'));
      }
    } catch (error) {
      reject(error instanceof Error ? error : new Error('Unknown error selecting asset'));
    }
  });
}

export async function promptToSelectItems(
  _api: CustomElementApi,
  options: {
    allowMultiple?: boolean;
    contentTypes?: Array<{ id: string } | { codename: string }>;
  } = {}
): Promise<Array<{ id: string; codename: string; name: string }>> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.CustomElement) {
      reject(new Error('Custom Element API not available'));
      return;
    }

    const customElement = window.CustomElement as any;
    const selectMethod = customElement.getSelectItems || 
                        customElement.selectItems ||
                        (customElement as any).getItems;

    if (!selectMethod || typeof selectMethod !== 'function') {
      reject(new Error('Item selection method not available'));
      return;
    }

    try {
      selectMethod.call(
        customElement,
        {
          allowMultiple: options.allowMultiple ?? false,
          contentTypes: options.contentTypes ?? [],
        },
        (items: Array<{ id: string; codename: string; name: string }>) => {
          resolve(Array.isArray(items) ? items : []);
        },
        (error: Error | string) => {
          reject(new Error(typeof error === 'string' ? error : error.message || 'Failed to select items'));
        }
      );
    } catch (error) {
      reject(error instanceof Error ? error : new Error('Unknown error selecting items'));
    }
  });
}

export function getElements(
  _api: CustomElementApi,
  elementCodenames: string[]
): Promise<ElementValue[]> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.CustomElement) {
      reject(new Error('Custom Element API not available'));
      return;
    }

    const customElement = window.CustomElement as any;
    const getMethod = customElement.getElements || 
                     (customElement as any).getElementValues;

    if (!getMethod || typeof getMethod !== 'function') {
      reject(new Error('Element access method not available'));
      return;
    }

    try {
      getMethod.call(
        customElement,
        elementCodenames,
        (elements: ElementValue[]) => {
          resolve(Array.isArray(elements) ? elements : []);
        },
        (error: Error | string) => {
          reject(new Error(typeof error === 'string' ? error : error.message || 'Failed to get elements'));
        }
      );
    } catch (error) {
      reject(error instanceof Error ? error : new Error('Unknown error getting elements'));
    }
  });
}

