import path from 'path';
import express, { type ErrorRequestHandler } from 'express';
import { engine } from 'express-handlebars';
import fs from 'fs';
import http from 'http';
import https from 'https';
import cron from 'node-cron';
import checkSession from './checkSession.ts';
import {
  APP_NAME,
  LISTEN_ADDRESS,
  PORT,
  PUBLIC_URL,
  SSL_CERTIFICATE_FILE,
  SSL_PRIVATE_KEY_FILE,
  SYNC_SCHEDULE,
} from './config.ts';
import ebRouter from './eb/router.ts';
import { loadState } from './state.ts';
import sync from './sync.ts';

checkSession(loadState().source);

console.log(`Starting sync scheduler for ${SYNC_SCHEDULE}…`);
cron.schedule(SYNC_SCHEDULE, sync);

const app = express();
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(import.meta.dirname, './views'));
app.use(express.urlencoded());

app.get('/', (_req, res) => {
  res.render('index', {
    appName: APP_NAME,
  });
});

app.get('/health', (_req, res) => {
  res.send('OK');
});

app.get('/auth', (_req, res) => {
  res.redirect(new URL('eb/auth', PUBLIC_URL).href);
});

app.get('/sync', (_req, res) => {
  res.redirect(new URL('eb/sync', PUBLIC_URL).href);
});

app.use('/eb', ebRouter);

app.all('{*splat}', (_req, res) => {
  res.status(404).send('Page not found');
});

app.use(((error, _req, res, _next) => {
  console.error(`Error: ${error.message ?? error}`);
  res.status(500).send('Internal server error');
}) satisfies ErrorRequestHandler);

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
  console.log(`Server is listening on ${proto}://${LISTEN_ADDRESS}:${+PORT}`);
});
