import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'

await mkdir('build', { recursive: true })
const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="116" fill="#16251f"/>
  <path d="M139 132c0-32 26-58 58-58h118c32 0 58 26 58 58 0 144-43 282-90 304-12 6-24-3-25-17-3-42-9-103-34-103s-31 61-34 103c-1 14-13 23-25 17-47-22-90-160-90-304 0-32 26-58 64-58z" fill="#f5faf7"/>
  <path d="M166 188l90 36 90-36M256 118v218" fill="none" stroke="#2ca276" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="211" cy="206" r="13" fill="#16251f" stroke="#f5faf7" stroke-width="8"/><circle cx="301" cy="206" r="13" fill="#16251f" stroke="#f5faf7" stroke-width="8"/>
</svg>`)
await sharp(svg).png().toFile('build/icon.png')
