import { FetchProvider } from '@civet/common';
import { ConfigProvider } from '@civet/core';
import { type ReactNode } from 'react';

const apiURL = new URL(
  'api/',
  window.enableActual.publicURL.replace(/\/*$/, '/'),
);

const dataProvider = new FetchProvider({
  baseURL: apiURL,
  handleError: async (_requestURL, _request, response) => {
    let message;
    try {
      message = await response.text();
    } catch {
      // ignore
    }
    throw new Error(message || response.statusText);
  },
});

export default function Data({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider dataProvider={dataProvider}>{children}</ConfigProvider>
  );
}
