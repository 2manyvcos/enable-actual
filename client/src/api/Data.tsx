import { FetchProvider, SSEReceiver } from '@civet/common';
import { ConfigProvider } from '@civet/core';
import { ConfigProvider as EventConfigProvider } from '@civet/events';
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

let sourceController: AbortController | undefined;
const nextEventSource = () => {
  sourceController?.abort();
  sourceController = new AbortController();
  const eventSource = new EventSource(new URL('v1/events', apiURL));
  eventSource.addEventListener(
    'error',
    () => {
      console.warn('Error connecting to the event stream');
    },
    { signal: sourceController.signal },
  );
  window.addEventListener(
    'beforeunload',
    () => {
      eventSource.close();
    },
    { signal: sourceController.signal },
  );
  return eventSource;
};

const eventReceiver = new SSEReceiver(nextEventSource());

window.addEventListener('online', () => {
  eventReceiver.setEventSource(nextEventSource());
  dataProvider.notify(undefined);
});

export default function Data({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider dataProvider={dataProvider}>
      <EventConfigProvider eventReceiver={eventReceiver}>
        {children}
      </EventConfigProvider>
    </ConfigProvider>
  );
}
