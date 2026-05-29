import { Liquid, type FS } from 'liquidjs';
import { mask } from '../shared/utils.ts';

const engine = new Liquid({
  cache: true,
  fs: {} as FS, // disable filesystem access
  relativeReference: false,
  strictFilters: true,
  ownPropertyOnly: true,
  greedy: true,
});

engine.registerFilter('mask', mask);

export async function parseTemplate(
  template: string,
  data: object,
): Promise<string> {
  return ((await engine.parseAndRender(template, data)) ?? '')
    .toString()
    .trim();
}
