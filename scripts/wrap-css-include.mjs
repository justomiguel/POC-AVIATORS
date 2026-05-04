import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const css = readFileSync(join(root, 'gas', 'tailwind-built.css'), 'utf8');
const out =
  '<style>\n' +
  '/* Tailwind + app utilities — run: npm run build:css */\n' +
  css.trim() +
  '\n</style>\n';
writeFileSync(join(root, 'gas', 'tailwind-include.html'), out, 'utf8');
