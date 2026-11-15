/*
 * Genera los íconos de la PWA a partir del sprite de la llama.
 * No usa dependencias: escribe los PNG a mano con zlib.
 *
 *   node scripts/generate-icons.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

const root = new URL('..', import.meta.url)
const read = (path) => readFileSync(new URL(path, root), 'utf8')

function extractRows(name) {
  const source = read('src/shared/sprites/spriteRows.ts')
  const block = source.match(new RegExp(`${name} = \\[([\\s\\S]*?)\\] as const`))

  if (!block) {
    throw new Error(`No se encontró ${name}`)
  }

  return [...block[1].matchAll(/'([^']*)'/g)].map((match) => match[1])
}

function extractPalette() {
  const source = read('src/shared/sprites/spritePalette.ts')

  return Object.fromEntries(
    [...source.matchAll(/(\w): '(#[0-9a-f]{6})'/g)].map((match) => [
      match[1],
      match[2],
    ]),
  )
}

const palette = extractPalette()
const llama = extractRows('llamaStandingRows')
const grid = 32
const sky = '#1f4e79'
const ground = '#c99a2e'
const groundRows = 5

/** Cuadrícula de 32 × 32 colores: cielo, suelo de paja y la llama al centro. */
function buildGrid() {
  const cells = Array.from({ length: grid }, (_, y) =>
    Array.from({ length: grid }, () => (y >= grid - groundRows ? ground : sky)),
  )
  const width = Math.max(...llama.map((row) => row.length))
  const left = Math.floor((grid - width) / 2)
  const top = grid - groundRows - llama.length + 1

  llama.forEach((row, y) => {
    ;[...row].forEach((key, x) => {
      if (palette[key]) {
        cells[top + y][left + x] = palette[key]
      }
    })
  })

  return cells
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n

  for (let k = 0; k < 8; k += 1) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  }

  return c >>> 0
})

function crc32(buffer) {
  let crc = 0xffffffff

  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  }

  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const length = Buffer.alloc(4)
  const crc = Buffer.alloc(4)

  length.writeUInt32BE(data.length)
  crc.writeUInt32BE(crc32(body))

  return Buffer.concat([length, body, crc])
}

function toPng(cells, size) {
  const scale = size / grid
  const raw = Buffer.alloc((size * 3 + 1) * size)

  for (let y = 0; y < size; y += 1) {
    const offset = y * (size * 3 + 1)

    raw[offset] = 0

    for (let x = 0; x < size; x += 1) {
      const color = cells[Math.floor(y / scale)][Math.floor(x / scale)]

      raw[offset + 1 + x * 3] = parseInt(color.slice(1, 3), 16)
      raw[offset + 2 + x * 3] = parseInt(color.slice(3, 5), 16)
      raw[offset + 3 + x * 3] = parseInt(color.slice(5, 7), 16)
    }
  }

  const header = Buffer.alloc(13)

  header.writeUInt32BE(size, 0)
  header.writeUInt32BE(size, 4)
  header[8] = 8 // bits por canal
  header[9] = 2 // RGB

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function toSvg(cells) {
  const rects = []

  cells.forEach((row, y) => {
    let x = 0

    while (x < row.length) {
      let end = x + 1

      while (end < row.length && row[end] === row[x]) {
        end += 1
      }

      if (row[x] !== sky) {
        rects.push(
          `<rect x="${x}" y="${y}" width="${end - x}" height="1" fill="${row[x]}"/>`,
        )
      }

      x = end
    }
  })

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${grid} ${grid}" shape-rendering="crispEdges"><rect width="${grid}" height="${grid}" fill="${sky}"/>${rects.join('')}</svg>\n`
}

const cells = buildGrid()
const write = (path, data) => writeFileSync(new URL(path, root), data)

// La llama cabe en el 80 % central, así que el mismo dibujo sirve de "maskable".
write('public/icons/icon-192.png', toPng(cells, 192))
write('public/icons/icon-512.png', toPng(cells, 512))
write('public/icons/maskable-512.png', toPng(cells, 512))
write('public/icons/aynuqa-mark.svg', toSvg(cells))

console.log('Íconos generados en public/icons/')
