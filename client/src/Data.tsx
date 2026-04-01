import { FetchProvider } from '@civet/common';
import { ConfigProvider } from '@civet/core';
import { type ReactNode } from 'react';

const apiURL = new URL(
  'api/v1/',
  window.enableActual.publicURL.replace(/\/*$/, '/'),
);

const dataProvider = new FetchProvider({
  baseURL: apiURL,
});

export default function Data({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider dataProvider={dataProvider}>{children}</ConfigProvider>
  );
}
