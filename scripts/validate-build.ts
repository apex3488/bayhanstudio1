/**
 * Static checks on the prerendered site. Fails the build on:
 * wrong/missing lang, empty or duplicate titles, missing description/canonical/hreflang,
 * placeholder links, internal links or assets that do not exist (with the base path),
 * and external links outside the list of real contacts.
 */
import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';
import { siteBase, siteOrigin } from '../config/site.ts';
import { contacts } from '../src/content/contacts.ts';

const LOCALES = ['ru', 'en', 'uz'];
const root = resolve(import.meta.dirname, '..');
const dist = join(root, 'dist');
const base = siteBase();
const origin = siteOrigin();
const allowedExternal = new Set<string>(Object.values(contacts));

const errors: string[] = [];
const titles = new Map<string, string>();

async function htmlFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) return htmlFiles(full);
      return Promise.resolve(entry.name.endsWith('.html') ? [full] : []);
    }),
  );
  return nested.flat();
}

/** Maps a base-prefixed URL path to the file GitHub Pages would serve. */
function servedFile(urlPath: string): string | null {
  const clean = urlPath.split(/[?#]/)[0] ?? '';
  if (!clean.startsWith(base)) return null;
  const rel = decodeURIComponent(clean.slice(base.length));
  return join(dist, rel === '' || rel.endsWith('/') ? join(rel, 'index.html') : rel);
}

function attrs(html: string, name: string): string[] {
  return [...html.matchAll(new RegExp(`\\s${name}="([^"]*)"`, 'g'))].map((m) => m[1] ?? '');
}

function checkUrl(page: string, url: string): void {
  if (url === '' || url === '#') {
    errors.push(`${page}: placeholder link "${url}"`);
  } else if (url.startsWith('#')) {
    return; // in-page anchor
  } else if (url.startsWith(`${origin}/`)) {
    checkUrl(page, url.slice(origin.length));
  } else if (/^https?:\/\//.test(url)) {
    if (!allowedExternal.has(url)) errors.push(`${page}: external URL not in contacts: ${url}`);
  } else if (url.startsWith('/')) {
    const file = servedFile(url);
    if (!file) errors.push(`${page}: URL ignores base "${base}": ${url}`);
    else if (!existsSync(file)) errors.push(`${page}: broken link ${url}`);
  } else {
    errors.push(`${page}: unexpected relative/unknown URL "${url}"`);
  }
}

for (const file of await htmlFiles(dist)) {
  const page = relative(dist, file).split(sep).join('/');
  const html = await readFile(file, 'utf8');
  const localeDir = page.split('/')[0] ?? '';
  const isLocalePage = LOCALES.includes(localeDir);

  const lang = /<html lang="([^"]+)"/.exec(html)?.[1];
  if (!lang) errors.push(`${page}: missing <html lang>`);
  if (isLocalePage && lang !== localeDir) errors.push(`${page}: lang="${lang}" ≠ ${localeDir}`);

  const title = /<title>([^<]*)<\/title>/.exec(html)?.[1]?.trim();
  if (!title) errors.push(`${page}: empty <title>`);
  else if (titles.has(title)) errors.push(`${page}: duplicate title with ${titles.get(title)}`);
  else titles.set(title, page);

  if (!/<meta name="description" content="[^"]+"/.test(html)) {
    errors.push(`${page}: missing description`);
  }

  if (isLocalePage) {
    if (!/<link rel="canonical" href="[^"]+"/.test(html)) errors.push(`${page}: missing canonical`);
    const hreflangs = attrs(html, 'hreflang');
    for (const code of [...LOCALES, 'x-default']) {
      if (!hreflangs.includes(code)) errors.push(`${page}: missing hreflang ${code}`);
    }
    if (!html.includes('id="root"')) errors.push(`${page}: missing #root for hydration`);
  }

  for (const url of [...attrs(html, 'href'), ...attrs(html, 'src')]) checkUrl(page, url);
}

if (errors.length > 0) {
  console.error(`Build validation failed (${errors.length}):\n  ${errors.join('\n  ')}`);
  process.exit(1);
}
console.log(
  `Build validation passed: ${titles.size} HTML pages, base "${base}", origin ${origin}.`,
);
