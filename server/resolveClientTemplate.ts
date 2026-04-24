import fs from 'fs';
import path from 'path';
import { APP_NAME, PUBLIC_URL } from './config.ts';

const templates: { [path: string]: string | undefined } = {};
const templateParams = {
  ENABLEACTUAL_CONFIG_APP_NAME: APP_NAME,
  ENABLEACTUAL_CONFIG_PUBLIC_URL: PUBLIC_URL,
};

export default function resolveClientTemplate(
  clientTemplatePath: string,
): string {
  const templatePath = path.join(
    import.meta.dirname,
    '../client/dist',
    clientTemplatePath,
  );

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
