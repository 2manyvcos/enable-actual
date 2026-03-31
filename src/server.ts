import express, { type ErrorRequestHandler } from 'express';
import { engine } from 'express-handlebars';
import cron from 'node-cron';
import path from 'path';
import checkSession from './checkSession.ts';
import { APP_NAME, PORT, PUBLIC_URL, SYNC_SCHEDULE } from './config.ts';
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

app.listen(PORT, () => {
  console.log(`Server is listening on http://localhost:${PORT}`);
});
