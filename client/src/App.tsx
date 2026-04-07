import { Toaster } from 'react-hot-toast';
import { Route, Routes } from 'react-router';
import Configuration from './Configuration';
import PageNotFound from './PageNotFound';
import EnableBankingAuthCallback from './enablebanking/AuthCallback';

import './styles.css';

export default function App() {
  return (
    <>
      <Routes>
        <Route index element={<Configuration />} />
        <Route path="/eb/callback" element={<EnableBankingAuthCallback />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>

      <Toaster />
    </>
  );
}
