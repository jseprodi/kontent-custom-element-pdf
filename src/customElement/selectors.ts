import type { CustomElementApi, ElementValue } from './types/customElement';

export function getValue(api: CustomElementApi): string {
  return api.getValue();
}

export function setValue(api: CustomElementApi, value: string): void {
  api.setValue(value);
}

export function setHeight(api: CustomElementApi, height: number | 'default' | 'dynamic'): void {
  api.setHeight(height);
}

export function onDisabledChanged(
  api: CustomElementApi,
  callback: (disabled: boolean) => void
): void {
  api.onDisabledChanged(callback);
}

export async function promptToSelectAssets(
  api: CustomElementApi,
  options: {
    allowMultiple?: boolean;
    fileType?: 'images' | 'any';
  } = {}
): Promise<Array<{ id: string; url: string; name: string }>> {
  return new Promise((resolve, reject) => {
    const customElement = (window as any).CustomElement;
    if (!customElement || !customElement.getSelectAsset) {
      reject(new Error('Asset selection not available'));
      return;
    }

    customElement.getSelectAsset(
      {
        allowMultiple: options.allowMultiple ?? false,
        fileType: options.fileType ?? 'any',
      },
      (assets: Array<{ id: string; url: string; name: string }>) => {
        resolve(assets);
      },
      (error: Error) => {
        reject(error);
      }
    );
  });
}

export async function promptToSelectItems(
  api: CustomElementApi,
  options: {
    allowMultiple?: boolean;
    contentTypes?: Array<{ id: string } | { codename: string }>;
  } = {}
): Promise<Array<{ id: string; codename: string; name: string }>> {
  return new Promise((resolve, reject) => {
    const customElement = (window as any).CustomElement;
    if (!customElement || !customElement.getSelectItems) {
      reject(new Error('Item selection not available'));
      return;
    }

    customElement.getSelectItems(
      {
        allowMultiple: options.allowMultiple ?? false,
        contentTypes: options.contentTypes ?? [],
      },
      (items: Array<{ id: string; codename: string; name: string }>) => {
        resolve(items);
      },
      (error: Error) => {
        reject(error);
      }
    );
  });
}

export function getElements(
  api: CustomElementApi,
  elementCodenames: string[]
): Promise<ElementValue[]> {
  return new Promise((resolve, reject) => {
    const customElement = (window as any).CustomElement;
    if (!customElement || !customElement.getElements) {
      reject(new Error('Element access not available'));
      return;
    }

    customElement.getElements(
      elementCodenames,
      (elements: ElementValue[]) => {
        resolve(elements);
      },
      (error: Error) => {
        reject(error);
      }
    );
  });
}

