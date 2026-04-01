import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from '@/App';
import Data from '@/Data';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Data>
      <App />
    </Data>
  </StrictMode>,
);
