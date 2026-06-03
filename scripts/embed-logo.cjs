#!/usr/bin/env node
/**
 * Lee logo.png (raíz del repo) y actualiza gas/index.html entre marcadores
 * AVIATORS_LOGO_EMBED_* con un <img> data: URL (Apps Script no sirve PNG aparte).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const pngPath = path.join(ROOT, 'logo.png');
const htmlPath = path.join(ROOT, 'gas', 'index.html');
const exportLogoPath = path.join(ROOT, 'gas', 'chat-export-logo.html');

if (!fs.existsSync(pngPath)) {
  console.error('No se encontró logo.png en la raíz del proyecto.');
  process.exit(1);
}

const buf = fs.readFileSync(pngPath);
const dataUrl = `data:image/png;base64,${buf.toString('base64')}`;
let html = fs.readFileSync(htmlPath, 'utf8');

const START = '<!-- AVIATORS_LOGO_EMBED_START -->';
const END = '<!-- AVIATORS_LOGO_EMBED_END -->';
if (!html.includes(START) || !html.includes(END)) {
  console.error('gas/index.html debe incluir los marcadores', START, 'y', END);
  process.exit(1);
}

const img = `<img
          id="aviators-logo"
          src="${dataUrl}"
          alt="Aviators"
          width="256"
          height="256"
          decoding="async"
          draggable="false"
        />`;

const re = new RegExp(`${START}[\\s\\S]*?${END}`, 'm');
html = html.replace(re, `${START}\n        ${img}\n        ${END}`);
fs.writeFileSync(htmlPath, html, 'utf8');

const exportFragment = `<img src="${dataUrl}" alt="Aviators" width="120" height="120" />\n`;
fs.writeFileSync(exportLogoPath, exportFragment, 'utf8');

console.log(`→ Logo embebido: logo.png (${buf.length} bytes → gas/index.html, chat-export-logo.html)`);
