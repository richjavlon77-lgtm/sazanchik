#!/usr/bin/env node
import QRCode from "qrcode";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "..", "public", "qr");

const url = process.argv[2] || "https://sazanchik.uz";

mkdirSync(OUT_DIR, { recursive: true });

const pngPath = resolve(OUT_DIR, "menu.png");
const svgPath = resolve(OUT_DIR, "menu.svg");

const options = {
  errorCorrectionLevel: "H",
  margin: 2,
  width: 1200,
  color: {
    dark: "#1a1611",
    light: "#f5efe6",
  },
};

await QRCode.toFile(pngPath, url, options);

const svg = await QRCode.toString(url, { ...options, type: "svg" });
writeFileSync(svgPath, svg);

console.log(`QR generated for: ${url}`);
console.log(`  PNG → ${pngPath}`);
console.log(`  SVG → ${svgPath}`);
console.log(`\nUsage: npm run qr -- https://your-url.com`);
