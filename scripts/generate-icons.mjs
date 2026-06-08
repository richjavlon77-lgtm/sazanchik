#!/usr/bin/env node
/**
 * Generate PWA icons from the brand SVG.
 * Run: npm run icons
 */
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = resolve(__dirname, "..", "public");

mkdirSync(PUBLIC, { recursive: true });

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%" r="65%">
      <stop offset="0%" stop-color="#241d14"/>
      <stop offset="100%" stop-color="#1a1611"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>
  <g transform="translate(256 256)" fill="none" stroke="#d4b26a" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
    <!-- arched body -->
    <path d="M -150 30 C -110 -90, 90 -110, 170 -70 L 215 -110 L 200 30 L 215 170 L 170 130 C 90 170, -110 150, -150 30 Z" />
    <!-- top fin -->
    <path d="M -10 -90 C 10 -150, 80 -160, 110 -130 C 90 -110, 30 -100, -5 -85" />
    <!-- bottom fin -->
    <path d="M 10 90 C 30 150, 100 150, 130 110 C 110 100, 60 90, 25 95" />
    <!-- gill -->
    <path d="M -50 -40 C -40 30, -40 70, -50 130" stroke-width="4"/>
    <!-- eye -->
    <circle cx="-120" cy="-10" r="9" fill="#d4b26a"/>
    <!-- scales -->
    <path d="M 0 -40 C 25 -25, 50 -20, 75 -40" stroke-width="3" opacity="0.7"/>
    <path d="M 60 -40 C 85 -25, 110 -20, 135 -40" stroke-width="3" opacity="0.7"/>
    <path d="M 0 40 C 25 55, 50 60, 75 40" stroke-width="3" opacity="0.7"/>
    <path d="M 60 40 C 85 55, 110 60, 135 40" stroke-width="3" opacity="0.7"/>
  </g>
</svg>`;

const maskable = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#1a1611"/>
  <g transform="translate(256 256) scale(0.7)" fill="none" stroke="#d4b26a" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M -150 30 C -110 -90, 90 -110, 170 -70 L 215 -110 L 200 30 L 215 170 L 170 130 C 90 170, -110 150, -150 30 Z" />
    <path d="M -10 -90 C 10 -150, 80 -160, 110 -130 C 90 -110, 30 -100, -5 -85" />
    <path d="M 10 90 C 30 150, 100 150, 130 110 C 110 100, 60 90, 25 95" />
    <circle cx="-120" cy="-10" r="9" fill="#d4b26a"/>
  </g>
</svg>`;

const tasks = [
  { svg, size: 192, name: "icon-192.png" },
  { svg, size: 512, name: "icon-512.png" },
  { svg: maskable, size: 512, name: "icon-maskable.png" },
  { svg, size: 180, name: "apple-touch-icon.png" },
  { svg, size: 32, name: "favicon-32.png" },
  { svg, size: 16, name: "favicon-16.png" },
];

for (const task of tasks) {
  const buf = Buffer.from(task.svg);
  await sharp(buf).resize(task.size, task.size).png().toFile(resolve(PUBLIC, task.name));
  console.log(`✓ ${task.name} (${task.size}×${task.size})`);
}

// Also save the master SVG for hard-linking elsewhere
writeFileSync(resolve(PUBLIC, "logo.svg"), svg);
console.log(`✓ logo.svg`);
