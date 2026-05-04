import fs from 'fs';
import http from 'http';
import https from 'https';
import path from 'node:path';
import express from 'express';
import { generate as generateCert } from 'selfsigned';
import { stringifyError } from '../shared/utils.ts';
import apiRouter from './api/router.ts';
import {
  LISTEN_ADDRESS,
  PORT,
  PUBLIC_URL,
  SSL_CERTIFICATE_FILE,
  SSL_ENABLED,
  SSL_PRIVATE_KEY_FILE,
} from './config.ts';
import { loadHistory } from './history.ts';
import { shutdownABWorkers } from './integrations/actualbudget/ABClient.ts';
import resolveClientTemplate from './resolveClientTemplate.ts';
import { startScheduler } from './scheduler/scheduler.ts';
import { loadState } from './state.ts';

import './applyLogLevel.ts';

// prevent server startup if state file is invalid
try {
  loadState();
} catch (error) {
  throw new Error(`Error loading state: ${stringifyError(error)}`);
}

// prevent server startup if history file is invalid
try {
  loadHistory();
} catch (error) {
  throw new Error(`Error loading history: ${stringifyError(error)}`);
}

let forceShutdown = false;
async function shutdown() {
  if (forceShutdown) {
    console.log('Forcing shutdown');
    process.exit(0);
  }

  console.log(
    '\nGot request to shut down, this may take some time - Send another signal to force shutdown now.',
  );
  forceShutdown = true;

  console.debug('Shutting down now…');

  try {
    await Promise.all([shutdownABWorkers()]);
  } catch (error) {
    console.debug('Error while shutting down:', stringifyError(error));
    const timeout = 10;
    console.debug(`Waiting ${timeout} seconds…`);
    await new Promise((resolve) => {
      setTimeout(resolve, timeout * 1000);
    });
  }

  console.debug('Bye');
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

startScheduler();

const app = express();

app.use('/api', apiRouter);

app.get('/index.html', (_req, res) => {
  res.contentType('text/html').send(resolveClientTemplate('index.html'));
});
app.get('/manifest.json', (_req, res) => {
  res
    .contentType('application/json')
    .send(resolveClientTemplate('manifest.json'));
});
app.use(
  express.static(path.join(import.meta.dirname, '../client/dist'), {
    index: false,
  }),
);
app.get('{*splat}', (_req, res) => {
  res.contentType('text/html').send(resolveClientTemplate('index.html'));
});

let server;
let proto;
if (SSL_ENABLED) {
  let key: Buffer | string;
  let cert: Buffer | string;
  if (!SSL_PRIVATE_KEY_FILE && !SSL_CERTIFICATE_FILE) {
    const { hostname } = new URL(PUBLIC_URL);
    console.debug(`Generating self signed certificate for ${hostname}`);
    ({ private: key, cert } = await generateCert([
      { name: 'commonName', value: hostname },
    ]));
  } else {
    console.debug('Using provided certificate');
    if (!SSL_PRIVATE_KEY_FILE || !SSL_CERTIFICATE_FILE)
      throw new Error(
        'When using a custom SSL certificate, both SSL_PRIVATE_KEY_FILE and SSL_CERTIFICATE_FILE must be specified',
      );
    key = fs.readFileSync(SSL_PRIVATE_KEY_FILE);
    cert = fs.readFileSync(SSL_CERTIFICATE_FILE);
  }
  server = https.createServer({ key, cert }, app);
  proto = 'https';
} else {
  server = http.createServer(app);
  proto = 'http';
}

server.listen(+PORT, LISTEN_ADDRESS, () => {
  console.info(`Server is listening on ${proto}://${LISTEN_ADDRESS}:${+PORT}`);
});
