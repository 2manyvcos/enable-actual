import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import App from '@/App';
import Data from '@/Data';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Data>
        <App />
      </Data>
    </BrowserRouter>
  </StrictMode>,
);
