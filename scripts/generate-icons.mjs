// Generates PWA / home-screen icons: the spiral mark centered on the dark
// brand background with safe-zone padding so it doesn't overhang the edges.
// Run with: node scripts/generate-icons.mjs  (requires sharp, dev dependency)
import sharp from "sharp";
import { readFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(root, "public");
const markSrc = resolve(root, "src", "assets", "logo-mark.svg");
const BG = { r: 0x23, g: 0x1e, b: 0x18, alpha: 1 }; // #231e18

const mark = await readFile(markSrc);

async function makeIcon(size, name, pad) {
  const inner = Math.round(size * pad);
  const spiral = await sharp(mark, { density: 600 })
    .resize(inner, inner, { fit: "inside", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: spiral, gravity: "center" }])
    .png()
    .toFile(resolve(outDir, name));
  console.log(`✓ ${name} (${size}×${size}, ${Math.round(pad * 100)}% mark)`);
}

await mkdir(outDir, { recursive: true });
// Regular icons: ~26% padding. Maskable: more, for the OS safe zone. Favicon: tighter.
await makeIcon(192, "pwa-192.png", 0.74);
await makeIcon(512, "pwa-512.png", 0.74);
await makeIcon(512, "maskable-512.png", 0.62);
await makeIcon(180, "apple-touch-icon.png", 0.76);
await makeIcon(32, "favicon-32.png", 0.82);
console.log("Icons written to public/");
