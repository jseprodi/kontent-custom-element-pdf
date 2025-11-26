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
    if (typeof window === 'undefined') {
      console.warn('Window object not available');
      return;
    }

    // Wait for CustomElement API to be available
    const checkAndInit = () => {
      if (!window.CustomElement) {
        console.warn('CustomElement API not yet available, retrying...');
        setTimeout(checkAndInit, 100);
        return;
      }

      try {
        window.CustomElement.init((elementApi: CustomElementApi) => {
          if (!elementApi) {
            console.error('CustomElement API returned null/undefined');
            return;
          }

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

          // Set environment ID (with null check)
          if (elementApi.env && elementApi.env.id) {
            setEnvironmentId(elementApi.env.id);
          }

          // Set item info (with null check)
          if (elementApi.item) {
            setItemInfo(elementApi.item);
          }

          // Set variant info (with null check)
          if (elementApi.context && elementApi.context.variant) {
            setVariantInfo(elementApi.context.variant);
          }

          // Set initial height
          if (height !== 'default' && elementApi && typeof elementApi.setHeight === 'function') {
            try {
              setHeight(elementApi, height);
            } catch (error) {
              console.warn('Could not set initial height:', error);
            }
          }

          // Subscribe to disabled changes
          onDisabledChanged(elementApi, (isDisabled) => {
            setDisabled(isDisabled);
          });
        });
      } catch (error) {
        console.error('Error initializing CustomElement:', error);
      }
    };

    // Start checking for API availability
    checkAndInit();
  }, [height]);

  const setValue = useCallback(
    (newValue: string) => {
      if (api && typeof api.setValue === 'function') {
        try {
          api.setValue(newValue);
          setValueState(parseValue(newValue));
        } catch (error) {
          console.error('Error setting value:', error);
          // Still update local state even if API call fails
          setValueState(parseValue(newValue));
        }
      } else {
        // API not available, just update local state
        setValueState(parseValue(newValue));
      }
    },
    [api]
  );

  const handleSetHeight = useCallback(
    (newHeight: number | 'default' | 'dynamic') => {
      if (api && typeof api.setHeight === 'function') {
        try {
          setHeight(api, newHeight);
        } catch (error) {
          console.error('Error setting height:', error);
        }
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

