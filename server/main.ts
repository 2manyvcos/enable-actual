import fs from 'fs';
import path from 'node:path';
import express from 'express';
import apiRouter from './api/router.ts';
import { APP_NAME, PORT, PUBLIC_URL } from './config.ts';

const app = express();

app.use('/api', apiRouter);

const templates: { [path: string]: string | undefined } = {};
const templateParams = {
  ENABLEACTUAL_CONFIG_APP_NAME: APP_NAME,
  ENABLEACTUAL_CONFIG_PUBLIC_URL: PUBLIC_URL,
};
function resolveTemplate(templatePath: string): string {
  if (!templates[templatePath]) {
    templates[templatePath] = Object.entries(templateParams).reduce(
      (src, [param, value]) =>
        src
          .replaceAll(
            `'%${param}%'`,
            `'${value
              .replace(/\\/g, '\\\\')
              .replace(/'/g, "\\'")
              .replace(/\n/g, '\\n')}'`,
          )
          .replaceAll(
            `"%${param}%"`,
            `"${value
              .replace(/\\/g, '\\\\')
              .replace(/"/g, '\\"')
              .replace(/\n/g, '\\n')}"`,
          )
          .replaceAll(
            `>%${param}%<`,
            `>${value
              .replace(/&/g, '&amp;')
              .replace(/"/g, '&quot;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')}<`,
          ),
      fs.readFileSync(templatePath).toString(),
    );
  }
  return templates[templatePath];
}
app.get('/index.html', (_req, res) => {
  res
    .contentType('text/html')
    .send(
      resolveTemplate(
        path.join(import.meta.dirname, '../client/dist/index.html'),
      ),
    );
});
app.get('/manifest.json', (_req, res) => {
  res
    .contentType('application/json')
    .send(
      resolveTemplate(
        path.join(import.meta.dirname, '../client/dist/manifest.json'),
      ),
    );
});
app.use(
  express.static(path.join(import.meta.dirname, '../client/dist'), {
    index: false,
  }),
);
app.get('{*splat}', (_req, res) => {
  res
    .contentType('text/html')
    .send(
      resolveTemplate(
        path.join(import.meta.dirname, '../client/dist/index.html'),
      ),
    );
});

app.listen(PORT, () => {
  console.log(`Server is listening on http://localhost:${PORT}`);
});
