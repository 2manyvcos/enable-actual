import { Liquid, type FS } from 'liquidjs';

const engine = new Liquid({
  cache: true,
  fs: {} as FS, // disable filesystem access
  relativeReference: false,
  strictFilters: true,
  ownPropertyOnly: true,
  greedy: true,
});

engine.registerFilter('mask', (id: string): string => {
  const trimmed = (id ?? '').toString().replace(/\s/g, '');

  if (trimmed.length > 4) {
    const end = trimmed.substring(trimmed.length - 4);
    return `*** ${end}`;
  }

  return id;
});

export async function parseTemplate(
  template: string,
  data: object,
): Promise<string> {
  return ((await engine.parseAndRender(template, data)) ?? '')
    .toString()
    .trim();
}
