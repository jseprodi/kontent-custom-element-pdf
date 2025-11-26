/* eslint-disable @typescript-eslint/no-explicit-any */
export interface CustomElement {
  init: (callback: (element: CustomElementApi) => void) => void;
}

export interface CustomElementApi {
  setValue: (value: string) => void;
  getValue: () => string;
  setHeight: (height: number | 'default' | 'dynamic') => void;
  onDisabledChanged: (callback: (disabled: boolean) => void) => void;
  config: Record<string, any>;
  disabled: boolean;
  value: string;
  env: {
    id: string;
  };
  item: ItemDetail;
  context: {
    variant: {
      id: string;
      codename: string;
    };
  };
}

export interface ItemDetail {
  id: string;
  codename: string;
  name: string;
  collection: {
    id: string;
    codename: string;
  };
  type: {
    id: string;
    codename: string;
  };
}

export interface ElementValue {
  codename: string;
  value: any;
}

declare global {
  interface Window {
    CustomElement: CustomElement;
  }
}

