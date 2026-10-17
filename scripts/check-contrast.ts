/**
 * WCAG 2.2 contrast check for the colour pairs the design system actually uses.
 * Reads values from src/styles/tokens.css, so changing a token re-validates it.
 * Semi-transparent colours are blended over their background first.
 */
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

type Rgba = [number, number, number, number];

interface Pair {
  fg: string;
  bg: string;
  min: number;
  use: string;
}

// 4.5 = normal text (AA), 3 = large text / UI components and focus indicators (AA)
const PAIRS: Pair[] = [
  { fg: 'c-ice', bg: 'c-void', min: 4.5, use: 'body text' },
  { fg: 'c-ice', bg: 'c-graphite', min: 4.5, use: 'text on graphite surfaces' },
  { fg: 'c-ice', bg: 'c-graphite-2', min: 4.5, use: 'text on hovered surfaces' },
  { fg: 'c-ice-dim', bg: 'c-void', min: 4.5, use: 'secondary text' },
  { fg: 'c-ice-dim', bg: 'c-graphite', min: 4.5, use: 'secondary text on graphite' },
  { fg: 'c-ice-mute', bg: 'c-void', min: 4.5, use: 'meta text' },
  { fg: 'c-blue-hover', bg: 'c-void', min: 4.5, use: 'accent labels' },
  { fg: 'c-void', bg: 'c-blue', min: 4.5, use: 'primary button text' },
  { fg: 'c-void', bg: 'c-blue-hover', min: 4.5, use: 'primary button text, hover' },
  { fg: 'c-error', bg: 'c-void', min: 4.5, use: 'form error text' },
  { fg: 'c-error-line', bg: 'c-graphite', min: 3, use: 'invalid field border' },
  { fg: 'c-blue', bg: 'c-void', min: 3, use: 'focus outline, active indicators' },
];

const root = resolve(import.meta.dirname, '..');
const css = await readFile(join(root, 'src', 'styles', 'tokens.css'), 'utf8');

function token(name: string): Rgba {
  const value = new RegExp(`--${name}:\\s*([^;]+);`).exec(css)?.[1]?.trim();
  if (!value) throw new Error(`Token --${name} not found`);
  const hex = /^#([0-9a-f]{6})$/i.exec(value)?.[1];
  if (hex) {
    const n = parseInt(hex, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
  }
  const rgb = /^rgb\(\s*(\d+)\s+(\d+)\s+(\d+)\s*(?:\/\s*([\d.]+))?\s*\)$/.exec(value);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3]), Number(rgb[4] ?? 1)];
  throw new Error(`Unsupported colour for --${name}: ${value}`);
}

function blend([r, g, b, a]: Rgba, [br, bgc, bb]: Rgba): Rgba {
  return [r * a + br * (1 - a), g * a + bgc * (1 - a), b * a + bb * (1 - a), 1];
}

function luminance([r, g, b]: Rgba): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

let failed = 0;
for (const pair of PAIRS) {
  const bg = token(pair.bg);
  const fg = blend(token(pair.fg), bg);
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((a, b) => b - a) as [number, number];
  const ratio = (hi + 0.05) / (lo + 0.05);
  const ok = ratio >= pair.min;
  if (!ok) failed += 1;
  console.log(
    `${ok ? 'ok  ' : 'FAIL'} ${ratio.toFixed(2).padStart(5)}:1 (min ${pair.min})  ${pair.fg} on ${pair.bg} — ${pair.use}`,
  );
}

if (failed > 0) {
  console.error(`${failed} colour pair(s) below WCAG AA.`);
  process.exit(1);
}
