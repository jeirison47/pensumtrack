import sharp from 'sharp'
import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.join(__dirname, '../public')
const input = path.join(publicDir, 'logo.png')

// BG color: teal accent
const BG = { r: 16, g: 185, b: 129 }

async function makeIcon(size, paddingPct, outName) {
  const logoSize = Math.round(size * (1 - paddingPct * 2))
  const pad = Math.round((size - logoSize) / 2)

  await sharp(input)
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .flatten({ background: BG })
    .resize(size, size)
    .png()
    .toFile(path.join(publicDir, outName))

  console.log(`✓ ${outName} (${size}×${size}, padding ${Math.round(paddingPct*100)}%)`)
}

// Regular icons — 15% padding
await makeIcon(192, 0.15, 'icon-192.png')
await makeIcon(512, 0.15, 'icon-512.png')

// Maskable icons — 25% padding (Android safe zone)
await makeIcon(192, 0.25, 'icon-maskable-192.png')
await makeIcon(512, 0.25, 'icon-maskable-512.png')

console.log('Icons generated in public/')
