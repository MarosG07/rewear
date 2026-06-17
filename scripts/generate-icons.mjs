// Generates PWA / home-screen icons from the dark-bg logo, scaled down on the
// brand background so it keeps the original composition but doesn't overhang.
// Run with: node scripts/generate-icons.mjs  (requires sharp, dev dependency)
import sharp from "sharp";
import { readFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(root, "public");
const iconSrc = resolve(root, "scripts", "logo-icon.svg"); // dark square + spiral
const BG = { r: 0x23, g: 0x1e, b: 0x18, alpha: 1 }; // #231e18 (matches the logo bg)

const icon = await readFile(iconSrc);

async function makeIcon(size, name, pad) {
  const inner = Math.round(size * pad);
  // Render the whole logo (already centered as designed) smaller…
  const scaled = await sharp(icon, { density: 600 }).resize(inner, inner, { fit: "inside" }).png().toBuffer();
  // …and drop it onto a matching dark square so the extra space is uniform padding.
  await sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: scaled, gravity: "center" }])
    .png()
    .toFile(resolve(outDir, name));
  console.log(`✓ ${name} (${size}×${size}, ${Math.round(pad * 100)}%)`);
}

await mkdir(outDir, { recursive: true });
await makeIcon(192, "pwa-192.png", 0.84);
await makeIcon(512, "pwa-512.png", 0.84);
await makeIcon(512, "maskable-512.png", 0.7);
await makeIcon(180, "apple-touch-icon.png", 0.86);
await makeIcon(32, "favicon-32.png", 0.9);
console.log("Icons written to public/");
