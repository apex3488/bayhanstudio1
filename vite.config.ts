import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { siteBase, siteOrigin } from './config/site.ts';

interface RenderedPage {
  status: number;
}

interface ServerEntry {
  renderUrl(pathname: string): Promise<RenderedPage>;
  applyTemplate(template: string, page: RenderedPage): string;
}

/**
 * In development every page is rendered on request with the same server entry
 * the production prerender uses, so dev and build output stay identical.
 */
function devPageRenderer(): Plugin {
  return {
    name: 'bayhan:dev-page-renderer',
    apply: 'serve',
    configureServer(server) {
      // Returned hook runs after Vite's own middlewares (modules, assets, /@vite/*).
      return () => {
        server.middlewares.use(async (req, res, next) => {
          if (req.method !== 'GET' || !req.url) return next();
          const { pathname } = new URL(req.url, 'http://localhost');
          if (/\.[a-z0-9]+$/i.test(pathname)) return next();
          try {
            const raw = await readFile('index.html', 'utf8');
            const template = await server.transformIndexHtml(pathname, raw);
            const entry = (await server.ssrLoadModule('/src/entry-server.tsx')) as ServerEntry;
            const page = await entry.renderUrl(pathname);
            res.statusCode = page.status;
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.end(entry.applyTemplate(template, page));
          } catch (error) {
            if (error instanceof Error) server.ssrFixStacktrace(error);
            next(error);
          }
        });
      };
    },
  };
}

/**
 * Dev-only endpoint for `window.__bayhanCapture(name, width)` (see ExperienceCanvas):
 * saves a rendered frame of the 3D scene to public/media/<name>.webp.
 */
function devCaptureWriter(): Plugin {
  const MAX_BYTES = 3 * 1024 * 1024;
  return {
    name: 'bayhan:dev-capture-writer',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__dev/capture', (req, res) => {
        const name = new URL(req.url ?? '', 'http://localhost').searchParams.get('name') ?? '';
        if (req.method !== 'POST' || !/^[a-z0-9-]{1,40}$/.test(name)) {
          res.statusCode = 400;
          return res.end();
        }
        const chunks: Buffer[] = [];
        let size = 0;
        req.on('data', (chunk: Buffer) => {
          size += chunk.length;
          if (size <= MAX_BYTES) chunks.push(chunk);
        });
        req.on('end', async () => {
          const data = Buffer.concat(chunks);
          const isWebp = data.subarray(8, 12).toString('ascii') === 'WEBP';
          if (size > MAX_BYTES || !isWebp) {
            res.statusCode = 400;
            return res.end();
          }
          const dir = resolve(server.config.root, 'public', 'media');
          await mkdir(dir, { recursive: true });
          await writeFile(join(dir, `${name}.webp`), data);
          server.config.logger.info(`captured media/${name}.webp (${Math.round(size / 1024)} KB)`);
          res.statusCode = 201;
          res.end();
        });
      });
    },
  };
}

/**
 * `vite preview` serves dist/ the way GitHub Pages does: "/ru/" → ru/index.html,
 * "/ru" → 301 "/ru/", anything missing → 404.html with status 404.
 */
function githubPagesPreview(): Plugin {
  return {
    name: 'bayhan:github-pages-preview',
    apply: 'serve',
    configurePreviewServer(server) {
      const outDir = resolve(server.config.root, server.config.build.outDir);
      const base = server.config.base;

      server.middlewares.use((req, res, next) => {
        if (!req.url) return next();
        const url = new URL(req.url, 'http://localhost');
        if (!url.pathname.startsWith(base)) return next();
        const relative = decodeURIComponent(url.pathname.slice(base.length));
        const target = join(outDir, relative);

        if (relative === '' || relative.endsWith('/')) {
          if (existsSync(join(target, 'index.html'))) {
            req.url = `${url.pathname}index.html${url.search}`;
          }
        } else if (existsSync(join(target, 'index.html'))) {
          res.statusCode = 301;
          res.setHeader('Location', `${url.pathname}/${url.search}`);
          return res.end();
        }
        next();
      });

      // Runs after the static file server: nothing matched → GitHub Pages 404.
      return () => {
        server.middlewares.use(async (_req, res) => {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(await readFile(join(outDir, '404.html'), 'utf8'));
        });
      };
    },
  };
}

export default defineConfig({
  base: siteBase(),
  appType: 'custom',
  plugins: [react(), devPageRenderer(), devCaptureWriter(), githubPagesPreview()],
  define: {
    __SITE_ORIGIN__: JSON.stringify(siteOrigin()),
  },
  build: {
    target: 'es2022',
    // Never inline fonts: unicode-range subsets must stay separate files so
    // browsers download only the ones a page needs.
    assetsInlineLimit: (file) => (file.endsWith('.woff2') ? false : undefined),
    // Read by scripts/prerender.ts to preload each page's locale chunk, then deleted.
    manifest: true,
    // The 3D chunk (three + R3F, ~250 KB gzip) is lazy and loads after the hero
    // reveal on capable devices only; the default 500 KB warning targets eager code.
    chunkSizeWarningLimit: 1000,
  },
});
