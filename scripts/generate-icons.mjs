// Generates PWA / home-screen icons from the aligned master (logo-icon-master.png).
// Run with: node scripts/generate-icons.mjs  (requires sharp, dev dependency)
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(root, "public");
const master = resolve(root, "scripts", "logo-icon-master.png");
const BG = { r: 0x23, g: 0x1e, b: 0x18 }; // #231e18 — keep corners opaque for maskable

const sizes = [
  { size: 192, name: "pwa-192.png" },
  { size: 512, name: "pwa-512.png" },
  { size: 512, name: "maskable-512.png" },
  { size: 180, name: "apple-touch-icon.png" },
  { size: 32, name: "favicon-32.png" },
];

await mkdir(outDir, { recursive: true });
for (const { size, name } of sizes) {
  await sharp(master)
    .resize(size, size, { fit: "cover" })
    .flatten({ background: BG })
    .png()
    .toFile(resolve(outDir, name));
  console.log(`✓ ${name} (${size}×${size})`);
}
console.log("Icons written to public/");
