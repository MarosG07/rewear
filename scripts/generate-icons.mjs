// Generates PWA / home-screen icons from the Rewear logo (dark-bg version).
// Run with: node scripts/generate-icons.mjs  (requires sharp, dev dependency)
import sharp from "sharp";
import { readFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(root, "public");
const src = resolve(root, "scripts", "logo-icon.svg");

const svg = await readFile(src);

const jobs = [
  { size: 192, name: "pwa-192.png" },
  { size: 512, name: "pwa-512.png" },
  { size: 512, name: "maskable-512.png" }, // full-bleed dark square → safe to mask
  { size: 180, name: "apple-touch-icon.png" },
  { size: 32, name: "favicon-32.png" },
];

await mkdir(outDir, { recursive: true });
for (const { size, name } of jobs) {
  // High density so the vector rasterizes crisply before downscaling.
  await sharp(svg, { density: 400 }).resize(size, size).png().toFile(resolve(outDir, name));
  console.log(`✓ ${name} (${size}×${size})`);
}
console.log("Icons written to public/");
