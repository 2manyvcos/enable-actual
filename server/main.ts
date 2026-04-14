import fs from 'fs';
import http from 'http';
import https from 'https';
import path from 'node:path';
import express from 'express';
import apiRouter from './api/router.ts';
import {
  LISTEN_ADDRESS,
  PORT,
  SSL_CERTIFICATE_FILE,
  SSL_PRIVATE_KEY_FILE,
} from './config.ts';
import resolveClientTemplate from './resolveClientTemplate.ts';
import { loadState } from './state.ts';

import './applyLogLevel.ts';

// prevent server startup if state file is invalid
try {
  loadState();
} catch (error) {
  throw new Error(
    `Error loading state: ${(error as Error)?.message ?? error?.toString()}`,
  );
}

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
if (SSL_PRIVATE_KEY_FILE && SSL_CERTIFICATE_FILE) {
  const key = fs.readFileSync(SSL_PRIVATE_KEY_FILE);
  const cert = fs.readFileSync(SSL_CERTIFICATE_FILE);
  server = https.createServer({ key, cert }, app);
  proto = 'https';
} else {
  server = http.createServer(app);
  proto = 'http';
}

server.listen(+PORT, LISTEN_ADDRESS, () => {
  console.info(`Server is listening on ${proto}://${LISTEN_ADDRESS}:${+PORT}`);
});
