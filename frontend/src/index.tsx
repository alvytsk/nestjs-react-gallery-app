import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';
import { Provider } from 'react-redux';
import store from './state';

const main = (
  <Provider store={store}>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </Provider>
);

const container = document.getElementById('root');
if (!container) throw new Error('Failed to find the root element');
const root = createRoot(container);
root.render(main);
