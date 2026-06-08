#!/usr/bin/env node
import sharp from "sharp";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const out = resolve(__dirname, "..", "public", "og-image.png");

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="bg" cx="50%" cy="35%" r="70%">
      <stop offset="0%" stop-color="#2a2118"/>
      <stop offset="100%" stop-color="#15110c"/>
    </radialGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#e6c98a"/>
      <stop offset="100%" stop-color="#bf9c5a"/>
    </linearGradient>
  </defs>

  <!-- background -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- subtle frame -->
  <rect x="40" y="40" width="1120" height="550" rx="8" fill="none" stroke="#d4b26a" stroke-width="1" opacity="0.25"/>

  <!-- top eyebrow -->
  <g transform="translate(600 130)" text-anchor="middle">
    <line x1="-40" y1="-2" x2="-12" y2="-2" stroke="#d4b26a" stroke-width="1" opacity="0.5"/>
    <text font-family="Georgia, serif" fill="#d4b26a" font-size="16" letter-spacing="6">МЕНЮ</text>
    <line x1="12" y1="-2" x2="40" y2="-2" stroke="#d4b26a" stroke-width="1" opacity="0.5"/>
  </g>

  <!-- big title -->
  <text x="600" y="290" font-family="Georgia, serif" font-style="italic" fill="url(#gold)" font-size="140" text-anchor="middle" font-weight="400">
    <tspan font-style="italic">С</tspan><tspan font-style="normal" fill="#f5e9d0">азанчик</tspan>
  </text>

  <!-- fish + city -->
  <g transform="translate(600 380)" stroke="#d4b26a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none">
    <line x1="-180" y1="0" x2="-90" y2="0" opacity="0.5"/>
    <!-- fish left -->
    <g transform="translate(-65 0) scale(0.35)">
      <path d="M -150 30 C -110 -90, 90 -110, 170 -70 L 215 -110 L 200 30 L 215 170 L 170 130 C 90 170, -110 150, -150 30 Z" />
      <circle cx="-120" cy="-10" r="9" fill="#d4b26a" stroke="none"/>
    </g>
    <text x="0" y="8" text-anchor="middle" font-family="Georgia, serif" fill="#d4b26a" font-size="18" letter-spacing="12" stroke="none">CITY</text>
    <!-- fish right (mirrored) -->
    <g transform="translate(65 0) scale(-0.35 0.35)">
      <path d="M -150 30 C -110 -90, 90 -110, 170 -70 L 215 -110 L 200 30 L 215 170 L 170 130 C 90 170, -110 150, -150 30 Z" />
      <circle cx="-120" cy="-10" r="9" fill="#d4b26a" stroke="none"/>
    </g>
    <line x1="90" y1="0" x2="180" y2="0" opacity="0.5"/>
  </g>

  <!-- tagline -->
  <text x="600" y="470" font-family="-apple-system, system-ui, sans-serif" fill="#a89a85" font-size="22" text-anchor="middle">
    В лучших традициях узбекской кухни с нотками европейской изысканности
  </text>

  <!-- bottom info -->
  <text x="600" y="540" font-family="-apple-system, system-ui, sans-serif" fill="#7a7064" font-size="14" text-anchor="middle" letter-spacing="3">
    TASHKENT · RESTAURANT
  </text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile(out);
console.log(`✓ og-image.png saved → ${out}`);
