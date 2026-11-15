/**
 * Build plugin: ships the stroke data (hanzi-writer-data, from Make Me a
 * Hanzi, Arphic Public License) of the handwriting characters only, as
 * strokes/<code point>.json, with the unmodified ARPHICPL.TXT next to them.
 * The dev server serves the same files.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import type { Plugin } from 'vite';

export const strokeFile = (ch: string) => `${ch.codePointAt(0)!.toString(16)}.json`;

export function strokesPlugin(chars: readonly string[]): Plugin {
  const require = createRequire(import.meta.url);
  const dir = dirname(require.resolve('hanzi-writer-data/package.json'));
  const byFile = new Map(chars.map((ch) => [strokeFile(ch), ch]));
  const read = (file: string): Buffer | undefined => {
    if (file === 'ARPHICPL.TXT') return readFileSync(join(dir, 'ARPHICPL.TXT'));
    const ch = byFile.get(file);
    return ch ? readFileSync(join(dir, `${ch}.json`)) : undefined;
  };
  return {
    name: 'c-learn-write:strokes',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const m = /\/strokes\/([^/?]+)$/.exec(req.url?.split('?')[0] ?? '');
        const data = m ? read(m[1]!) : undefined;
        if (!data) return next();
        res.setHeader('Content-Type', m![1]!.endsWith('.json') ? 'application/json' : 'text/plain; charset=utf-8');
        res.end(data);
      });
    },
    generateBundle() {
      for (const file of [...byFile.keys(), 'ARPHICPL.TXT']) {
        this.emitFile({ type: 'asset', fileName: `strokes/${file}`, source: read(file)! });
      }
    },
  };
}
