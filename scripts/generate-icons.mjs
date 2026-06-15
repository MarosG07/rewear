// Generates PWA / home-screen icons from the Rewear Leaf logo.
// Run with: node scripts/generate-icons.mjs  (requires sharp, dev dependency)
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(root, "public");

// lucide "leaf" path, drawn white on the terracotta brand gradient.
const leaf = `
  <g transform="translate(106,106) scale(12.5)" fill="none" stroke="#ffffff"
     stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
  </g>`;

const gradient = `
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#C2794A"/>
      <stop offset="1" stop-color="#b36d3f"/>
    </linearGradient>
  </defs>`;

// rounded = nice standalone icon; square (rx 0) = maskable / apple-touch
// (iOS and Android apply their own rounding/masking).
const svg = (rx) => `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  ${gradient}
  <rect width="512" height="512" rx="${rx}" fill="url(#g)"/>
  ${leaf}
</svg>`;

const rounded = Buffer.from(svg(96));
const square = Buffer.from(svg(0));

const jobs = [
  { src: rounded, size: 192, name: "pwa-192.png" },
  { src: rounded, size: 512, name: "pwa-512.png" },
  { src: square, size: 512, name: "maskable-512.png" },
  { src: square, size: 180, name: "apple-touch-icon.png" },
  { src: rounded, size: 32, name: "favicon-32.png" },
];

await mkdir(outDir, { recursive: true });
for (const { src, size, name } of jobs) {
  await sharp(src).resize(size, size).png().toFile(resolve(outDir, name));
  console.log(`✓ ${name} (${size}×${size})`);
}
console.log("Icons written to public/");
