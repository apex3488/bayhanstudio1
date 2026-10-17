/**
 * Renders every page to static HTML after `vite build` and `vite build --ssr`.
 * Output: dist/index.html (language gate), dist/{locale}/.../index.html, dist/404.html.
 */
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { siteBase } from '../config/site.ts';

interface RenderedPage {
  status: number;
  lang: string;
  hydrate: boolean;
}

interface ServerEntry {
  listPaths(): string[];
  renderPath(relativePath: string): RenderedPage | null;
  renderNotFound(): RenderedPage;
  applyTemplate(template: string, page: RenderedPage): string;
}

type Manifest = Record<string, { file: string }>;

const root = resolve(import.meta.dirname, '..');
const dist = join(root, 'dist');
const base = siteBase();
const entryUrl = pathToFileURL(join(root, 'dist-ssr', 'entry-server.js')).href;

const template = await readFile(join(dist, 'index.html'), 'utf8');
const entry = (await import(entryUrl)) as ServerEntry;

// Hydration waits for the page's dictionary chunk: preload it alongside the main bundle.
const manifestPath = join(dist, '.vite', 'manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as Manifest;
await rm(join(dist, '.vite'), { recursive: true, force: true });

function localePreload(lang: string): string {
  const chunk = manifest[`src/content/${lang}.ts`];
  return chunk ? `<link rel="modulepreload" crossorigin href="${base}${chunk.file}">\n  ` : '';
}

async function write(relativeFile: string, page: RenderedPage): Promise<void> {
  const file = join(dist, relativeFile);
  let html = entry.applyTemplate(template, page);
  if (page.hydrate) html = html.replace('</head>', () => `${localePreload(page.lang)}</head>`);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, html, 'utf8');
  console.log(`  ${page.status}  ${relativeFile}`);
}

console.log('Prerendering pages:');
for (const path of entry.listPaths()) {
  const page = entry.renderPath(path);
  if (!page) throw new Error(`No page rendered for "${path}"`);
  await write(join(path, 'index.html'), page);
}
await write('404.html', entry.renderNotFound());

// Disable Jekyll processing on GitHub Pages (keeps files starting with "_").
await writeFile(join(dist, '.nojekyll'), '');
