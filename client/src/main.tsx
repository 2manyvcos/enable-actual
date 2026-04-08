import CssBaseline from '@mui/material/CssBaseline';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter, Route, Routes } from 'react-router';
import App from '@/App';
import Configuration from '@/Configuration';
import Data from '@/Data';
import PageNotFound from '@/PageNotFound';
import EnableBankingAuthCallback from '@/enablebanking/AuthCallback';

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

const theme = createTheme({
  colorSchemes: {
    dark: true,
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Data>
        <ThemeProvider theme={theme}>
          <CssBaseline enableColorScheme />

          <Routes>
            <Route element={<App />}>
              <Route index element={<Configuration />} />

              <Route
                path="/eb/callback"
                element={<EnableBankingAuthCallback />}
              />

              <Route path="*" element={<PageNotFound />} />
            </Route>
          </Routes>

          <Toaster />
        </ThemeProvider>
      </Data>
    </BrowserRouter>
  </StrictMode>,
);
