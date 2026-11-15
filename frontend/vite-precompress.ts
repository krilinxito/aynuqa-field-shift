import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { brotliCompressSync, constants, gzipSync } from 'node:zlib'

import type { Plugin } from 'vite'

/*
 * Compresión pensada para mala señal: en el build se guardan copias .br y .gz
 * de JS, CSS y WASM, y el preview las sirve tal cual. El SQLite en WASM pasa
 * de 2,5 MB a ~0,7 MB con Brotli (antes viajaba sin comprimir).
 */
const COMPRESSIBLE = /\.(js|mjs|css|wasm|html|svg|json)$/
const MIN_BYTES = 1024

const CONTENT_TYPES: Record<string, string> = {
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.wasm': 'application/wasm',
  '.html': 'text/html; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })
}

export function precompress(): Plugin {
  let outDir = 'dist'
  return {
    name: 'aynuqa-precompress',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      for (const file of walk(outDir)) {
        if (!COMPRESSIBLE.test(file)) continue
        const data = readFileSync(file)
        if (data.length < MIN_BYTES) continue
        writeFileSync(
          `${file}.br`,
          brotliCompressSync(data, {
            params: {
              [constants.BROTLI_PARAM_QUALITY]: 11,
              [constants.BROTLI_PARAM_SIZE_HINT]: data.length,
            },
          }),
        )
        writeFileSync(`${file}.gz`, gzipSync(data, { level: 9 }))
      }
    },
  }
}

/** En `vite preview`, sirve la copia .br o .gz si el navegador la acepta. */
export function servePrecompressed(): Plugin {
  return {
    name: 'aynuqa-serve-precompressed',
    configurePreviewServer(server) {
      const root = resolve(server.config.root, server.config.build.outDir)
      server.middlewares.use((req, res, next) => {
        const path = (req.url ?? '').split('?')[0]
        const ext = extname(path)
        if (req.method !== 'GET' || !COMPRESSIBLE.test(path) || path.includes('..')) {
          next()
          return
        }
        const accept = String(req.headers['accept-encoding'] ?? '')
        const file = join(root, decodeURIComponent(path))
        const candidates: Array<[string, string]> = [
          ['br', `${file}.br`],
          ['gzip', `${file}.gz`],
        ]
        const match = candidates.find(
          ([encoding, candidate]) => accept.includes(encoding) && existsSync(candidate),
        )
        if (!match) {
          next()
          return
        }
        const [encoding, candidate] = match
        res.setHeader('Content-Type', CONTENT_TYPES[ext] ?? 'application/octet-stream')
        res.setHeader('Content-Encoding', encoding)
        res.setHeader('Vary', 'Accept-Encoding')
        // Los archivos de /assets llevan hash: se pueden guardar para siempre.
        res.setHeader(
          'Cache-Control',
          path.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
        )
        res.end(readFileSync(candidate))
      })
    },
  }
}
