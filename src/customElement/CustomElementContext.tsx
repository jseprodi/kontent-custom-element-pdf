import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { CustomElementApi } from './types/customElement';
import { setHeight, onDisabledChanged } from './selectors';
import { parseValue } from './value';
import { validateConfig, type Config } from './config';

interface CustomElementContextValue {
  api: CustomElementApi | null;
  value: ReturnType<typeof parseValue>;
  config: Config;
  disabled: boolean;
  environmentId: string;
  itemInfo: CustomElementApi['item'] | null;
  variantInfo: CustomElementApi['context']['variant'] | null;
  setValue: (value: string) => void;
  setHeight: (height: number | 'default' | 'dynamic') => void;
}

const CustomElementContext = createContext<CustomElementContextValue | null>(null);

export function useCustomElementContext(): CustomElementContextValue {
  const context = useContext(CustomElementContext);
  if (!context) {
    throw new Error('useCustomElementContext must be used within CustomElementProvider');
  }
  return context;
}

interface CustomElementProviderProps {
  children: React.ReactNode;
  height?: number | 'default' | 'dynamic';
}

export function CustomElementProvider({
  children,
  height = 'dynamic',
}: CustomElementProviderProps) {
  const [api, setApi] = useState<CustomElementApi | null>(null);
  const [value, setValueState] = useState(parseValue(null));
  const [config, setConfig] = useState<Config>({});
  const [disabled, setDisabled] = useState(false);
  const [environmentId, setEnvironmentId] = useState('');
  const [itemInfo, setItemInfo] = useState<CustomElementApi['item'] | null>(null);
  const [variantInfo, setVariantInfo] = useState<CustomElementApi['context']['variant'] | null>(
    null
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !window.CustomElement) {
      console.error('CustomElement API not available');
      return;
    }

    window.CustomElement.init((elementApi: CustomElementApi) => {
      setApi(elementApi);

      // Parse initial value
      const initialValue = parseValue(elementApi.value);
      setValueState(initialValue);

      // Parse and validate config
      if (validateConfig(elementApi.config)) {
        setConfig(elementApi.config);
      }

      // Set initial disabled state
      setDisabled(elementApi.disabled);

      // Set environment ID
      setEnvironmentId(elementApi.env.id);

      // Set item info
      setItemInfo(elementApi.item);

      // Set variant info
      setVariantInfo(elementApi.context.variant);

      // Set initial height
      if (height !== 'default') {
        setHeight(elementApi, height);
      }

      // Subscribe to disabled changes
      onDisabledChanged(elementApi, (isDisabled) => {
        setDisabled(isDisabled);
      });
    });
  }, [height]);

  const setValue = useCallback(
    (newValue: string) => {
      if (api) {
        api.setValue(newValue);
        setValueState(parseValue(newValue));
      }
    },
    [api]
  );

  const handleSetHeight = useCallback(
    (newHeight: number | 'default' | 'dynamic') => {
      if (api) {
        setHeight(api, newHeight);
      }
    },
    [api]
  );

  const contextValue: CustomElementContextValue = {
    api,
    value,
    config,
    disabled,
    environmentId,
    itemInfo,
    variantInfo,
    setValue,
    setHeight: handleSetHeight,
  };

  return (
    <CustomElementContext.Provider value={contextValue}>
      {children}
    </CustomElementContext.Provider>
  );
}

