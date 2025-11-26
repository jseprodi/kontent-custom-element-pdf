import React from 'react';
import ReactDOM from 'react-dom/client';
import { CustomElementProvider } from './customElement/CustomElementContext';
import { IntegrationApp } from './IntegrationApp';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CustomElementProvider height="dynamic">
      <IntegrationApp />
    </CustomElementProvider>
  </React.StrictMode>
);

